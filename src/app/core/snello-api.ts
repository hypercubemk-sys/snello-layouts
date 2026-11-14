import { Injectable, inject } from '@angular/core';
import { HttpResourceRequest } from '@angular/common/http';
import { FieldDefinition } from './models';
import { RUNTIME_CONFIG } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class SnelloApi {
  private readonly config = inject(RUNTIME_CONFIG);
  readonly base = this.config.apiBase.replace(/\/$/, '');

  metadatasRequest(): HttpResourceRequest {
    return {
      url: `${this.base}/metadatas`,
      params: { _limit: 100000 },
    };
  }

  metadataRequest(tableName: string): HttpResourceRequest {
    return {
      url: `${this.base}/metadatas`,
      params: { table_name: tableName, _limit: 1 },
    };
  }

  fieldsRequest(metadataName: string): HttpResourceRequest {
    return { url: `${this.base}/datalist/metadata/${metadataName}/fielddefinitions` };
  }

  recordsRequest(table: string, params: Record<string, string | number | boolean>): HttpResourceRequest {
    return {
      url: `${this.base}/${table}`,
      params,
    };
  }

  recordRequest(table: string, id: string): HttpResourceRequest {
    return { url: `${this.base}/${table}/${encodeURIComponent(id)}` };
  }

  joinRequest(field: FieldDefinition, query = '', limit = 50): HttpResourceRequest | undefined {
    const table = field.join_table_name;
    if (!table) return undefined;
    const key = field.join_table_key || 'uuid';
    const label = joinLabelName(field);
    const select = joinSelect(field);
    const params: Record<string, string | number> = {
      _start: 0,
      _limit: limit,
      select_fields: select,
    };
    if (query.trim()) params[`${label}_containss`] = query.trim();
    return { url: `${this.base}/${table}`, params };
  }

  recordsByKeys(table: string, key: string, ids: string[], select: string): HttpResourceRequest | undefined {
    const unique = [...new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0))];
    if (!table || unique.length === 0) return undefined;
    return {
      url: `${this.base}/${table}`,
      params: {
        _start: 0,
        _limit: unique.length,
        select_fields: select,
        [`${key}_in`]: unique.join(','),
      },
    };
  }

  documentsRequest(search = ''): HttpResourceRequest {
    const params: Record<string, string | number> = {
      mimetype_in: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/bmp,image/tiff',
      _start: 0,
      _limit: 24,
      _sort: 'creation_date:desc',
    };
    if (search.trim()) params['original_name_containss'] = search.trim();
    return { url: `${this.base}/documents`, params };
  }

  documentRequest(uuid: string): HttpResourceRequest {
    return { url: `${this.base}/documents/${encodeURIComponent(uuid)}` };
  }

  documentUrl(uuid: string): string {
    return `${this.base}/documents/${uuid}/download`;
  }
}

export function joinKeyName(field: FieldDefinition | null): string {
  return field?.join_table_key || 'uuid';
}

export function joinLabelName(field: FieldDefinition | null): string {
  const key = joinKeyName(field);
  const parts = (field?.join_table_select_fields || key)
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const first = parts[0] ?? key;
  if (first === key && parts.length > 1) return parts[1];
  return first;
}

export function joinSelect(field: FieldDefinition): string {
  const names = new Set<string>();
  for (const part of (field.join_table_select_fields || '').split(',')) {
    const name = part.trim();
    if (name) names.add(name);
  }
  names.add(joinKeyName(field));
  return [...names].join(',');
}
