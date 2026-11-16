import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient, httpResource } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { SnelloApi } from '../core/snello-api';
import { rowsOf, StoredDocument } from './kit';
import { Icon } from '../icon';

@Component({
  selector: 'app-formly-media',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ fileName() }}</p>
    } @else {
      <input type="file" [id]="id" (change)="onFile($event)" [disabled]="!canUpload()" />
      @if (!canUpload()) {
        <p class="hint">Attach the file after the record is saved.</p>
      }
    }
    @if (uuid()) {
      <p><a [href]="download()" target="_blank" rel="noopener">Download {{ fileName() }}</a></p>
    }
    @if (video()) {
      <video class="video" controls [src]="download()"></video>
    }
    @if (note()) {
      <p class="error">{{ note() }}</p>
    }
  `,
})
export class MediaField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly api = inject(SnelloApi);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly uuid = signal('');
  readonly note = signal('');
  readonly busy = signal(false);
  private readonly meta = httpResource<StoredDocument | null>(
    () => {
      const id = this.uuid();
      return id ? this.api.documentRequest(id) : undefined;
    },
    {
      defaultValue: null,
      parse: (value) => (value && typeof value === 'object' ? (value as StoredDocument) : null),
    },
  );

  ngOnInit(): void {
    this.uuid.set(this.read());
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.uuid.set(this.read()));
  }

  canUpload(): boolean {
    return !this.props.readonly && !!this.props['tableName'] && !!this.props['recordKey'];
  }

  fileName(): string {
    const status = this.meta.status();
    const document = status === 'resolved' || status === 'local' ? this.meta.value() : null;
    return document?.original_name || this.uuid() || '—';
  }

  download(): string {
    return this.uuid() ? this.api.documentUrl(this.uuid()) : '';
  }

  video(): boolean {
    const status = this.meta.status();
    const document = status === 'resolved' || status === 'local' ? this.meta.value() : null;
    return (document?.mimetype || '').toLowerCase() === 'video/mp4';
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.upload(file);
  }

  private async upload(file: File): Promise<void> {
    const table = this.props['tableName'];
    const key = this.props['recordKey'];
    if (!table || !key) {
      this.note.set('Attach the file after the record is saved.');
      return;
    }
    const body = new FormData();
    body.append('file', file, file.name);
    body.append('original_name', file.name);
    body.append('table_name', String(table));
    body.append('table_key', String(key));
    body.append('mimeType', file.type);
    this.busy.set(true);
    this.note.set('');
    try {
      const saved = await firstValueFrom(this.http.post<StoredDocument>(this.api.documents, body));
      if (saved?.uuid) {
        this.formControl.setValue(saved.uuid);
        this.formControl.markAsDirty();
      }
    } catch {
      this.note.set('Upload failed.');
    } finally {
      this.busy.set(false);
    }
  }

  private read(): string {
    const value = this.formControl.value;
    return typeof value === 'string' ? value.trim() : '';
  }
}

@Component({
  selector: 'app-formly-image',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (preview()) {
      <img class="preview" [src]="preview()" alt="" />
    } @else if (props.readonly) {
      <p class="readonly">—</p>
    }
    @if (!props.readonly) {
      <div class="lookup-actions">
        <button type="button" class="icon-btn btn-primary" aria-label="Choose image" title="Choose image" (click)="open.set(true)"><app-icon name="image" /></button>
        <button type="button" class="icon-btn" aria-label="Upload JPG or PNG" title="Upload JPG or PNG" [disabled]="!canUpload() || busy()" (click)="file.click()"><app-icon name="upload" /></button>
        <button type="button" class="icon-btn" aria-label="Remove" title="Remove" [disabled]="!uuid()" (click)="clear()"><app-icon name="minus" /></button>
        <input #file hidden type="file" accept="image/jpeg,image/png" (change)="onFile($event)" />
      </div>
      @if (!canUpload()) {
        <p class="hint">Upload needs a saved record. You can still choose an existing image.</p>
      }
    }
    @if (note()) {
      <p class="error">{{ note() }}</p>
    }
    @if (open()) {
      <div class="sheet-back" (click)="open.set(false)">
        <section class="sheet" (click)="$event.stopPropagation()">
          <header>
            <strong>Images</strong>
            <button type="button" class="icon-btn" aria-label="Close" title="Close" (click)="open.set(false)"><app-icon name="close" /></button>
          </header>
          <input placeholder="File name" [value]="search()" (input)="search.set($any($event.target).value)" />
          @if (gallery.isLoading()) {
            <p class="hint">Loading images…</p>
          }
          <div class="gallery">
            @for (item of images(); track item['uuid']) {
              <button type="button" (click)="choose(item)">
                <img [src]="thumb(item)" alt="" />
                <span>{{ nameOf(item) }}</span>
              </button>
            } @empty {
              <p class="hint">No images.</p>
            }
          </div>
        </section>
      </div>
    }
  `,
})
export class ImageField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly api = inject(SnelloApi);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  readonly uuid = signal('');
  readonly open = signal(false);
  readonly search = signal('');
  readonly note = signal('');
  readonly busy = signal(false);
  private readonly gallery = httpResource<Record<string, unknown>[]>(
    () => (this.open() ? this.api.documentsRequest(this.search()) : undefined),
    { defaultValue: [], parse: rowsOf },
  );

  ngOnInit(): void {
    this.uuid.set(this.read());
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.uuid.set(this.read()));
  }

  preview(): string | null {
    const id = this.uuid();
    return id.length >= 8 ? this.api.documentUrl(id) : null;
  }

  images(): Record<string, unknown>[] {
    const status = this.gallery.status();
    return status === 'resolved' || status === 'local' ? this.gallery.value() : [];
  }

  canUpload(): boolean {
    return !!this.props['tableName'] && !!this.props['recordKey'];
  }

  thumb(item: Record<string, unknown>): string {
    return this.api.documentUrl(String(item['uuid'] ?? ''));
  }

  nameOf(item: Record<string, unknown>): string {
    return String(item['original_name'] ?? item['uuid'] ?? '');
  }

  choose(item: Record<string, unknown>): void {
    const id = String(item['uuid'] ?? '');
    if (!id) return;
    this.formControl.setValue(id);
    this.formControl.markAsDirty();
    this.open.set(false);
  }

  clear(): void {
    this.formControl.setValue(null);
    this.formControl.markAsDirty();
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      this.note.set('Unsupported format. Upload PNG or JPG only.');
      return;
    }
    void this.upload(file);
  }

  private async upload(file: File): Promise<void> {
    const table = this.props['tableName'];
    const key = this.props['recordKey'];
    if (!table || !key) {
      this.note.set('Save the record before attaching an image.');
      return;
    }
    const body = new FormData();
    body.append('file', file, file.name);
    body.append('original_name', file.name);
    body.append('table_name', String(table));
    body.append('table_key', String(key));
    body.append('mimeType', file.type);
    this.busy.set(true);
    this.note.set('');
    try {
      const saved = await firstValueFrom(this.http.post<StoredDocument>(this.api.documents, body));
      if (saved?.uuid) {
        this.formControl.setValue(saved.uuid);
        this.formControl.markAsDirty();
      }
    } catch {
      this.note.set('Image upload failed.');
    } finally {
      this.busy.set(false);
    }
  }

  private read(): string {
    const value = this.formControl.value;
    return typeof value === 'string' ? value.trim() : '';
  }
}
