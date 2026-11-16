export interface QueryCondition {
  suffix: string;
  label: string;
  sql: string;
  notes: string;
  needsValue: boolean;
}

export const QUERY_CONDITIONS: QueryCondition[] = [
  { suffix: '', label: 'Exact', sql: 'field = ?', notes: 'Exact equality', needsValue: true },
  { suffix: '_ne', label: 'Not equal', sql: 'field != ?', notes: '', needsValue: true },
  { suffix: '_lt', label: 'Less than', sql: 'field < ?', notes: '', needsValue: true },
  { suffix: '_lte', label: 'Less than or equal', sql: 'field <= ?', notes: '', needsValue: true },
  { suffix: '_gt', label: 'Greater than', sql: 'field > ?', notes: '', needsValue: true },
  { suffix: '_gte', label: 'Greater than or equal', sql: 'field >= ?', notes: '', needsValue: true },
  { suffix: '_contains', label: 'Contains', sql: "field LIKE '%?%'", notes: 'Case-sensitive', needsValue: true },
  { suffix: '_like', label: 'Like', sql: "field LIKE '%?%'", notes: 'Alias of _contains', needsValue: true },
  { suffix: '_ilike', label: 'Case-insensitive like', sql: "field ILIKE '%?%'", notes: 'PostgreSQL', needsValue: true },
  { suffix: '_containss', label: 'Contains, lowercased', sql: "lower(field) LIKE '%lower(?)%'", notes: 'Both sides lowercased', needsValue: true },
  { suffix: '_rlike', label: 'Starts with', sql: 'lower(field) LIKE lower(?)', notes: 'Bind value%; case-insensitive', needsValue: true },
  { suffix: '_llike', label: 'Ends with', sql: 'lower(field) LIKE lower(?)', notes: 'Bind %value; case-insensitive', needsValue: true },
  { suffix: '_ncontains', label: 'Does not contain', sql: "field NOT LIKE '%?%'", notes: '', needsValue: true },
  { suffix: '_in', label: 'In list', sql: 'field IN (?,?,?)', notes: 'Comma-separated values', needsValue: true },
  { suffix: '_nn', label: 'Is not null', sql: 'field IS NOT NULL', notes: 'No value needed', needsValue: false },
  { suffix: '_inn', label: 'Is null', sql: 'field IS NULL', notes: 'No value needed', needsValue: false },
  { suffix: '_nie', label: 'Not empty', sql: "field <> ''", notes: 'No value needed', needsValue: false },
  { suffix: '_ie', label: 'Empty', sql: "field = ''", notes: 'No value needed', needsValue: false },
];

export function conditionNeedsValue(suffix: string): boolean {
  return QUERY_CONDITIONS.find((item) => item.suffix === suffix)?.needsValue ?? true;
}
