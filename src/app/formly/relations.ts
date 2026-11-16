import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { joinKeyName, joinLabelName, joinSelect, SnelloApi } from '../core/snello-api';
import { MetadataCatalog } from '../core/metadata-catalog';
import { FieldDefinition, Metadata, SelectOption } from '../core/models';
import { cellText, definitionOf, humanLabel, labeledOption, popupColumns, relationMark, rowsOf, splitCsv } from './kit';
import { Icon } from '../icon';
import { MetaIcon } from '../meta-icon';

@Component({
  selector: 'app-formly-join',
  imports: [FormlyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ currentLabel() || '—' }}</p>
    } @else {
      <div class="suggest">
        <input
          [id]="id"
          [value]="draft() ?? currentLabel()"
          placeholder="Search and choose"
          (focus)="open.set(true)"
          (input)="type($any($event.target).value)"
          (blur)="open.set(false)" />
        @if (open()) {
          <ul (mousedown)="$event.preventDefault()">
            @if (suggestions.isLoading()) {
              <li class="hint">Loading…</li>
            }
            @for (option of suggestionOptions(); track option.value) {
              <li><button type="button" (click)="pick(option)">{{ option.label }}</button></li>
            } @empty {
              @if (!suggestions.isLoading()) {
                <li class="hint">No value</li>
              }
            }
          </ul>
        }
      </div>
    }
  `,
})
export class JoinField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly api = inject(SnelloApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly definition = signal<FieldDefinition | null>(null);
  readonly open = signal(false);
  readonly draft = signal<string | null>(null);
  readonly query = signal('');
  private readonly selectedId = signal('');
  private readonly suggestions = httpResource<Record<string, unknown>[]>(
    () => {
      const definition = this.definition();
      if (!definition || !this.open()) return undefined;
      return this.api.joinRequest(definition, this.query());
    },
    { defaultValue: [], parse: rowsOf },
  );
  private readonly current = httpResource<Record<string, unknown> | null>(
    () => {
      const definition = this.definition();
      const id = this.selectedId();
      if (!definition?.join_table_name || !id) return undefined;
      return this.api.recordRequest(definition.join_table_name, id);
    },
    {
      defaultValue: null,
      parse: (value) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : null),
    },
  );

  ngOnInit(): void {
    const definition = definitionOf(this);
    this.definition.set(definition);
    this.selectedId.set(this.readKey(this.formControl.value));
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.selectedId.set(this.readKey(value));
    });
  }

  suggestionOptions(): SelectOption[] {
    return this.toOptions(this.suggestions.status(), () => this.suggestions.value());
  }

  currentLabel(): string {
    const status = this.current.status();
    if (status !== 'resolved' && status !== 'local') return '';
    return this.rowLabel(this.current.value());
  }

  type(value: string): void {
    this.draft.set(value);
    this.query.set(value);
    this.open.set(true);
  }

  pick(option: SelectOption): void {
    this.formControl.setValue(option.value);
    this.formControl.markAsDirty();
    this.draft.set(option.label);
    this.open.set(false);
  }

  private readKey(value: unknown): string {
    if (value == null || value === '') return '';
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const key = joinKeyName(this.definition());
      const id = record[key] ?? record['uuid'];
      return id == null ? '' : String(id);
    }
    return String(value);
  }

  private toOptions(status: string, read: () => Record<string, unknown>[]): SelectOption[] {
    if (status !== 'resolved' && status !== 'local') return [];
    const definition = this.definition();
    const key = joinKeyName(definition);
    const label = joinLabelName(definition);
    return read()
      .map((row) => labeledOption(row, key, label))
      .filter((option): option is SelectOption => !!option);
  }

  private rowLabel(row: Record<string, unknown> | null): string {
    if (!row) return '';
    return humanLabel(row, [joinLabelName(this.definition())]);
  }
}

@Component({
  selector: 'app-formly-lookup',
  imports: [FormlyModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (searching) {
      <div class="chips">
        @for (item of searchChips(); track item.value) {
          <span>
            {{ item.label }}
            <button type="button" [attr.aria-label]="'Remove ' + item.label" [attr.title]="'Remove ' + item.label" (click)="drop(item.value)">×</button>
          </span>
        } @empty {
          <em class="hint">Any</em>
        }
      </div>
    } @else {
      <p class="readonly">{{ currentLabel() || 'No value' }}</p>
    }
    @if (!props.readonly) {
      <div class="lookup-actions">
        <button type="button" class="icon-btn btn-primary" aria-label="Select" title="Select" (click)="open.set(true)"><app-icon name="search" /></button>
        <button type="button" class="icon-btn" aria-label="Clear" title="Clear" [disabled]="searching ? ids().length === 0 : !selectedId()" (click)="clear()"><app-icon name="close" /></button>
      </div>
    }
    @if (open()) {
      <div class="sheet-back" (click)="open.set(false)">
        <section class="sheet" (click)="$event.stopPropagation()">
          <header>
            <strong>Select value</strong>
            <button type="button" class="icon-btn" aria-label="Close" title="Close" (click)="open.set(false)"><app-icon name="close" /></button>
          </header>
          <div class="lookup-actions">
            <input placeholder="Search" [value]="query()" (input)="query.set($any($event.target).value)" (keydown.enter)="applyQuery(); $event.preventDefault()" />
            <button type="button" class="icon-btn" aria-label="Search" title="Search" (click)="applyQuery()"><app-icon name="search" /></button>
          </div>
          @if (rows.isLoading()) {
            <p class="hint">Loading records…</p>
          }
          <div class="table-scroll">
            <table class="data">
              <tbody>
                @for (row of table(); track rowId(row)) {
                  @if (searching) {
                    <tr [class.picked]="ids().includes(rowId(row))">
                      <td class="pick-cell">
                        <button type="button" class="icon-btn btn-primary" aria-label="Select this one" title="Select this one" (click)="chooseOne(row)"><app-icon name="check" /></button>
                        <button type="button" class="icon-btn" [class.flagged]="ids().includes(rowId(row))" aria-label="Add to the selection" title="Add to the selection" (click)="toggle(row)"><app-icon name="flag" /></button>
                      </td>
                      @for (column of columns(); track column) {
                        <td>{{ cell(row, column) }}</td>
                      }
                    </tr>
                  } @else {
                    <tr class="pickable" [class.picked]="rowId(row) === selectedId()" (click)="choose(row)">
                      @for (column of columns(); track column) {
                        <td>{{ cell(row, column) }}</td>
                      }
                    </tr>
                  }
                } @empty {
                  <tr><td>No results.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>
    }
  `,
})
export class LookupField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly api = inject(SnelloApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly definition = signal<FieldDefinition | null>(null);
  readonly open = signal(false);
  readonly query = signal('');
  readonly applied = signal('');
  readonly selectedId = signal('');
  readonly ids = signal<string[]>([]);
  private readonly rows = httpResource<Record<string, unknown>[]>(
    () => {
      const definition = this.definition();
      if (!definition || !this.open()) return undefined;
      return this.api.joinRequest(definition, this.applied(), 50);
    },
    { defaultValue: [], parse: rowsOf },
  );
  private readonly current = httpResource<Record<string, unknown> | null>(
    () => {
      const definition = this.definition();
      const id = this.selectedId();
      if (!definition?.join_table_name || !id) return undefined;
      return this.api.recordRequest(definition.join_table_name, id);
    },
    {
      defaultValue: null,
      parse: (value) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : null),
    },
  );
  readonly table = computed(() => {
    const status = this.rows.status();
    return status === 'resolved' || status === 'local' ? this.rows.value() : [];
  });
  private readonly linked = httpResource<Record<string, unknown>[]>(
    () => {
      const definition = this.definition();
      const ids = this.ids();
      if (!this.searching || !definition?.join_table_name || ids.length === 0) return undefined;
      return this.api.recordsByKeys(definition.join_table_name, joinKeyName(definition), ids, joinSelect(definition));
    },
    { defaultValue: [], parse: rowsOf },
  );
  readonly columns = computed(() => popupColumns(this.table()[0]));

  get searching(): boolean {
    return this.props['search'] === true;
  }

  ngOnInit(): void {
    this.definition.set(definitionOf(this));
    this.sync(this.formControl.value);
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.sync(value));
  }

  currentLabel(): string {
    const status = this.current.status();
    if (status !== 'resolved' && status !== 'local') return '';
    return humanLabel(this.current.value(), [joinLabelName(this.definition())]);
  }

  searchChips(): SelectOption[] {
    const status = this.linked.status();
    const rows = status === 'resolved' || status === 'local' ? this.linked.value() : [];
    const key = joinKeyName(this.definition());
    const label = joinLabelName(this.definition());
    const labels = new Map(rows.map((row) => [String(row[key] ?? ''), humanLabel(row, [label])]));
    return this.ids().map((id) => ({ value: id, label: labels.get(id) || 'Record' }));
  }

  applyQuery(): void {
    this.applied.set(this.query());
  }

  choose(row: Record<string, unknown>): void {
    const id = this.rowId(row);
    if (!id) return;
    this.formControl.setValue(id);
    this.formControl.markAsDirty();
    this.open.set(false);
  }

  chooseOne(row: Record<string, unknown>): void {
    const id = this.rowId(row);
    if (!id) return;
    this.formControl.setValue([id]);
    this.formControl.markAsDirty();
    this.open.set(false);
  }

  toggle(row: Record<string, unknown>): void {
    const id = this.rowId(row);
    if (!id) return;
    const current = this.ids();
    this.formControl.setValue(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    this.formControl.markAsDirty();
  }

  drop(id: string): void {
    const next = this.ids().filter((item) => item !== id);
    this.formControl.setValue(next.length ? next : null);
    this.formControl.markAsDirty();
  }

  clear(): void {
    this.formControl.setValue(null);
    this.formControl.markAsDirty();
  }

  rowId(row: Record<string, unknown>): string {
    const key = joinKeyName(this.definition());
    const value = row[key] ?? row['uuid'];
    return value == null ? '' : String(value);
  }

  cell(row: Record<string, unknown>, column: string): string {
    return cellText(row[column]);
  }

  private sync(value: unknown): void {
    if (this.searching) this.ids.set(splitCsv(value));
    else this.selectedId.set(this.readKey(value));
  }

  private readKey(value: unknown): string {
    if (value == null || value === '') return '';
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const id = record[joinKeyName(this.definition())] ?? record['uuid'];
      return id == null ? '' : String(id);
    }
    return String(value);
  }
}

@Component({
  selector: 'app-formly-multijoin',
  imports: [FormlyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chips">
      @for (item of selected(); track item.value) {
        <span>
          {{ item.label }}
          @if (!props.readonly) {
            <button type="button" (click)="remove(item.value)">×</button>
          }
        </span>
      } @empty {
        <em class="hint">No value</em>
      }
    </div>
    @if (!props.readonly) {
      <div class="suggest">
        <input placeholder="Search and add" [value]="draft()" (focus)="open.set(true)" (input)="type($any($event.target).value)" (blur)="open.set(false)" />
        @if (open()) {
          <ul (mousedown)="$event.preventDefault()">
            @for (option of suggestionsOptions(); track option.value) {
              <li><button type="button" (click)="add(option)">{{ option.label }}</button></li>
            } @empty {
              <li class="hint">No value</li>
            }
          </ul>
        }
      </div>
    }
  `,
})
export class MultijoinField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly api = inject(SnelloApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly definition = signal<FieldDefinition | null>(null);
  readonly open = signal(false);
  readonly draft = signal('');
  readonly query = signal('');
  readonly ids = signal<string[]>([]);
  private readonly suggestions = httpResource<Record<string, unknown>[]>(
    () => {
      const definition = this.definition();
      if (!definition || !this.open()) return undefined;
      return this.api.joinRequest(definition, this.query());
    },
    { defaultValue: [], parse: rowsOf },
  );
  private readonly linked = httpResource<Record<string, unknown>[]>(
    () => {
      const definition = this.definition();
      const ids = this.ids();
      if (!definition?.join_table_name || ids.length === 0) return undefined;
      return this.api.recordsByKeys(definition.join_table_name, joinKeyName(definition), ids, joinSelect(definition));
    },
    { defaultValue: [], parse: rowsOf },
  );

  ngOnInit(): void {
    this.definition.set(definitionOf(this));
    this.ids.set(splitCsv(this.formControl.value));
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.ids.set(splitCsv(value)));
  }

  selected(): SelectOption[] {
    const labels = new Map(this.linkedOptions().map((option) => [option.value, option.label]));
    return this.ids().map((id) => ({ value: id, label: labels.get(id) || 'Record' }));
  }

  suggestionsOptions(): SelectOption[] {
    const chosen = new Set(this.ids());
    return this.toOptions(this.suggestions.status(), () => this.suggestions.value()).filter((option) => !chosen.has(option.value));
  }

  type(value: string): void {
    this.draft.set(value);
    this.query.set(value);
    this.open.set(true);
  }

  add(option: SelectOption): void {
    if (this.ids().includes(option.value)) return;
    this.write([...this.ids(), option.value]);
    this.draft.set('');
    this.query.set('');
    this.open.set(false);
  }

  remove(id: string): void {
    this.write(this.ids().filter((item) => item !== id));
  }

  private write(ids: string[]): void {
    this.formControl.setValue(ids);
    this.formControl.markAsDirty();
  }

  private linkedOptions(): SelectOption[] {
    return this.toOptions(this.linked.status(), () => this.linked.value());
  }

  private toOptions(status: string, read: () => Record<string, unknown>[]): SelectOption[] {
    if (status !== 'resolved' && status !== 'local') return [];
    const key = joinKeyName(this.definition());
    const label = joinLabelName(this.definition());
    return read()
      .map((row) => labeledOption(row, key, label))
      .filter((option): option is SelectOption => !!option);
  }
}

@Component({
  selector: 'app-formly-multilookup',
  imports: [FormlyModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chips">
      @for (item of selected(); track item.value) {
        <span>
          {{ item.label }}
          @if (!props.readonly) {
            <button type="button" (click)="remove(item.value)">×</button>
          }
        </span>
      } @empty {
        <em class="hint">No value</em>
      }
    </div>
    @if (!props.readonly) {
      <div class="lookup-actions">
        <button type="button" class="icon-btn btn-primary" aria-label="Select" title="Select" (click)="begin()"><app-icon name="search" /></button>
        <button type="button" class="icon-btn" aria-label="Clear" title="Clear" [disabled]="ids().length === 0" (click)="clear()"><app-icon name="close" /></button>
      </div>
    }
    @if (open()) {
      <div class="sheet-back" (click)="open.set(false)">
        <section class="sheet" (click)="$event.stopPropagation()">
          <header>
            <strong>Select values</strong>
            <button type="button" class="icon-btn" aria-label="Close" title="Close" (click)="open.set(false)"><app-icon name="close" /></button>
          </header>
          <div class="lookup-actions">
            <input placeholder="Search" [value]="query()" (input)="query.set($any($event.target).value)" (keydown.enter)="applied.set(query()); $event.preventDefault()" />
            <button type="button" class="icon-btn" aria-label="Search" title="Search" (click)="applied.set(query())"><app-icon name="search" /></button>
          </div>
          <div class="table-scroll">
            <table class="data">
              <tbody>
                @for (row of table(); track rowId(row)) {
                  <tr [class.picked]="pending().includes(rowId(row))" (click)="toggle(row)">
                    @for (column of columns(); track column) {
                      <td>{{ cell(row, column) }}</td>
                    }
                  </tr>
                } @empty {
                  <tr><td>No results.</td></tr>
                }
              </tbody>
            </table>
          </div>
          <div class="lookup-actions">
            <button type="button" class="icon-btn btn-primary" aria-label="Confirm" title="Confirm" (click)="confirm()"><app-icon name="check" /></button>
            <button type="button" class="icon-btn" aria-label="Cancel" title="Cancel" (click)="open.set(false)"><app-icon name="close" /></button>
          </div>
        </section>
      </div>
    }
  `,
})
export class MultilookupField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly api = inject(SnelloApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly definition = signal<FieldDefinition | null>(null);
  readonly open = signal(false);
  readonly query = signal('');
  readonly applied = signal('');
  readonly ids = signal<string[]>([]);
  readonly pending = signal<string[]>([]);
  private readonly rows = httpResource<Record<string, unknown>[]>(
    () => {
      const definition = this.definition();
      if (!definition || !this.open()) return undefined;
      return this.api.joinRequest(definition, this.applied(), 50);
    },
    { defaultValue: [], parse: rowsOf },
  );
  private readonly linked = httpResource<Record<string, unknown>[]>(
    () => {
      const definition = this.definition();
      const ids = this.ids();
      if (!definition?.join_table_name || ids.length === 0) return undefined;
      return this.api.recordsByKeys(definition.join_table_name, joinKeyName(definition), ids, joinSelect(definition));
    },
    { defaultValue: [], parse: rowsOf },
  );
  readonly table = computed(() => {
    const status = this.rows.status();
    return status === 'resolved' || status === 'local' ? this.rows.value() : [];
  });
  readonly columns = computed(() => popupColumns(this.table()[0]));

  ngOnInit(): void {
    this.definition.set(definitionOf(this));
    this.ids.set(splitCsv(this.formControl.value));
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.ids.set(splitCsv(value)));
  }

  selected(): SelectOption[] {
    const status = this.linked.status();
    const rows = status === 'resolved' || status === 'local' ? this.linked.value() : [];
    const key = joinKeyName(this.definition());
    const label = joinLabelName(this.definition());
    const labels = new Map(rows.map((row) => [String(row[key] ?? ''), humanLabel(row, [label])]));
    return this.ids().map((id) => ({ value: id, label: labels.get(id) || 'Record' }));
  }

  begin(): void {
    this.pending.set(this.ids());
    this.open.set(true);
  }

  toggle(row: Record<string, unknown>): void {
    const id = this.rowId(row);
    if (!id) return;
    const current = this.pending();
    this.pending.set(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  confirm(): void {
    this.formControl.setValue(this.pending());
    this.formControl.markAsDirty();
    this.open.set(false);
  }

  remove(id: string): void {
    this.formControl.setValue(this.ids().filter((item) => item !== id));
    this.formControl.markAsDirty();
  }

  clear(): void {
    this.formControl.setValue([]);
    this.formControl.markAsDirty();
  }

  rowId(row: Record<string, unknown>): string {
    const value = row[joinKeyName(this.definition())] ?? row['uuid'];
    return value == null ? '' : String(value);
  }

  cell(row: Record<string, unknown>, column: string): string {
    return cellText(row[column]);
  }
}

@Component({
  selector: 'app-formly-relationships',
  imports: [FormlyModule, Icon, MetaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chips">
      @for (item of chips(); track item) {
        <span>
          <app-meta-icon [icon]="catalog.icon(mark(item).name)" [label]="chipCaption(item)" />
          {{ chipCaption(item) }}
          @if (!props.readonly) {
            <button type="button" [attr.aria-label]="'Remove ' + chipCaption(item)" [attr.title]="'Remove ' + chipCaption(item)" (click)="remove(item)">×</button>
          }
        </span>
      } @empty {
        <em class="hint">No relationship</em>
      }
    </div>
    @if (!props.readonly) {
      <button type="button" class="icon-btn" aria-label="Add relationship" title="Add relationship" (click)="open.set(true)"><app-icon name="plus" /></button>
    }
    @if (open()) {
      <div class="sheet-back" (click)="open.set(false)">
        <section class="sheet" (click)="$event.stopPropagation()">
          <header>
            <strong>Select relationship</strong>
            <button type="button" class="icon-btn" aria-label="Close" title="Close" (click)="open.set(false)"><app-icon name="close" /></button>
          </header>
          <div class="meta-pick">
            @if (metadataName()) {
              <app-meta-icon [icon]="catalog.icon(metadataName())" [label]="metadataName()" />
            }
            <select [value]="metadataName()" (change)="metadataName.set($any($event.target).value)">
              <option value="" [selected]="!metadataName()">Metadata</option>
              @for (metadata of metadatas(); track metadata.uuid) {
                <option [value]="metadata.table_name" [selected]="metadata.table_name === metadataName()">{{ metadata.description || metadata.table_name }}</option>
              }
            </select>
          </div>
          <input placeholder="Filter loaded records" [value]="query()" (input)="query.set($any($event.target).value)" />
          @if (rows.isLoading()) {
            <p class="hint">Loading records…</p>
          }
          <ul class="picker-list">
            @for (row of filtered(); track track(row)) {
              <li class="picker-row">
                <span>{{ rowLabel(row) }}</span>
                <button type="button" class="icon-btn btn-primary" aria-label="Select this one" title="Select this one" (click)="chooseOne(row)"><app-icon name="check" /></button>
                <button type="button" class="icon-btn" [class.flagged]="flagged(row)" aria-label="Add to the selection" title="Add to the selection" (click)="accumulate(row)"><app-icon name="flag" /></button>
              </li>
            } @empty {
              <li class="hint">No records.</li>
            }
          </ul>
        </section>
      </div>
    }
  `,
})
export class RelationshipsField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly api = inject(SnelloApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly catalog = inject(MetadataCatalog);
  readonly open = signal(false);
  readonly metadataName = signal('');
  readonly query = signal('');
  readonly chips = signal<string[]>([]);
  private readonly names = signal<Record<string, string>>({});
  readonly rows = httpResource<Record<string, unknown>[]>(
    () => {
      const name = this.metadataName();
      if (!this.open() || !name) return undefined;
      return this.api.recordsRequest(name, { _start: 0, _limit: 40 });
    },
    { defaultValue: [], parse: rowsOf },
  );
  readonly filtered = computed(() => {
    const status = this.rows.status();
    const rows = status === 'resolved' || status === 'local' ? this.rows.value() : [];
    const query = this.query().trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query));
  });

  ngOnInit(): void {
    this.chips.set(splitCsv(this.formControl.value));
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => this.chips.set(splitCsv(value)));
  }

  metadatas(): Metadata[] {
    return this.catalog.list();
  }

  chooseOne(row: Record<string, unknown>): void {
    const token = this.tokenOf(row);
    if (!token) return;
    this.remember(token, this.rowLabel(row));
    this.write([token]);
    this.open.set(false);
  }

  accumulate(row: Record<string, unknown>): void {
    const token = this.tokenOf(row);
    if (!token) return;
    this.remember(token, this.rowLabel(row));
    const current = this.chips();
    this.write(current.includes(token) ? current.filter((item) => item !== token) : [...current, token]);
  }

  flagged(row: Record<string, unknown>): boolean {
    const token = this.tokenOf(row);
    return !!token && this.chips().includes(token);
  }

  remove(token: string): void {
    this.write(this.chips().filter((item) => item !== token));
  }

  mark(token: string): { name: string; letter: string } {
    return relationMark(token);
  }

  chipCaption(token: string): string {
    return this.names()[token] || relationMark(token).name;
  }

  rowLabel(row: Record<string, unknown>): string {
    const metadata = this.metadatas().find((item) => item.table_name === this.metadataName());
    const extra = metadata?.table_key_addition ?? '';
    return humanLabel(row, [extra]) || metadata?.description || metadata?.table_name || 'Record';
  }

  track(row: Record<string, unknown>): string {
    const metadata = this.metadatas().find((item) => item.table_name === this.metadataName());
    const key = metadata?.table_key || 'uuid';
    return String(row[key] ?? JSON.stringify(row));
  }

  private tokenOf(row: Record<string, unknown>): string {
    const metadata = this.metadatas().find((item) => item.table_name === this.metadataName());
    if (!metadata) return '';
    const keyName = metadata.table_key || 'uuid';
    const keyValue = row[keyName] ?? row['uuid'];
    return keyValue == null ? '' : `${metadata.table_name}:${String(keyValue)}`;
  }

  private remember(token: string, label: string): void {
    if (!label) return;
    this.names.update((current) => ({ ...current, [token]: label }));
  }

  private write(tokens: string[]): void {
    this.formControl.setValue(tokens.length ? tokens.join(',') : null);
    this.formControl.markAsDirty();
  }
}
