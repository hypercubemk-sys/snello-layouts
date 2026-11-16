import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxModule } from '@openng/optimus-ui/checkbox';
import { DatePickerModule } from '@openng/optimus-ui/datepicker';
import { MultiSelectModule } from '@openng/optimus-ui/multiselect';
import { SelectModule } from '@openng/optimus-ui/select';
import { FieldType, FieldTypeConfig, FormlyModule } from '@ngx-formly/core';
import { joinKeyName, joinLabelName, SnelloApi } from '../core/snello-api';
import { staticOptions } from '../core/field-types';
import { SelectOption } from '../core/models';
import { definitionOf, isUuid, labeledOption, rowsOf, shownText, splitCsv } from './kit';
import { Icon } from '../icon';

@Component({
  selector: 'app-formly-input',
  imports: [ReactiveFormsModule, FormlyModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ shown }}</p>
    } @else if (searchMark) {
      <span class="search-input" [attr.title]="searchTitle">
        <input
          [id]="id"
          [type]="inputType"
          [attr.inputmode]="field.type === 'decimal' ? 'decimal' : null"
          [attr.step]="field.type === 'number' || field.type === 'decimal' ? 'any' : null"
          [formControl]="formControl"
          [formlyAttributes]="field" />
        <app-icon [name]="searchMark" />
      </span>
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
  get searchMark(): 'like' | 'equals' | '' {
    if (this.props['search'] !== true) return '';
    const mode = this.props['searchMode'];
    if (mode === 'containss' || mode === 'like') return 'like';
    if (mode === 'eq' || mode === '=') return 'equals';
    return '';
  }

  get searchTitle(): string {
    return this.searchMark === 'like' ? 'Like' : 'Equals';
  }

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
  imports: [ReactiveFormsModule, CheckboxModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ state() === true ? 'Yes' : state() === false ? 'No' : '—' }}</p>
    } @else {
      <label class="check">
        <p-checkbox
          [binary]="true"
          [inputId]="id"
          [formControl]="formControl"
          [indeterminate]="triState && state() === null"
          (onChange)="keepCycle($event)" />
        <span>{{ caption }}</span>
      </label>
    }
  `,
})
export class CheckboxField extends FieldType<FieldTypeConfig> implements OnInit {
  private prior: boolean | null = null;

  ngOnInit(): void {
    this.prior = this.state();
  }

  get triState(): boolean {
    return this.props['search'] === true && this.field.type !== 'passivation';
  }

  get caption(): string {
    if (this.triState) return this.state() === true ? 'Yes' : this.state() === false ? 'No' : 'Any';
    return this.field.type === 'passivation' ? 'Passive record' : 'Active';
  }

  state(): boolean | null {
    const value = this.formControl.value;
    if (value === true || value === 1 || value === '1' || value === 'true') return true;
    if (value === false || value === 0 || value === '0' || value === 'false') return false;
    return null;
  }

  keepCycle(event: { checked?: boolean }): void {
    if (this.triState && event.checked === true && this.prior === false) {
      this.formControl.setValue(null);
      this.prior = null;
      return;
    }
    this.prior = this.state();
  }
}

@Component({
  selector: 'app-formly-select',
  imports: [ReactiveFormsModule, SelectModule, MultiSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ shown }}</p>
    } @else if (searching) {
      <p-multiselect
        [inputId]="id"
        [options]="choices"
        optionLabel="label"
        optionValue="value"
        [filter]="true"
        filterPlaceHolder="Search"
        [showClear]="true"
        [resetFilterOnHide]="true"
        [appendTo]="'body'"
        [fluid]="true"
        placeholder="All"
        [formControl]="formControl" />
    } @else {
      <p-select
        [inputId]="id"
        [options]="choices"
        optionLabel="label"
        optionValue="value"
        [editable]="true"
        [formControl]="formControl"
        [fluid]="true"
        [showClear]="true"
        [appendTo]="'body'"
        placeholder="—" />
    }
  `,
})
export class SelectField extends FieldType<FieldTypeConfig> implements OnInit {
  ngOnInit(): void {
    if (!this.searching) return;
    const value = this.formControl.value;
    if (typeof value === 'string' || (value != null && !Array.isArray(value))) {
      this.formControl.setValue(splitCsv(value), { emitEvent: false });
    }
  }

  get searching(): boolean {
    return this.props['search'] === true;
  }

  get choices(): SelectOption[] {
    const definition = definitionOf(this);
    return definition ? staticOptions(definition) : [];
  }

  get shown(): string {
    const labels = new Map(this.choices.map((option) => [option.value, option.label]));
    const text = splitCsv(this.formControl.value)
      .map((value) => labels.get(value) ?? value)
      .filter((value) => value.length > 0 && !isUuid(value))
      .join(', ');
    return text || '—';
  }
}

@Component({
  selector: 'app-formly-multiselect',
  imports: [ReactiveFormsModule, FormlyModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <p class="hint">Loading values…</p>
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
      .map((row) => labeledOption(row, key, label))
      .filter((option): option is SelectOption => !!option);
  }

  get shown(): string {
    const labels = new Map(this.choices().map((option) => [option.value, option.label]));
    return splitCsv(this.formControl.value)
      .map((id) => labels.get(id) ?? '')
      .filter((label) => label.length > 0 && !isUuid(label))
      .join(', ') || '—';
  }
}

@Component({
  selector: 'app-formly-temporal',
  imports: [ReactiveFormsModule, DatePickerModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (props.readonly) {
      <p class="readonly">{{ shown }}</p>
    } @else {
      <span class="range-input" [attr.title]="rangeTitle">
        @if (rangeMark) {
          <app-icon [name]="rangeMark" />
        }
        <p-datepicker
          [inputId]="id"
          [formControl]="picker"
          dataType="string"
          [dateFormat]="dateFormat"
          [showTime]="showTime"
          hourFormat="24"
          [timeOnly]="timeOnly"
          [showIcon]="true"
          [fluid]="true"
          [appendTo]="'body'"
          [baseZIndex]="2000"
          [firstDayOfWeek]="1"
          [showButtonBar]="true" />
      </span>
    }
  `,
})
export class TemporalField extends FieldType<FieldTypeConfig> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly picker = new FormControl<string | null>(null);

  ngOnInit(): void {
    this.picker.setValue(pickerText(this.formControl.value, this.kind), { emitEvent: false });
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const next = pickerText(value, this.kind);
      if (next !== this.picker.value) this.picker.setValue(next, { emitEvent: false });
    });
    this.picker.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (value !== this.formControl.value) this.formControl.setValue(value);
    });
  }

  get kind(): string {
    const type = this.field.type;
    return typeof type === 'string' ? type : 'date';
  }

  get dateFormat(): string {
    return 'yy-mm-dd';
  }

  get showTime(): boolean {
    return this.kind === 'datetime';
  }

  get timeOnly(): boolean {
    return this.kind === 'time';
  }

  get rangeMark(): 'from' | 'to' | '' {
    if (this.props['search'] !== true) return '';
    if (this.props['searchMode'] === 'gte') return 'from';
    if (this.props['searchMode'] === 'lte') return 'to';
    return '';
  }

  get rangeTitle(): string | null {
    if (this.rangeMark === 'from') return 'From';
    if (this.rangeMark === 'to') return 'To';
    return null;
  }

  get shown(): string {
    const text = pickerText(this.formControl.value, this.kind);
    if (!text) return '—';
    if (this.kind === 'time') return text;
    const [date, time] = text.split(' ');
    const [year, month, day] = date.split('-');
    if (!day || !month || !year) return text;
    return time ? `${day}/${month}/${year} ${time}` : `${day}/${month}/${year}`;
  }
}

function pickerText(value: unknown, kind: string): string | null {
  if (value == null || value === '') return null;
  const text = String(value).trim();
  if (kind === 'time') {
    const match = text.match(/(\d{2}:\d{2})/);
    return match?.[1] ?? text;
  }
  const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}))?/);
  if (!match) return text;
  if (kind === 'datetime') return `${match[1]} ${match[2] ?? '00:00'}`;
  return match[1];
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
        <em class="hint">No tags</em>
      }
    </div>
    @if (!props.readonly) {
      <input [id]="id" placeholder="Add a tag and press enter" (keydown.enter)="add($any($event.target)); $event.preventDefault()" />
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
        <button type="button" class="icon-btn" aria-label="Bold" title="Bold" (click)="command('bold')"><app-icon name="bold" /></button>
        <button type="button" class="icon-btn" aria-label="Italic" title="Italic" (click)="command('italic')"><app-icon name="italic" /></button>
        <button type="button" class="icon-btn" aria-label="Align left" title="Align left" (click)="command('justifyLeft')"><app-icon name="align-left" /></button>
        <button type="button" class="icon-btn" aria-label="Center" title="Center" (click)="command('justifyCenter')"><app-icon name="align-center" /></button>
        <button type="button" class="icon-btn" aria-label="Align right" title="Align right" (click)="command('justifyRight')"><app-icon name="align-right" /></button>
        <button type="button" class="icon-btn" aria-label="Bullet list" title="Bullet list" (click)="command('insertUnorderedList')"><app-icon name="list-ul" /></button>
        <button type="button" class="icon-btn" aria-label="Numbered list" title="Numbered list" (click)="command('insertOrderedList')"><app-icon name="list-ol" /></button>
        <button type="button" class="icon-btn" aria-label="Link" title="Link" (click)="link()"><app-icon name="link" /></button>
        <button type="button" class="icon-btn" aria-label="Clear formatting" title="Clear formatting" (click)="command('removeFormat')"><app-icon name="clear" /></button>
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
    const url = window.prompt('Link address');
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
