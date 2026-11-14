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
      type: searchFormlyType(field),
      className: 'span-4',
      wrappers: ['field'],
      props: {
        label: field.label || field.name || '',
        required: false,
        search: true,
        typeLabel: field.search_condition || 'eq',
        definition: field,
      },
    }));
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
  return {
    key: placement.fieldName,
    type: logical,
    className: `span-${placement.span}`,
    resetOnHide: false,
    wrappers: ['field'],
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
