import { FieldDefinition } from './models';

export interface FieldTypeInfo {
  id: string;
  label: string;
  hint: string;
  icon: string;
}

export const FIELD_TYPE_CATALOG: FieldTypeInfo[] = [
  { id: 'string', label: 'String', hint: 'input text', icon: 'type-string' },
  { id: 'number', label: 'Number', hint: 'input number', icon: 'type-number' },
  { id: 'decimal', label: 'Decimal', hint: 'input decimal', icon: 'type-decimal' },
  { id: 'password', label: 'Password', hint: 'input password', icon: 'type-password' },
  { id: 'email', label: 'Email', hint: 'input email', icon: 'type-email' },
  { id: 'text', label: 'Text', hint: 'textarea', icon: 'type-text' },
  { id: 'tinymce', label: 'TinyMCE', hint: 'html', icon: 'type-tinymce' },
  { id: 'monaco', label: 'Monaco', hint: 'code', icon: 'type-monaco' },
  { id: 'boolean', label: 'Boolean', hint: 'checkbox', icon: 'type-boolean' },
  { id: 'passivation', label: 'Passivation', hint: 'checkbox', icon: 'type-passivation' },
  { id: 'date', label: 'Date', hint: 'date', icon: 'type-date' },
  { id: 'datetime', label: 'Datetime', hint: 'datetime', icon: 'type-datetime' },
  { id: 'time', label: 'Time', hint: 'time', icon: 'type-time' },
  { id: 'select', label: 'Select', hint: 'options', icon: 'type-select' },
  { id: 'multiselect', label: 'Multiselect', hint: 'options', icon: 'type-multiselect' },
  { id: 'tags', label: 'Tags', hint: 'chips', icon: 'type-tags' },
  { id: 'join', label: 'Join', hint: 'lookup table', icon: 'type-join' },
  { id: 'lookup', label: 'Lookup', hint: 'join filtrabile', icon: 'type-lookup' },
  { id: 'multijoin', label: 'Multijoin', hint: 'join multiplo', icon: 'type-multijoin' },
  { id: 'multilookup', label: 'Multilookup', hint: 'lookup multiplo', icon: 'type-multilookup' },
  { id: 'realtionships', label: 'Relationships', hint: 'metadata:id', icon: 'type-relationships' },
  { id: 'media', label: 'Media', hint: 'documento', icon: 'type-media' },
  { id: 'image', label: 'Image', hint: 'immagine', icon: 'type-image' },
  { id: 'gmaplocation', label: 'Map location', hint: 'lat, lng', icon: 'type-location' },
  { id: 'gmappath', label: 'Map path', hint: 'punti', icon: 'type-path' },
];

export function fieldTypeIcon(type: string): string {
  return FIELD_TYPE_CATALOG.find((item) => item.id === type)?.icon ?? 'type-string';
}

export const FIELD_TYPE_GROUPS: { name: string; types: string[] }[] = [
  { name: 'base', types: ['string', 'number', 'decimal', 'password', 'email', 'text', 'boolean', 'passivation'] },
  { name: 'editor', types: ['tinymce', 'monaco'] },
  { name: 'time', types: ['date', 'datetime', 'time'] },
  { name: 'media', types: ['media', 'image'] },
  { name: 'join', types: ['select', 'multiselect', 'tags', 'join', 'lookup', 'multijoin', 'multilookup', 'realtionships'] },
  { name: 'maps', types: ['gmaplocation', 'gmappath'] },
];

export function fieldTypeCatalogGroups(): { name: string; types: FieldTypeInfo[] }[] {
  return FIELD_TYPE_GROUPS.map((group) => ({
    name: group.name,
    types: group.types.flatMap((id) => {
      const info = FIELD_TYPE_CATALOG.find((item) => item.id === id);
      return info ? [info] : [];
    }),
  }));
}

const KNOWN = new Set(FIELD_TYPE_CATALOG.map((item) => item.id));

export function logicalFieldType(field: FieldDefinition): string {
  const type = field.type ?? '';
  const input = field.input_type ?? '';

  if (type === 'input') {
    if (input === 'number') return 'number';
    if (input === 'decimal') return 'decimal';
    if (input === 'password') return 'password';
    if (input === 'email') return 'email';
    return 'string';
  }
  if (type === 'textarea') return 'text';
  if (type === 'checkbox') return input === 'passivation' ? 'passivation' : 'boolean';
  if ((type === 'select' || type === 'join') && input === 'multiselect') return 'multiselect';
  if (type === 'join' && input === 'lookup') return 'lookup';
  if (type === 'multijoin' && input === 'multilookup') return 'multilookup';
  if (KNOWN.has(type)) return type;
  return 'string';
}

export function defaultSpan(field: FieldDefinition): 12 | 4 {
  return logicalFieldType(field) === 'text' ? 12 : 4;
}

export function sortFields(fields: FieldDefinition[]): FieldDefinition[] {
  return [...fields].sort((left, right) => (left.order_num ?? 0) - (right.order_num ?? 0));
}

export function staticOptions(field: FieldDefinition): { label: string; value: string }[] {
  return (field.options ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .map((value) => ({ label: value, value }));
}

export function searchFormlyType(field: FieldDefinition): string {
  const logical = logicalFieldType(field);
  if (logical === 'text' || logical === 'tinymce' || logical === 'monaco' || logical === 'realtionships') {
    return 'string';
  }
  return logical;
}
