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

  icon(table: string): string {
    return metadataIconClass(this.find(table)?.icon);
  }
}

export function metadataIconClass(icon: string | null | undefined): string {
  const value = (icon ?? '').trim();
  return /^fa[a-z0-9\-\s]+$/i.test(value) ? value : '';
}
