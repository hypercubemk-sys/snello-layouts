import { httpResource } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Metadata } from './models';
import { SnelloApi } from './snello-api';

@Injectable({ providedIn: 'root' })
export class MetadataCatalog {
  private readonly api = inject(SnelloApi);
  readonly resource = httpResource<Metadata[]>(() => this.api.metadatasRequest(), {
    defaultValue: [],
    parse: (value) => (Array.isArray(value) ? (value as Metadata[]) : []),
  });

  readonly list = computed(() => {
    const status = this.resource.status();
    if (status !== 'resolved' && status !== 'local') return [];
    return [...this.resource.value()].sort((left, right) => left.table_name.localeCompare(right.table_name));
  });

  find(table: string): Metadata | undefined {
    return this.list().find((item) => item.table_name === table);
  }

  groupOf(table: string): string {
    return (this.find(table)?.metadata_group ?? '').trim();
  }

  icon(table: string): string {
    return metadataIconClass(this.find(table)?.icon);
  }
}

export function groupsOf(tables: string[], groupOf: (table: string) => string): string[] {
  const groups = new Set<string>();
  for (const table of tables) {
    const group = groupOf(table);
    if (group) groups.add(group);
  }
  return [...groups].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }));
}

export function metadataIconClass(icon: string | null | undefined): string {
  const value = (icon ?? '').trim();
  return /^fa[a-z0-9\-\s]+$/i.test(value) ? value : '';
}
