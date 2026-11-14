import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { joinKeyName, joinLabelName, SnelloApi } from '../core/snello-api';
import { staticOptions } from '../core/field-types';
import { SelectOption } from '../core/models';
import { definitionOf, rowsOf, shownText, splitCsv } from './kit';
import { Icon } from '../icon';

@Component({
  selector: 'app-formly-input',
  imports: [ReactiveFormsModule, FormlyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ shown }}</p>
    } @else {
      <input
        [id]="id"
        [type]="inputType"
        [attr.inputmode]="field.type === 'decimal' ? 'decimal' : null"
        [attr.step]="field.type === 'number' || field.type === 'decimal' ? 'any' : null"
        [formControl]="formControl"
        [formlyAttributes]="field" />
    }
  `,
})
export class InputField extends FieldType<FieldTypeConfig> {
  get inputType(): string {
    if (this.field.type === 'number') return 'number';
    if (this.field.type === 'password') return 'password';
    if (this.field.type === 'email') return 'email';
    return 'text';
  }

  get shown(): string {
    return shownText(this.formControl.value);
  }
}

@Component({
  selector: 'app-formly-textarea',
  imports: [ReactiveFormsModule, FormlyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly pre">{{ shown }}</p>
    } @else {
      <textarea [id]="id" rows="5" [formControl]="formControl" [formlyAttributes]="field"></textarea>
    }
  `,
})
export class TextareaField extends FieldType<FieldTypeConfig> {
  get shown(): string {
    return shownText(this.formControl.value);
  }
}

@Component({
  selector: 'app-formly-check',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ state() === true ? 'Sì' : state() === false ? 'No' : '—' }}</p>
    } @else if (triState) {
      <button type="button" class="toggle" [class.on]="state() === true" [class.off]="state() === false" (click)="cycle()">
        <i></i>
        <span>{{ state() === true ? 'Sì' : state() === false ? 'No' : 'Indifferente' }}</span>
      </button>
    } @else {
      <button type="button" class="toggle" [class.on]="state() === true" (click)="flip()">
        <i></i>
        <span>{{ field.type === 'passivation' ? 'Record passivo' : 'Attivo' }}</span>
      </button>
    }
  `,
})
export class CheckboxField extends FieldType<FieldTypeConfig> {
  get triState(): boolean {
    return this.props['search'] === true && this.field.type !== 'passivation';
  }

  state(): boolean | null {
    const value = this.formControl.value;
    if (value === true || value === 1 || value === '1' || value === 'true') return true;
    if (value === false || value === 0 || value === '0' || value === 'false') return false;
    return null;
  }

  flip(): void {
    this.formControl.setValue(this.state() !== true);
    this.formControl.markAsDirty();
  }

  cycle(): void {
    const current = this.state();
    this.formControl.setValue(current === null ? true : current === true ? false : null);
    this.formControl.markAsDirty();
  }
}

@Component({
  selector: 'app-formly-select',
  imports: [ReactiveFormsModule, FormlyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ shown }}</p>
    } @else {
      <select [id]="id" [formControl]="formControl" [formlyAttributes]="field">
        <option value="">—</option>
        @for (option of choices; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    }
  `,
})
export class SelectField extends FieldType<FieldTypeConfig> {
  get choices(): SelectOption[] {
    const definition = definitionOf(this);
    return definition ? staticOptions(definition) : [];
  }

  get shown(): string {
    return shownText(this.formControl.value);
  }
}

@Component({
  selector: 'app-formly-multiselect',
  imports: [ReactiveFormsModule, FormlyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <p class="hint">Carico i valori…</p>
    }
    @if (props.readonly) {
      <p class="readonly">{{ shown }}</p>
    } @else {
      <select multiple [id]="id" [formControl]="formControl" [formlyAttributes]="field">
        @for (option of choices(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    }
  `,
})
export class MultiselectField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly api = inject(SnelloApi);
  private readonly definition = signal(definitionOf(this));
  private readonly rows = httpResource<Record<string, unknown>[]>(
    () => {
      const definition = this.definition();
      return definition?.join_table_name ? this.api.joinRequest(definition, '', 200) : undefined;
    },
    { defaultValue: [], parse: rowsOf },
  );

  ngOnInit(): void {
    this.definition.set(definitionOf(this));
    const value = this.formControl.value;
    if (typeof value === 'string' || (value != null && !Array.isArray(value))) {
      this.formControl.setValue(splitCsv(value), { emitEvent: false });
    }
  }

  loading(): boolean {
    return !!this.definition()?.join_table_name && this.rows.isLoading();
  }

  choices(): SelectOption[] {
    const definition = this.definition();
    if (!definition?.join_table_name) return staticOptions(definition ?? { options: '' });
    if (this.rows.status() !== 'resolved' && this.rows.status() !== 'local') return [];
    const key = joinKeyName(definition);
    const label = joinLabelName(definition);
    return this.rows
      .value()
      .map((row) => ({ value: String(row[key] ?? ''), label: String(row[label] ?? row[key] ?? '') }))
      .filter((option) => option.value.length > 0);
  }

  get shown(): string {
    const labels = new Map(this.choices().map((option) => [option.value, option.label]));
    return splitCsv(this.formControl.value)
      .map((id) => labels.get(id) ?? id)
      .join(', ') || '—';
  }
}

@Component({
  selector: 'app-formly-temporal',
  imports: [ReactiveFormsModule, FormlyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ shown }}</p>
    } @else {
      <input [id]="id" [type]="inputType" [formControl]="formControl" [formlyAttributes]="field" />
    }
  `,
})
export class TemporalField extends FieldType<FieldTypeConfig> {
  get inputType(): string {
    if (this.field.type === 'datetime') return 'datetime-local';
    if (this.field.type === 'time') return 'time';
    return 'date';
  }

  get shown(): string {
    const value = this.formControl.value;
    if (value == null || value === '') return '—';
    const text = String(value);
    if (this.field.type === 'datetime') return text.replace('T', ' ').slice(0, 16);
    return text;
  }
}

@Component({
  selector: 'app-formly-tags',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chips">
      @for (tag of chips; track tag) {
        <span>
          {{ tag }}
          @if (!props.readonly) {
            <button type="button" (click)="remove(tag)">×</button>
          }
        </span>
      } @empty {
        <em class="hint">Nessun tag</em>
      }
    </div>
    @if (!props.readonly) {
      <input [id]="id" placeholder="Aggiungi tag e premi invio" (keydown.enter)="add($any($event.target)); $event.preventDefault()" />
    }
  `,
})
export class TagsField extends FieldType<FieldTypeConfig> {
  get chips(): string[] {
    return splitCsv(this.formControl.value);
  }

  add(input: HTMLInputElement): void {
    const tag = input.value.trim();
    if (!tag || this.chips.includes(tag)) return;
    this.formControl.setValue([...this.chips, tag].join(','));
    input.value = '';
  }

  remove(tag: string): void {
    this.formControl.setValue(this.chips.filter((item) => item !== tag).join(','));
  }
}

@Component({
  selector: 'app-formly-monaco',
  imports: [ReactiveFormsModule, FormlyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <pre class="code">{{ shown }}</pre>
    } @else {
      <textarea
        class="code-input"
        [id]="id"
        rows="12"
        spellcheck="false"
        [formControl]="formControl"
        [formlyAttributes]="field"
        (keydown.tab)="indent($event)"></textarea>
    }
  `,
})
export class MonacoField extends FieldType<FieldTypeConfig> {
  get shown(): string {
    return shownText(this.formControl.value);
  }

  indent(event: Event): void {
    event.preventDefault();
    const node = event.target as HTMLTextAreaElement;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const next = `${node.value.slice(0, start)}  ${node.value.slice(end)}`;
    this.formControl.setValue(next);
    queueMicrotask(() => node.setSelectionRange(start + 2, start + 2));
  }
}

@Component({
  selector: 'app-formly-tinymce',
  imports: [ReactiveFormsModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <div class="rich-view" [innerHTML]="shown"></div>
    } @else {
      <div class="rich-toolbar">
        <button type="button" class="icon-btn" aria-label="Grassetto" title="Grassetto" (click)="command('bold')"><app-icon name="bold" /></button>
        <button type="button" class="icon-btn" aria-label="Corsivo" title="Corsivo" (click)="command('italic')"><app-icon name="italic" /></button>
        <button type="button" class="icon-btn" aria-label="Allinea a sinistra" title="Allinea a sinistra" (click)="command('justifyLeft')"><app-icon name="align-left" /></button>
        <button type="button" class="icon-btn" aria-label="Centra" title="Centra" (click)="command('justifyCenter')"><app-icon name="align-center" /></button>
        <button type="button" class="icon-btn" aria-label="Allinea a destra" title="Allinea a destra" (click)="command('justifyRight')"><app-icon name="align-right" /></button>
        <button type="button" class="icon-btn" aria-label="Elenco" title="Elenco" (click)="command('insertUnorderedList')"><app-icon name="list-ul" /></button>
        <button type="button" class="icon-btn" aria-label="Elenco numerato" title="Elenco numerato" (click)="command('insertOrderedList')"><app-icon name="list-ol" /></button>
        <button type="button" class="icon-btn" aria-label="Link" title="Link" (click)="link()"><app-icon name="link" /></button>
        <button type="button" class="icon-btn" aria-label="Pulisci" title="Pulisci" (click)="command('removeFormat')"><app-icon name="clear" /></button>
      </div>
      <div class="rich-editor" [id]="id" contenteditable="true" (input)="commit($event)"></div>
    }
  `,
})
export class TinymceField extends FieldType<FieldTypeConfig> implements OnInit {
  ngOnInit(): void {
    queueMicrotask(() => {
      const node = document.getElementById(this.id);
      if (node && node.innerHTML.trim() === '') node.innerHTML = String(this.formControl.value ?? '');
    });
  }

  get shown(): string {
    return String(this.formControl.value ?? '');
  }

  command(name: string): void {
    document.execCommand(name);
    this.sync();
  }

  link(): void {
    const url = window.prompt('Indirizzo del link');
    if (url) document.execCommand('createLink', false, url);
    this.sync();
  }

  commit(event: Event): void {
    this.formControl.setValue((event.target as HTMLElement).innerHTML);
  }

  private sync(): void {
    const node = document.getElementById(this.id);
    if (node) this.formControl.setValue(node.innerHTML);
  }
}
