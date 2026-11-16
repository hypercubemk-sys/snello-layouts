import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { formatPoint, mapEmbed, MapHit, parsePoint, searchAddress, splitPath } from './kit';
import { Icon } from '../icon';

@Component({
  selector: 'app-formly-location',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="readonly">{{ point() || '—' }}</p>
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
    @if (frame()) {
      <iframe class="map-frame" [src]="frame()" title="Map"></iframe>
    }
  `,
})
export class LocationField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  readonly query = signal('');
  readonly results = signal<MapHit[]>([]);
  readonly error = signal('');
  readonly frame = signal<SafeResourceUrl | null>(null);
  private readonly tick = signal(0);

  point(): string {
    this.tick();
    return String(this.formControl.value ?? '');
  }

  ngOnInit(): void {
    this.refresh();
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
    this.formControl.setValue(formatPoint(hit.lat, hit.lng));
    this.formControl.markAsDirty();
    this.results.set([]);
    this.refresh();
  }

  private refresh(): void {
    const parsed = parsePoint(this.point());
    const lat = parsed?.[0] ?? 45.4642;
    const lng = parsed?.[1] ?? 9.19;
    this.frame.set(this.sanitizer.bypassSecurityTrustResourceUrl(mapEmbed(lat, lng, !!parsed)));
    this.tick.update((value) => value + 1);
  }
}

@Component({
  selector: 'app-formly-path',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="path">
      @for (point of points(); track $index) {
        <li>
          <span>{{ point }}</span>
          @if (!props.readonly) {
            <button type="button" (click)="remove($index)">×</button>
          }
        </li>
      } @empty {
        <li class="hint">No points</li>
      }
    </ol>
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
    @if (frame()) {
      <iframe class="map-frame" [src]="frame()" title="Path"></iframe>
    }
  `,
})
export class PathField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  readonly query = signal('');
  readonly results = signal<MapHit[]>([]);
  readonly error = signal('');
  readonly frame = signal<SafeResourceUrl | null>(null);
  private readonly tick = signal(0);

  ngOnInit(): void {
    this.refresh();
  }

  points(): string[] {
    this.tick();
    return splitPath(String(this.formControl.value ?? ''));
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
    this.formControl.setValue([...this.points(), formatPoint(hit.lat, hit.lng)].join('; '));
    this.formControl.markAsDirty();
    this.results.set([]);
    this.refresh();
  }

  remove(index: number): void {
    const next = this.points().filter((_, item) => item !== index);
    this.formControl.setValue(next.join('; '));
    this.formControl.markAsDirty();
    this.refresh();
  }

  private refresh(): void {
    const last = this.points().at(-1);
    const parsed = last ? parsePoint(last) : null;
    const lat = parsed?.[0] ?? 45.4642;
    const lng = parsed?.[1] ?? 9.19;
    this.frame.set(this.sanitizer.bypassSecurityTrustResourceUrl(mapEmbed(lat, lng, !!parsed)));
    this.tick.update((value) => value + 1);
  }
}
