import { Injectable, inject } from '@angular/core';
import { HttpResourceRequest } from '@angular/common/http';
import { FieldDefinition } from './models';
import { RUNTIME_CONFIG } from './runtime-config';

@Injectable({ providedIn: 'root' })
export class SnelloApi {
  private readonly config = inject(RUNTIME_CONFIG);
  readonly records = trimSlash(this.config.api_service_path);
  readonly metadatas = trimSlash(this.config.metadata_api_path);
  readonly dataList = trimSlash(this.config.data_list_api_path);
  readonly documents = trimSlash(this.config.document_api_path);
  readonly layouts = trimSlash(this.config.layouts_api_path);

  metadatasRequest(): HttpResourceRequest {
    return {
      url: this.metadatas,
      params: { _limit: 100000 },
    };
  }

  metadataRequest(tableName: string): HttpResourceRequest {
    return {
      url: this.metadatas,
      params: { table_name: tableName, _limit: 1 },
    };
  }

  fieldsRequest(metadataName: string): HttpResourceRequest {
    return { url: `${this.dataList}/metadata/${metadataName}/fielddefinitions` };
  }

  recordsRequest(table: string, params: Record<string, string | number | boolean>): HttpResourceRequest {
    return {
      url: `${this.records}/${table}`,
      params,
    };
  }

  recordRequest(table: string, id: string): HttpResourceRequest {
    return { url: `${this.records}/${table}/${encodeURIComponent(id)}` };
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
    return { url: `${this.records}/${table}`, params };
  }

  recordsByKeys(table: string, key: string, ids: string[], select: string): HttpResourceRequest | undefined {
    const unique = [...new Set(ids.map((id) => id.trim()).filter((id) => id.length > 0))];
    if (!table || unique.length === 0) return undefined;
    return {
      url: `${this.records}/${table}`,
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
    return { url: this.documents, params };
  }

  documentRequest(uuid: string): HttpResourceRequest {
    return { url: `${this.documents}/${encodeURIComponent(uuid)}` };
  }

  documentUrl(uuid: string): string {
    return `${this.documents}/${uuid}/download`;
  }
}

function trimSlash(value: string): string {
  return value.replace(/\/$/, '');
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
