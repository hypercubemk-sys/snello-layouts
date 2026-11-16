import { FormlyFieldConfig } from '@ngx-formly/core';
import { logicalFieldType, searchFormlyType } from './field-types';
import { FieldDefinition, LayoutFieldPlacement, WizardLayoutBody } from './models';

export function wizardFields(
  body: WizardLayoutBody,
  definitions: FieldDefinition[],
  step: number,
  mode: 'edit' | 'view',
  context: { tableName?: string; recordKey?: string } = {},
): FormlyFieldConfig[] {
  return body.pages.map((page, index) => ({
    resetOnHide: false,
    hide: index !== step,
    fieldGroup: page.boxes.map((box) => ({
      wrappers: ['box'],
      props: { label: box.title },
      fieldGroupClassName: 'field-grid',
      fieldGroup: box.fields
        .map((placement) => fieldConfig(placement, definitions, mode, context))
        .filter((field): field is FormlyFieldConfig => !!field),
    })),
  }));
}

export function filterFormFields(fields: FieldDefinition[]): FormlyFieldConfig[] {
  return fields
    .filter((field) => !!field.name)
    .map((field) => ({
      key: field.name ?? '',
      type: filterControlType(field),
      className: 'span-4',
      wrappers: ['field'],
      props: {
        label: field.label || field.name || '',
        required: false,
        search: true,
        searchMode: field.search_condition,
        typeLabel: searchTypeLabel(field.search_condition),
        definition: field,
      },
    }));
}

function filterControlType(field: FieldDefinition): string {
  const logical = logicalFieldType(field);
  if (logical === 'join' || logical === 'lookup') return 'lookup';
  if (logical === 'multijoin' || logical === 'multilookup') return 'multilookup';
  if (logical === 'realtionships') return 'realtionships';
  if (logical === 'tinymce' || logical === 'text') return 'string';
  return searchFormlyType(field);
}

function searchTypeLabel(condition: string | null | undefined): string {
  if (condition === 'containss' || condition === 'like') return 'Like';
  if (condition === 'gte' || condition === 'lte' || condition === 'range') return 'Range';
  if (condition === 'boolean') return 'Boolean';
  return 'Equals';
}

function fieldConfig(
  placement: LayoutFieldPlacement,
  definitions: FieldDefinition[],
  mode: 'edit' | 'view',
  context: { tableName?: string; recordKey?: string },
): FormlyFieldConfig | null {
  if (!placement.fieldName) return null;
  const definition = definitions.find((field) => field.name === placement.fieldName);
  const logical = definition ? logicalFieldType(definition) : 'string';
  const linked = placement.showIf && placement.showIfField ? placement.showIfField : '';
  return {
    key: placement.fieldName,
    type: logical,
    className: `span-${placement.span}`,
    resetOnHide: false,
    wrappers: ['field'],
    expressions: linked
      ? {
          hide: (field) => !hasValue(field.model?.[linked]),
        }
      : undefined,
    props: {
      label: definition?.label || placement.fieldName,
      description: definition?.description || undefined,
      required: mode === 'edit' && placement.required,
      readonly: mode === 'view',
      typeLabel: logical,
      tableName: context.tableName,
      recordKey: context.recordKey,
      definition,
    },
  };
}

function hasValue(value: unknown): boolean {
  if (value == null || value === false) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value);
  if (Array.isArray(value)) return value.some((item) => hasValue(item));
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}
