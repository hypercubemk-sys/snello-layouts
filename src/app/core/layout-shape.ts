import { defaultSpan, logicalFieldType } from './field-types';
import {
  FieldDefinition,
  LayoutBody,
  LayoutDocument,
  ListLayoutBody,
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
      })),
  };
}

export function seedWizard(fields: FieldDefinition[]): WizardLayoutBody {
  return {
    kind: 'wizard',
    pages: [
      {
        id: crypto.randomUUID(),
        title: 'Pagina 1',
        boxes: [
          {
            id: crypto.randomUUID(),
            title: 'Dettaglio',
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

const NOT_A_FILTER = new Set(['image', 'media', 'realtionships', 'tinymce', 'monaco', 'gmaplocation', 'gmappath']);

export function searchFieldsForList(_body: ListLayoutBody, fields: FieldDefinition[]): FieldDefinition[] {
  return fields
    .filter((field) => {
      if (!field.name) return false;
      if (field.searchable) return true;
      return !NOT_A_FILTER.has(logicalFieldType(field));
    })
    .flatMap((field) => expandRange(field));
}

function expandRange(field: FieldDefinition): FieldDefinition[] {
  const temporal = field.type === 'date' || field.type === 'datetime';
  if (field.search_condition !== 'range' || !temporal || !field.name) {
    return [field];
  }

  const label = field.label || field.name;
  return [
    {
      ...field,
      name: `${field.name}__min`,
      label: `${label} min`,
      search_condition: 'gte',
      search_field_name: `${field.name}_gte`,
    },
    {
      ...field,
      name: `${field.name}__max`,
      label: `${label} max`,
      search_condition: 'lte',
      search_field_name: `${field.name}_lte`,
    },
  ];
}

export function filterParams(fields: FieldDefinition[], value: Record<string, unknown>): Record<string, string> {
  const params: Record<string, string> = {};
  for (const field of fields) {
    const name = field.name;
    if (!name) continue;
    const raw = value[name];
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

