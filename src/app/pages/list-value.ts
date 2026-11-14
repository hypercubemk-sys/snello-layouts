import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { logicalFieldType, staticOptions } from '../core/field-types';
import { FieldDefinition } from '../core/models';
import { joinLabelName } from '../core/snello-api';
import { plainExcerpt, splitCsv } from '../formly/kit';

const LINKED = new Set(['join', 'lookup', 'multijoin', 'multilookup', 'select', 'multiselect']);

export function linkedLabelKey(table: string, label: string, id: string): string {
  return `${table}\u0000${label}\u0000${id}`;
}

@Component({
  selector: 'app-list-value',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ shown() }}`,
})
export class ListValue {
  readonly field = input<FieldDefinition | null>(null);
  readonly value = input<unknown>(null);
  readonly labels = input<Record<string, string>>({});
  readonly pending = input(false);

  readonly shown = computed(() => this.render());

  private render(): string {
    const value = this.value();
    if (value == null || value === '') return '—';
    const field = this.field();
    if (!field) return clip(value);
    const logical = logicalFieldType(field);
    if (logical === 'tinymce') return plainExcerpt(String(value)) || '—';
    if (field.join_table_name && LINKED.has(logical)) return this.linked(field);
    if (logical === 'select' || logical === 'multiselect') {
      const options = new Map(staticOptions(field).map((option) => [option.value, option.label]));
      const text = splitCsv(value).map((id) => options.get(id) ?? id).join(', ');
      return text || '—';
    }
    return clip(value);
  }

  private linked(field: FieldDefinition): string {
    const table = field.join_table_name ?? '';
    const label = joinLabelName(field);
    const ids = splitCsv(this.value());
    if (ids.length === 0) return '—';
    const parts = ids.map((id) => this.labels()[linkedLabelKey(table, label, id)]);
    if (parts.some((part) => !part)) return this.pending() ? '…' : parts.map((part) => part || '—').join(', ');
    return parts.join(', ');
  }
}

function clip(value: unknown): string {
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}
