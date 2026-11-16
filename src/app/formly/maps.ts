import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { Chip } from '@openng/optimus-ui/chip';
import * as L from 'leaflet';
import { Icon } from '../icon';
import { formatPoint, MapHit, parsePoint, searchAddress, splitPath } from './kit';

const DEFAULT_CENTER: L.LatLngTuple = [45.4642, 9.19];
const PIN = L.icon({
  iconRetinaUrl: '/maps/marker-icon-2x.png',
  iconUrl: '/maps/marker-icon.png',
  shadowUrl: '/maps/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

@Component({
  selector: 'app-map-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #host class="map-frame" [class.map-thumb]="compact()"></div>`,
})
export class MapCanvas {
  readonly points = input<[number, number][]>([]);
  readonly line = input(false);
  readonly interactive = input(false);
  readonly compact = input(false);
  readonly edited = output<[number, number][]>();
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private map?: L.Map;
  private markers: L.Layer[] = [];
  private polyline?: L.Polyline;
  private resize?: ResizeObserver;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const node = this.host().nativeElement;
      const compact = this.compact();
      this.map = L.map(node, compact ? { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false } : {});
      if (compact) this.map.attributionControl?.setPrefix(false);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: compact ? '© OSM' : '&copy; OpenStreetMap contributors',
        subdomains: 'abc',
        maxZoom: 19,
      }).addTo(this.map);
      this.map.on('click', (event: L.LeafletMouseEvent) => this.place(event.latlng));
      this.paint(this.points(), this.interactive(), this.line(), compact);
      this.resize = new ResizeObserver(() => this.map?.invalidateSize());
      this.resize.observe(node);
    });

    effect(() => {
      const points = this.points();
      const interactive = this.interactive();
      const line = this.line();
      const compact = this.compact();
      if (!this.map) return;
      this.paint(points, interactive, line, compact);
    });

    destroyRef.onDestroy(() => {
      this.resize?.disconnect();
      this.map?.remove();
      this.map = undefined;
    });
  }

  private place(at: L.LatLng): void {
    if (!this.interactive() || !this.map) return;
    const point: [number, number] = [at.lat, at.lng];
    this.edited.emit(this.line() ? [...this.points(), point] : [point]);
  }

  private paint(points: [number, number][], interactive: boolean, line: boolean, compact: boolean): void {
    const map = this.map;
    if (!map) return;
    this.markers.forEach((marker) => marker.remove());
    this.polyline?.remove();
    this.polyline = undefined;
    if (line && points.length > 1) {
      this.polyline = L.polyline(points, { color: '#3388ff', weight: compact ? 2 : 3 }).addTo(map);
    }
    this.markers = points.map((point) => {
      const marker = compact
        ? L.circleMarker(point, { radius: line ? 3 : 5, color: '#171717', weight: 1, fillColor: '#3388ff', fillOpacity: 1 })
        : L.marker(point, { draggable: interactive, icon: PIN });
      marker.addTo(map);
      if (!compact && marker instanceof L.Marker) {
        marker.on('dragend', () => {
          this.edited.emit(
            this.markers.flatMap((item) => {
              if (!(item instanceof L.Marker) && !(item instanceof L.CircleMarker)) return [];
              const at = item.getLatLng();
              return [[at.lat, at.lng] as [number, number]];
            }),
          );
        });
      }
      return marker;
    });
    if (points.length === 1) map.setView(points[0], compact ? 12 : 14);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: compact ? [12, 12] : [24, 24], maxZoom: compact ? 13 : 14 });
    else map.setView(DEFAULT_CENTER, compact ? 11 : 12);
  }
}

@Component({
  selector: 'app-formly-location',
  imports: [Icon, MapCanvas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="readonly">{{ label() || '—' }}</p>
    @if (!props.readonly) {
      <div class="lookup-actions">
        <input placeholder="Search an address" [value]="query()" (input)="query.set($any($event.target).value)" (keydown.enter)="search(); $event.preventDefault()" />
        <button type="button" class="icon-btn" aria-label="Search" title="Search" (click)="search()"><app-icon name="search" /></button>
      </div>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      @for (hit of results(); track hit.label) {
        <button type="button" class="btn btn-ghost place" (click)="choose(hit)">{{ hit.label }}</button>
      }
    }
    <app-map-canvas [points]="coordinates()" [interactive]="!props.readonly" (edited)="write($event)" />
  `,
})
export class LocationField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly query = signal('');
  readonly results = signal<MapHit[]>([]);
  readonly error = signal('');
  readonly label = signal('');
  readonly coordinates = signal<[number, number][]>([]);

  ngOnInit(): void {
    this.sync();
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sync());
  }

  async search(): Promise<void> {
    const query = this.query().trim();
    if (!query) {
      this.error.set('Type an address.');
      this.results.set([]);
      return;
    }
    this.error.set('');
    try {
      this.results.set(await searchAddress(query));
      if (this.results().length === 0) this.error.set('No address found.');
    } catch {
      this.error.set('Address search is unavailable.');
    }
  }

  choose(hit: MapHit): void {
    this.write([[hit.lat, hit.lng]]);
    this.results.set([]);
  }

  write(points: [number, number][]): void {
    const point = points[0];
    this.formControl.setValue(point ? formatPoint(point[0], point[1]) : '');
    this.formControl.markAsDirty();
  }

  private sync(): void {
    const text = String(this.formControl.value ?? '');
    this.label.set(text);
    const parsed = parsePoint(text);
    this.coordinates.set(parsed ? [parsed] : []);
  }
}

@Component({
  selector: 'app-formly-path',
  imports: [Icon, MapCanvas, Chip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!props.readonly) {
      <div class="lookup-actions">
        <input placeholder="Search an address to add" [value]="query()" (input)="query.set($any($event.target).value)" (keydown.enter)="search(); $event.preventDefault()" />
        <button type="button" class="icon-btn" aria-label="Search" title="Search" (click)="search()"><app-icon name="search" /></button>
      </div>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      @for (hit of results(); track hit.label) {
        <button type="button" class="btn btn-ghost place" (click)="add(hit)">{{ hit.label }}</button>
      }
    }
    <app-map-canvas [points]="coordinates()" [line]="true" [interactive]="!props.readonly" (edited)="write($event)" />
    <div class="path-chips">
      @for (point of labels(); track $index) {
        <p-chip [label]="point" [removable]="!props.readonly" (onRemove)="remove($index)" />
      } @empty {
        <p class="hint">No points</p>
      }
    </div>
  `,
})
export class PathField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly query = signal('');
  readonly results = signal<MapHit[]>([]);
  readonly error = signal('');
  readonly labels = signal<string[]>([]);
  readonly coordinates = signal<[number, number][]>([]);

  ngOnInit(): void {
    this.sync();
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sync());
  }

  async search(): Promise<void> {
    const query = this.query().trim();
    if (!query) {
      this.error.set('Type an address.');
      return;
    }
    this.error.set('');
    try {
      this.results.set(await searchAddress(query));
      if (this.results().length === 0) this.error.set('No address found.');
    } catch {
      this.error.set('Address search is unavailable.');
    }
  }

  add(hit: MapHit): void {
    this.write([...this.coordinates(), [hit.lat, hit.lng]]);
    this.results.set([]);
  }

  remove(index: number): void {
    this.write(this.coordinates().filter((_, item) => item !== index));
  }

  write(points: [number, number][]): void {
    this.formControl.setValue(points.map(([lat, lng]) => formatPoint(lat, lng)).join('; '));
    this.formControl.markAsDirty();
  }

  private sync(): void {
    const labels = splitPath(String(this.formControl.value ?? ''));
    this.labels.set(labels);
    this.coordinates.set(labels.flatMap((label) => {
      const parsed = parsePoint(label);
      return parsed ? [parsed] : [];
    }));
  }
}
