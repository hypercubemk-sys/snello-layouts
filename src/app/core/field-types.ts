import { FieldDefinition } from './models';

export interface FieldTypeInfo {
  id: string;
  label: string;
  hint: string;
}

export const FIELD_TYPE_CATALOG: FieldTypeInfo[] = [
  { id: 'string', label: 'String', hint: 'input text' },
  { id: 'number', label: 'Number', hint: 'input number' },
  { id: 'decimal', label: 'Decimal', hint: 'input decimal' },
  { id: 'password', label: 'Password', hint: 'input password' },
  { id: 'email', label: 'Email', hint: 'input email' },
  { id: 'text', label: 'Text', hint: 'textarea' },
  { id: 'tinymce', label: 'TinyMCE', hint: 'html' },
  { id: 'monaco', label: 'Monaco', hint: 'code' },
  { id: 'boolean', label: 'Boolean', hint: 'checkbox' },
  { id: 'passivation', label: 'Passivation', hint: 'checkbox' },
  { id: 'date', label: 'Date', hint: 'date' },
  { id: 'datetime', label: 'Datetime', hint: 'datetime' },
  { id: 'time', label: 'Time', hint: 'time' },
  { id: 'select', label: 'Select', hint: 'options' },
  { id: 'multiselect', label: 'Multiselect', hint: 'options' },
  { id: 'tags', label: 'Tags', hint: 'chips' },
  { id: 'join', label: 'Join', hint: 'lookup table' },
  { id: 'lookup', label: 'Lookup', hint: 'join filtrabile' },
  { id: 'multijoin', label: 'Multijoin', hint: 'join multiplo' },
  { id: 'multilookup', label: 'Multilookup', hint: 'lookup multiplo' },
  { id: 'realtionships', label: 'Relationships', hint: 'metadata:id' },
  { id: 'media', label: 'Media', hint: 'documento' },
  { id: 'image', label: 'Image', hint: 'immagine' },
  { id: 'gmaplocation', label: 'Map location', hint: 'lat, lng' },
  { id: 'gmappath', label: 'Map path', hint: 'punti' },
];

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

const WIDE = new Set(['text', 'tinymce', 'monaco', 'realtionships', 'media', 'image', 'gmaplocation', 'gmappath']);

export function defaultSpan(field: FieldDefinition): 12 | 6 {
  return WIDE.has(logicalFieldType(field)) ? 12 : 6;
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
