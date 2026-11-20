import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { logicalFieldType, staticOptions } from '../core/field-types';
import { FieldDefinition } from '../core/models';
import { joinLabelName } from '../core/snello-api';
import { parsePoint, plainExcerpt, splitCsv, splitPath } from '../formly/kit';
import { MapCanvas } from '../formly/maps';

const LINKED = new Set(['join', 'lookup', 'multijoin', 'multilookup', 'select', 'multiselect']);

export function linkedLabelKey(table: string, label: string, id: string): string {
  return `${table}\u0000${label}\u0000${id}`;
}

@Component({
  selector: 'app-list-value',
  imports: [MapCanvas],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `.date-tag { display: inline-block; padding: 1px 8px; border: 1px solid var(--line, #ddd); border-radius: 999px; background: #f4f4f4; font-size: 12px; white-space: nowrap; }`,
  template: `
    @if (mapPoints(); as points) {
      @if (points.length) {
        <app-map-canvas [points]="points" [line]="mapKind() === 'path'" [compact]="true" />
      } @else {
        —
      }
    } @else if (isDate() && shown() !== '—') {
      <span class="date-tag">{{ shown() }}</span>
    } @else {
      {{ shown() }}
    }
  `,
})
export class ListValue {
  readonly field = input<FieldDefinition | null>(null);
  readonly value = input<unknown>(null);
  readonly labels = input<Record<string, string>>({});
  readonly pending = input(false);

  readonly mapKind = computed((): 'point' | 'path' | null => {
    const field = this.field();
    if (!field) return null;
    const logical = logicalFieldType(field);
    if (logical === 'gmaplocation') return 'point';
    if (logical === 'gmappath') return 'path';
    return null;
  });
  readonly mapPoints = computed((): [number, number][] | null => {
    const kind = this.mapKind();
    if (!kind) return null;
    const text = this.value() == null ? '' : String(this.value());
    if (kind === 'point') {
      const parsed = parsePoint(text);
      return parsed ? [parsed] : [];
    }
    return splitPath(text).flatMap((part) => {
      const parsed = parsePoint(part);
      return parsed ? [parsed] : [];
    });
  });
  readonly isDate = computed(() => {
    const field = this.field();
    if (!field) return false;
    const logical = logicalFieldType(field);
    return logical === 'date' || logical === 'datetime' || field.name === 'creation_date';
  });
  readonly shown = computed(() => this.render());

  private render(): string {
    const value = this.value();
    if (value == null || value === '') return '—';
    const field = this.field();
    if (!field) return clip(value);
    const logical = logicalFieldType(field);
    if (logical === 'tinymce') return plainExcerpt(String(value)) || '—';
    if (field.name === 'creation_date') return dateOnly(value);
    const kind = logical;
    if (kind === 'date') return dateOnly(value);
    if (kind === 'datetime') return String(value).trim().replace('T', ' ').slice(0, 16);
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

function dateOnly(value: unknown): string {
  const date = String(value).trim().split(/[T ]/)[0];
  return date || '—';
}

function clip(value: unknown): string {
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}
