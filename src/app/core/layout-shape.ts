import { defaultSpan, logicalFieldType } from './field-types';
import {
  FieldDefinition,
  LayoutBody,
  LayoutDocument,
  ListLayoutBody,
  SearchMode,
  WizardLayoutBody,
} from './models';

export function seedList(fields: FieldDefinition[]): ListLayoutBody {
  return {
    kind: 'list',
    columns: fields
      .filter((field) => !!field.name)
      .map((field, order) => ({
        fieldName: field.name ?? '',
        visible: true,
        order,
        search: defaultSearch(field),
      })),
  };
}

export function seedWizard(fields: FieldDefinition[]): WizardLayoutBody {
  return {
    kind: 'wizard',
    pages: [
      {
        id: crypto.randomUUID(),
        title: 'Page 1',
        boxes: [
          {
            id: crypto.randomUUID(),
            title: 'Details',
            fields: fields
              .filter((field) => !!field.name)
              .map((field) => ({
                fieldName: field.name ?? '',
                required: !!field.mandatory,
                span: defaultSpan(field),
              })),
          },
        ],
      },
    ],
  };
}

export function seedBody(kind: LayoutDocument['pageType'], fields: FieldDefinition[]): LayoutBody {
  return kind === 'list' ? seedList(fields) : seedWizard(fields);
}

export function orderedColumns(body: ListLayoutBody) {
  return [...body.columns].sort((left, right) => left.order - right.order);
}

export function visibleColumns(body: ListLayoutBody) {
  return orderedColumns(body).filter((column) => column.visible);
}

const TEXT_SEARCH = new Set(['string', 'text', 'tinymce']);
const DATE_SEARCH = new Set(['date', 'datetime', 'time']);
const BOOL_SEARCH = new Set(['boolean', 'passivation']);
const NUMBER_SEARCH = new Set(['number', 'decimal']);

export const SEARCH_LABEL: Record<SearchMode, string> = {
  like: 'Like',
  eq: 'Equals',
  range: 'Range',
  boolean: 'Boolean',
  none: 'None',
};

export function defaultSearch(field: FieldDefinition): SearchMode {
  const logical = logicalFieldType(field);
  if (logical === 'image') return 'none';
  if (TEXT_SEARCH.has(logical)) return 'like';
  if (DATE_SEARCH.has(logical)) return 'range';
  if (BOOL_SEARCH.has(logical)) return 'boolean';
  return 'eq';
}

export function searchChoices(field: FieldDefinition | undefined): SearchMode[] {
  const logical = field ? logicalFieldType(field) : '';
  if (logical === 'image') return ['none'];
  if (TEXT_SEARCH.has(logical)) return ['like', 'eq'];
  if (NUMBER_SEARCH.has(logical)) return ['eq', 'range'];
  return [field ? defaultSearch(field) : 'eq'];
}

export function resolvedSearch(current: string | undefined, field: FieldDefinition | undefined): SearchMode {
  const choices = searchChoices(field);
  return choices.find((mode) => mode === current) ?? choices[0] ?? 'eq';
}

export function withSearches(body: ListLayoutBody, fields: FieldDefinition[]): ListLayoutBody {
  let changed = false;
  const columns = body.columns.map((column) => {
    const search = resolvedSearch(column.search, fields.find((field) => field.name === column.fieldName));
    if (column.search === search) return column;
    changed = true;
    return { ...column, search };
  });
  return changed ? { kind: 'list', columns } : body;
}

export function searchFieldsForList(body: ListLayoutBody, fields: FieldDefinition[]): FieldDefinition[] {
  return orderedColumns(body).flatMap((column) => {
    const field = fields.find((item) => item.name === column.fieldName);
    if (!field?.name) return [];
    const mode = resolvedSearch(column.search, field);
    if (mode === 'none') return [];
    return materializeSearch(field, mode);
  });
}

function materializeSearch(field: FieldDefinition, mode: SearchMode): FieldDefinition[] {
  const name = field.name ?? '';
  const label = field.label || name;
  if (mode === 'range') {
    const dated = DATE_SEARCH.has(logicalFieldType(field));
    return [
      { ...field, name: `${name}__min`, label: dated ? label : `${label} da`, search_condition: 'gte', search_field_name: `${name}_gte` },
      { ...field, name: `${name}__max`, label: dated ? label : `${label} a`, search_condition: 'lte', search_field_name: `${name}_lte` },
    ];
  }
  if (mode === 'like') {
    return [{ ...field, search_condition: 'containss', search_field_name: `${name}_containss` }];
  }
  if (mode === 'boolean') {
    return [{ ...field, search_condition: 'boolean', search_field_name: name }];
  }
  return [{ ...field, search_condition: 'eq', search_field_name: name }];
}

export function filterParams(fields: FieldDefinition[], value: Record<string, unknown>): Record<string, string> {
  const params: Record<string, string> = {};
  for (const field of fields) {
    const name = field.name;
    if (!name) continue;
    const raw = value[name];
    if (field.search_condition === 'boolean') {
      if (raw === true || raw === 1 || raw === '1' || raw === 'true') params[paramName(field)] = '1';
      else if (raw === false || raw === 0 || raw === '0' || raw === 'false') params[paramName(field)] = '0';
      continue;
    }
    if (raw == null || raw === '' || raw === false) continue;
    const serialized = Array.isArray(raw) ? raw.map((item) => String(item)).join(',') : String(raw);
    if (!serialized) continue;
    params[paramName(field)] = serialized;
  }
  return params;
}

function paramName(field: FieldDefinition): string {
  if (field.search_field_name) return field.search_field_name;
  const name = field.name ?? '';
  const condition = field.search_condition ?? '';
  if (!condition || condition === 'eq' || condition === '=') return name;
  return `${name}_${condition}`;
}

const MULTI = new Set(['multiselect', 'multijoin', 'multilookup', 'tags']);

export function placementNames(body: LayoutBody): string[] {
  if (body.kind === 'list') return body.columns.map((column) => column.fieldName);
  return body.pages.flatMap((page) => page.boxes.flatMap((box) => box.fields.map((field) => field.fieldName)));
}

export function coerceModel(
  record: Record<string, unknown>,
  fields: FieldDefinition[],
  names: string[],
): Record<string, unknown> {
  const model: Record<string, unknown> = {};
  for (const name of names) {
    const field = fields.find((item) => item.name === name);
    const logical = field ? logicalFieldType(field) : '';
    const value = record[name];
    if (MULTI.has(logical) && typeof value === 'string') {
      model[name] = value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      continue;
    }
    if ((logical === 'boolean' || logical === 'passivation') && (value === 0 || value === 1 || value === '0' || value === '1')) {
      model[name] = value === 1 || value === '1';
      continue;
    }
    model[name] = value ?? null;
  }
  return model;
}

export function serializeModel(
  model: Record<string, unknown>,
  fields: FieldDefinition[],
  names: string[],
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const name of names) {
    const field = fields.find((item) => item.name === name);
    const logical = field ? logicalFieldType(field) : '';
    const value = model[name];
    output[name] = MULTI.has(logical) && Array.isArray(value) ? value.map((item) => String(item)).join(',') : value;
  }
  return output;
}

