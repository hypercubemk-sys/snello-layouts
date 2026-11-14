export interface RuntimeConfig {
  apiBase: string;
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
}

export interface Metadata {
  uuid: string;
  table_name: string;
  description?: string | null;
  table_key?: string | null;
  table_key_addition?: string | null;
  icon?: string | null;
  metadata_group?: string | null;
}

export interface FieldDefinition {
  uuid?: string;
  metadata_uuid?: string;
  metadata_name?: string | null;
  name?: string | null;
  label?: string | null;
  description?: string | null;
  type?: string | null;
  input_type?: string | null;
  options?: string | null;
  mandatory?: boolean | null;
  searchable?: boolean | null;
  search_condition?: string | null;
  search_field_name?: string | null;
  show_in_list?: boolean | null;
  order_num?: number | null;
  join_table_name?: string | null;
  join_table_key?: string | null;
  join_table_select_fields?: string | null;
}

export type PageKind = 'list' | 'edit' | 'view';

export interface LayoutFieldPlacement {
  fieldName: string;
  required: boolean;
  span: 12 | 6 | 4;
}

export interface LayoutBox {
  id: string;
  title: string;
  fields: LayoutFieldPlacement[];
}

export interface LayoutPage {
  id: string;
  title: string;
  boxes: LayoutBox[];
}

export interface ListColumn {
  fieldName: string;
  visible: boolean;
  order: number;
}

export interface ListLayoutBody {
  kind: 'list';
  columns: ListColumn[];
}

export interface WizardLayoutBody {
  kind: 'wizard';
  pages: LayoutPage[];
}

export type LayoutBody = ListLayoutBody | WizardLayoutBody;

export interface LayoutDocument {
  id: string;
  name: string;
  metadataName: string;
  metadataUuid: string;
  pageType: PageKind;
  updatedAt: string;
  body: LayoutBody;
}

export interface SelectOption {
  label: string;
  value: string;
}
