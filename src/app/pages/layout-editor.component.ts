import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CheckboxModule } from '@openng/optimus-ui/checkbox';
import { PanelModule } from '@openng/optimus-ui/panel';
import { defaultSpan, FIELD_TYPE_CATALOG, fieldTypeIcon, logicalFieldType } from '../core/field-types';
import { orderedColumns, placementNames, resolvedSearch, searchChoices, SEARCH_LABEL, seedBody, withSearches } from '../core/layout-shape';
import {
  ColumnCondition,
  CustomFilter,
  CustomFilterMode,
  CustomFilterType,
  FieldDefinition,
  FilterValueSource,
  LayoutBody,
  LayoutBox,
  LayoutDocument,
  LayoutPage,
  ListLayoutBody,
  PageKind,
  SearchMode,
  WizardLayoutBody,
} from '../core/models';
import { conditionNeedsValue, QUERY_CONDITIONS } from '../core/query-conditions';
import { LayoutStore } from '../core/layout-store';
import { MetadataCatalog } from '../core/metadata-catalog';
import { SnelloApi } from '../core/snello-api';
import { Icon } from '../icon';
import { MetaIcon } from '../meta-icon';

interface LayoutDraft {
  kind: PageKind;
  enabled: boolean;
  name: string;
}

@Component({
  selector: 'app-layout-editor',
  imports: [RouterLink, FormsModule, CheckboxModule, PanelModule, Icon, MetaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-editor.component.html',
})
export class LayoutEditorComponent {
  private readonly api = inject(SnelloApi);
  private readonly store = inject(LayoutStore);
  readonly metadatas = inject(MetadataCatalog);
  private readonly router = inject(Router);
  private readonly boundRoute = signal<string | null>(null);

  readonly id = input<string>();
  readonly metadata = input<string>();
  readonly page = input<string>();

  readonly name = signal('');
  readonly metadataName = signal('');
  readonly pageType = signal<PageKind>('edit');
  readonly body = signal<LayoutBody>({ kind: 'wizard', pages: [] });
  readonly selectedPageId = signal<string | null>(null);
  readonly selectedBoxId = signal<string | null>(null);
  readonly pendingSeed = signal(false);
  readonly saved = signal(false);
  readonly viewNotice = signal('');
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly showJson = signal(false);
  readonly drafts = signal<LayoutDraft[]>(freshDrafts(''));

  readonly metadataOptions = computed(() => this.metadatas.list());

  readonly fieldResource = httpResource<FieldDefinition[]>(() => {
    const name = this.metadataName();
    return name ? this.api.fieldsRequest(name) : undefined;
  }, {
    defaultValue: [],
    parse: (value) => (Array.isArray(value) ? (value as FieldDefinition[]) : []),
  });

  readonly fields = computed(() => {
    const status = this.fieldResource.status();
    if (status !== 'resolved' && status !== 'local') return [];
    return [...this.fieldResource.value()].sort((left, right) => (left.order_num ?? 0) - (right.order_num ?? 0));
  });

  readonly wizard = computed(() => {
    const body = this.body();
    return body.kind === 'wizard' ? body : null;
  });

  readonly listBody = computed(() => {
    const body = this.body();
    return body.kind === 'list' ? body : null;
  });

  readonly columns = computed(() => {
    const body = this.listBody();
    return body ? orderedColumns(body) : [];
  });
  readonly customFilters = computed(() => this.listBody()?.filters ?? []);
  readonly conditionsOpen = signal(false);
  readonly queryConditions = QUERY_CONDITIONS;
  readonly filterTypes: CustomFilterType[] = ['string', 'boolean', 'date', 'numeric'];

  readonly selectedPage = computed(() => {
    const wizard = this.wizard();
    if (!wizard) return null;
    return wizard.pages.find((page) => page.id === this.selectedPageId()) ?? wizard.pages[0] ?? null;
  });

  readonly usedNames = computed(() => new Set(placementNames(this.body())));
  readonly canCreate = computed(() => {
    if (this.id() || !this.metadataName()) return false;
    const status = this.fieldResource.status();
    if (status !== 'resolved' && status !== 'local') return false;
    return this.drafts().some((draft) => draft.enabled);
  });
  readonly existingForMetadata = computed(() =>
    this.store.all().filter((item) => item.metadataName === this.metadataName()),
  );
  readonly viewTargets = computed(() => {
    if (!this.id() || this.pageType() !== 'edit' || this.body().kind !== 'wizard') return [];
    return this.store.all().filter((item) => item.metadataName === this.metadataName() && item.pageType === 'view');
  });
  readonly jsonText = computed(() => JSON.stringify(this.body(), null, 2));

  constructor() {
    effect(() => {
      const routeId = this.id() ?? '';
      const ready = this.store.ready();
      const presetMetadata = this.metadata();
      const presetPage = this.page();
      const status = this.metadatas.resource.status();
      if (!ready) return;
      if (status === 'idle' || status === 'loading' || status === 'reloading') return;
      untracked(() => {
        if (this.boundRoute() === routeId) return;
        this.boundRoute.set(routeId);
        this.loadError.set('');
        if (routeId) {
          const saved = this.store.find(routeId);
          if (!saved) {
            this.loadError.set('Layout not found');
            return;
          }
          this.hydrate(saved);
          return;
        }
        if (presetPage === 'list' || presetPage === 'edit' || presetPage === 'view') {
          this.pageType.set(presetPage);
        }
        if (presetMetadata) {
          this.metadataName.set(presetMetadata);
          this.drafts.set(freshDrafts(presetMetadata, presetPage === 'list' || presetPage === 'edit' || presetPage === 'view' ? presetPage : undefined));
          this.pendingSeed.set(true);
        }
      });
    });

    effect(() => {
      if (!this.pendingSeed()) return;
      const name = this.metadataName();
      const status = this.fieldResource.status();
      if (!name || status === 'idle' || status === 'loading' || status === 'reloading') return;
      if (status === 'error') {
        untracked(() => this.pendingSeed.set(false));
        return;
      }
      const fields = this.fields();
      const stale = fields.some((field) => field.metadata_name && field.metadata_name !== name);
      if (stale) return;
      const kind = this.pageType();
      untracked(() => {
        const seeded = seedBody(kind, fields);
        this.body.set(seeded);
        if (seeded.kind === 'wizard') {
          this.selectedPageId.set(seeded.pages[0]?.id ?? null);
          this.selectedBoxId.set(seeded.pages[0]?.boxes[0]?.id ?? null);
        }
        this.name.set(`${name} ${kind}`);
        this.pendingSeed.set(false);
      });
    });

    effect(() => {
      const fields = this.fields();
      const body = this.body();
      const metadata = this.metadataName();
      if (body.kind !== 'list' || fields.length === 0) return;
      if (fields.some((field) => field.metadata_name && field.metadata_name !== metadata)) return;
      const next = withSearches(body, fields);
      if (next === body) return;
      untracked(() => this.body.set(next));
    });
  }

  onName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
    this.saved.set(false);
    this.viewNotice.set('');
  }

  onMetadata(select: HTMLSelectElement): void {
    const name = select.value;
    if (name === this.metadataName()) return;
    if (this.metadataName() && placementNames(this.body()).length && !window.confirm('Changing metadata rebuilds the layout. Continue?')) {
      select.value = this.metadataName();
      return;
    }
    this.metadataName.set(name);
    this.saved.set(false);
    this.viewNotice.set('');
    this.drafts.set(freshDrafts(name));
    if (this.id()) {
      this.name.set(name ? `${name} ${this.pageType()}` : '');
      this.pendingSeed.set(!!name);
    }
  }

  setPageType(kind: PageKind): void {
    if (kind === this.pageType()) return;
    const crossing = (kind === 'list') !== (this.pageType() === 'list');
    if (crossing && this.metadataName() && !window.confirm('Switching between list and form rebuilds the body. Continue?')) return;
    this.pageType.set(kind);
    this.saved.set(false);
    this.viewNotice.set('');
    if (this.metadataName()) this.name.set(`${this.metadataName()} ${kind}`);
    if (crossing && this.metadataName()) this.pendingSeed.set(true);
  }

  fieldOf(name: string): FieldDefinition | undefined {
    return this.fields().find((field) => field.name === name);
  }

  typeOf(name: string): string {
    const field = this.fieldOf(name);
    return field ? logicalFieldType(field) : 'string';
  }

  typeIcon(name: string): string {
    return fieldTypeIcon(this.typeOf(name));
  }

  typeTitle(name: string): string {
    const type = this.typeOf(name);
    return FIELD_TYPE_CATALOG.find((item) => item.id === type)?.label ?? type;
  }

  searchOf(name: string): SearchMode {
    const column = this.columns().find((item) => item.fieldName === name);
    return resolvedSearch(column?.search, this.fieldOf(name));
  }

  searchOptions(name: string): SearchMode[] {
    return searchChoices(this.fieldOf(name));
  }

  searchLabel(mode: SearchMode): string {
    return SEARCH_LABEL[mode];
  }

  setSearch(name: string, event: Event): void {
    const search = (event.target as HTMLSelectElement).value as SearchMode;
    if (!this.searchOptions(name).includes(search)) return;
    this.patchList((body) => {
      body.columns = body.columns.map((column) => (column.fieldName === name ? { ...column, search } : column));
    });
  }

  toggleColumn(name: string): void {
    this.patchList((body) => {
      body.columns = body.columns.map((column) =>
        column.fieldName === name ? { ...column, visible: !column.visible } : column,
      );
    });
  }

  moveColumn(name: string, direction: -1 | 1): void {
    const columns = this.columns();
    const index = columns.findIndex((column) => column.fieldName === name);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= columns.length) return;
    this.patchList((body) => {
      const ordered = orderedColumns(body);
      const current = ordered[index];
      const next = ordered[target];
      if (!current || !next) return;
      ordered[index] = next;
      ordered[target] = current;
      body.columns = ordered.map((column, order) => ({ ...column, order }));
    });
  }

  filterTypeLabel(type: CustomFilterType): string {
    if (type === 'boolean') return 'Boolean';
    if (type === 'date') return 'Date';
    if (type === 'numeric') return 'Numeric';
    return 'String';
  }

  needsValue(suffix: string): boolean {
    return conditionNeedsValue(suffix);
  }

  addFilter(): void {
    this.patchList((body) => {
      body.filters = [...(body.filters ?? []), emptyFilter()];
    });
  }

  removeFilter(id: string): void {
    this.patchList((body) => {
      body.filters = (body.filters ?? []).filter((item) => item.id !== id);
    });
  }

  setFilterLabel(id: string, event: Event): void {
    this.patchFilter(id, { label: (event.target as HTMLInputElement).value });
  }

  setFilterType(id: string, event: Event): void {
    const type = (event.target as HTMLSelectElement).value as CustomFilterType;
    if (!this.filterTypes.includes(type)) return;
    this.patchFilter(id, { type });
  }

  setFilterMode(id: string, event: Event): void {
    const mode = (event.target as HTMLSelectElement).value as CustomFilterMode;
    if (mode !== 'columns' && mode !== 'developer') return;
    this.patchList((body) => {
      const filter = (body.filters ?? []).find((item) => item.id === id);
      if (!filter || filter.mode === mode) return;
      filter.mode = mode;
      if (mode === 'columns' && filter.conditions.length === 0) filter.conditions = [emptyCondition()];
    });
  }

  setFilterName(id: string, event: Event): void {
    this.patchFilter(id, { name: (event.target as HTMLInputElement).value });
  }

  setFilterSuffix(id: string, event: Event): void {
    const suffix = (event.target as HTMLSelectElement).value;
    if (!QUERY_CONDITIONS.some((item) => item.suffix === suffix)) return;
    this.patchFilter(id, { suffix });
  }

  addCondition(filterId: string): void {
    this.patchList((body) => {
      const filter = (body.filters ?? []).find((item) => item.id === filterId);
      if (!filter) return;
      filter.conditions = [...filter.conditions, emptyCondition()];
    });
  }

  removeCondition(filterId: string, conditionId: string): void {
    this.patchList((body) => {
      const filter = (body.filters ?? []).find((item) => item.id === filterId);
      if (!filter) return;
      filter.conditions = filter.conditions.filter((item) => item.id !== conditionId);
    });
  }

  setConditionField(filterId: string, conditionId: string, event: Event): void {
    this.patchCondition(filterId, conditionId, { fieldName: (event.target as HTMLSelectElement).value });
  }

  setConditionSuffix(filterId: string, conditionId: string, event: Event): void {
    const suffix = (event.target as HTMLSelectElement).value;
    if (!QUERY_CONDITIONS.some((item) => item.suffix === suffix)) return;
    this.patchCondition(filterId, conditionId, conditionNeedsValue(suffix) ? { suffix } : { suffix, value: '', source: 'fixed' });
  }

  setConditionSource(filterId: string, conditionId: string, event: Event): void {
    const source = (event.target as HTMLSelectElement).value as FilterValueSource;
    if (source !== 'fixed' && source !== 'dynamic') return;
    this.patchCondition(filterId, conditionId, source === 'dynamic' ? { source, value: '' } : { source });
  }

  setConditionValue(filterId: string, conditionId: string, event: Event): void {
    this.patchCondition(filterId, conditionId, { value: (event.target as HTMLInputElement | HTMLSelectElement).value });
  }

  addPage(): void {
    const page: LayoutPage = {
      id: crypto.randomUUID(),
      title: `Page ${(this.wizard()?.pages.length ?? 0) + 1}`,
      boxes: [{ id: crypto.randomUUID(), title: 'Block', fields: [] }],
    };
    this.patchWizard((body) => body.pages.push(page));
    this.selectedPageId.set(page.id);
    this.selectedBoxId.set(page.boxes[0]?.id ?? null);
  }

  renamePage(id: string, event: Event): void {
    const title = (event.target as HTMLInputElement).value;
    this.patchWizard((body) => {
      const page = body.pages.find((item) => item.id === id);
      if (page) page.title = title;
    });
  }

  selectPage(id: string): void {
    this.selectedPageId.set(id);
    const page = this.wizard()?.pages.find((item) => item.id === id);
    this.selectedBoxId.set(page?.boxes[0]?.id ?? null);
  }

  removePage(id: string): void {
    const title = this.wizard()?.pages.find((page) => page.id === id)?.title || 'this page';
    if (!window.confirm(`Delete “${title}”?`)) return;
    this.patchWizard((body) => {
      body.pages = body.pages.filter((page) => page.id !== id);
    });
    this.selectedPageId.set(this.wizard()?.pages[0]?.id ?? null);
    this.selectedBoxId.set(this.wizard()?.pages[0]?.boxes[0]?.id ?? null);
  }

  addBox(): void {
    const pageId = this.selectedPage()?.id;
    if (!pageId) return;
    const box: LayoutBox = { id: crypto.randomUUID(), title: 'Block', fields: [] };
    this.patchWizard((body) => {
      body.pages.find((page) => page.id === pageId)?.boxes.push(box);
    });
    this.selectedBoxId.set(box.id);
  }

  renameBox(id: string, event: Event): void {
    const title = (event.target as HTMLInputElement).value;
    this.patchWizard((body) => {
      for (const page of body.pages) {
        const box = page.boxes.find((item) => item.id === id);
        if (box) box.title = title;
      }
    });
  }

  selectBox(id: string): void {
    this.selectedBoxId.set(id);
  }

  removeBox(id: string): void {
    const title = this.wizard()?.pages.flatMap((page) => page.boxes).find((box) => box.id === id)?.title || 'this block';
    if (!window.confirm(`Delete “${title}”?`)) return;
    this.patchWizard((body) => {
      for (const page of body.pages) page.boxes = page.boxes.filter((box) => box.id !== id);
    });
  }

  addField(name: string): void {
    if (this.usedNames().has(name)) return;
    const page = this.selectedPage();
    if (!page) return;
    const boxId = this.selectedBoxId() ?? page.boxes[0]?.id;
    if (!boxId) {
      this.addBox();
    }
    const target = this.selectedBoxId() ?? boxId;
    if (!target) return;
    const definition = this.fieldOf(name);
    this.patchWizard((body) => {
      const box = body.pages.flatMap((item) => item.boxes).find((item) => item.id === target);
      if (!box || box.fields.some((field) => field.fieldName === name)) return;
      box.fields.push({
        fieldName: name,
        required: !!definition?.mandatory,
        span: definition ? defaultSpan(definition) : 4,
      });
    });
  }

  toggleRequired(boxId: string, name: string): void {
    this.patchWizard((body) => {
      const field = body.pages.flatMap((page) => page.boxes).find((box) => box.id === boxId)?.fields.find((item) => item.fieldName === name);
      if (field) field.required = !field.required;
    });
  }

  showIfChoices(name: string, current: string | null | undefined): FieldDefinition[] {
    const choices = this.fields().filter((field) => !!field.name && field.name !== name);
    if (current && !choices.some((field) => field.name === current)) {
      return [{ name: current, label: current }, ...choices];
    }
    return choices;
  }

  setShowIf(boxId: string, name: string, enabled: boolean): void {
    const current = this.wizard()?.pages.flatMap((page) => page.boxes).find((box) => box.id === boxId)?.fields.find((item) => item.fieldName === name);
    if (!current || !!current.showIf === enabled) return;
    this.patchWizard((body) => {
      const field = body.pages.flatMap((page) => page.boxes).find((box) => box.id === boxId)?.fields.find((item) => item.fieldName === name);
      if (!field) return;
      field.showIf = enabled;
      if (!enabled) field.showIfField = null;
    });
  }

  setShowIfField(boxId: string, name: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.patchWizard((body) => {
      const field = body.pages.flatMap((page) => page.boxes).find((box) => box.id === boxId)?.fields.find((item) => item.fieldName === name);
      if (!field) return;
      field.showIf = true;
      field.showIfField = value || null;
    });
  }

  setSpan(boxId: string, name: string, event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    const span = raw === '4' ? 4 : raw === '6' ? 6 : 12;
    this.patchWizard((body) => {
      const field = body.pages.flatMap((page) => page.boxes).find((box) => box.id === boxId)?.fields.find((item) => item.fieldName === name);
      if (field) field.span = span;
    });
  }

  moveField(boxId: string, name: string, direction: -1 | 1): void {
    this.patchWizard((body) => {
      const box = body.pages.flatMap((page) => page.boxes).find((item) => item.id === boxId);
      if (!box) return;
      const index = box.fields.findIndex((field) => field.fieldName === name);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= box.fields.length) return;
      const current = box.fields[index];
      const next = box.fields[target];
      if (!current || !next) return;
      box.fields[index] = next;
      box.fields[target] = current;
    });
  }

  removeField(boxId: string, name: string): void {
    this.patchWizard((body) => {
      const box = body.pages.flatMap((page) => page.boxes).find((item) => item.id === boxId);
      if (box) box.fields = box.fields.filter((field) => field.fieldName !== name);
    });
  }

  existingNames(): string {
    return this.existingForMetadata().map((item) => item.name).join(', ');
  }

  draftLabel(kind: PageKind): string {
    if (kind === 'list') return 'List';
    if (kind === 'view') return 'View';
    return 'Edit';
  }

  toggleDraft(kind: PageKind): void {
    this.drafts.update((drafts) => drafts.map((draft) => (draft.kind === kind ? { ...draft, enabled: !draft.enabled } : draft)));
  }

  renameDraft(kind: PageKind, event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    this.drafts.update((drafts) => drafts.map((draft) => (draft.kind === kind ? { ...draft, name } : draft)));
  }

  createDrafts(): void {
    const metadataName = this.metadataName();
    if (!metadataName || !this.canCreate()) return;
    const fields = this.fields();
    const metadata = this.metadataOptions().find((item) => item.table_name === metadataName);
    const created: LayoutDocument[] = [];
    for (const draft of this.drafts()) {
      if (!draft.enabled) continue;
      created.push({
        id: crypto.randomUUID(),
        name: draft.name.trim() || `${metadataName} ${draft.kind === 'list' ? 'list' : draft.kind}`,
        metadataName,
        metadataUuid: metadata?.uuid ?? '',
        pageType: draft.kind,
        updatedAt: new Date().toISOString(),
        body: seedBody(draft.kind, fields),
      });
    }
    void this.persist(created);
  }

  save(): void {
    const metadataName = this.metadataName();
    if (!metadataName || this.saving()) return;
    void this.persist([this.currentDocument()]);
  }

  async updateViews(): Promise<void> {
    const body = this.body();
    const views = this.viewTargets();
    if (body.kind !== 'wizard' || views.length === 0 || this.saving()) return;
    this.saving.set(true);
    this.loadError.set('');
    this.saved.set(false);
    this.viewNotice.set('');
    try {
      await this.store.save(this.currentDocument());
      const arrangement = structuredClone(body);
      for (const view of views) {
        await this.store.save({
          ...view,
          updatedAt: new Date().toISOString(),
          body: structuredClone(arrangement),
        });
      }
      this.viewNotice.set(views.length === 1 ? 'View updated.' : 'Views updated.');
    } catch {
      this.loadError.set("Can't update the view.");
    } finally {
      this.saving.set(false);
    }
  }

  private currentDocument(): LayoutDocument {
    const metadataName = this.metadataName();
    const metadata = this.metadataOptions().find((item) => item.table_name === metadataName);
    return {
      id: this.id() || crypto.randomUUID(),
      name: this.name().trim() || `${metadataName} ${this.pageType()}`,
      metadataName,
      metadataUuid: metadata?.uuid ?? '',
      pageType: this.pageType(),
      updatedAt: new Date().toISOString(),
      body: this.body(),
    };
  }

  private async persist(documents: LayoutDocument[]): Promise<void> {
    this.loadError.set('');
    try {
      const saved: LayoutDocument[] = [];
      for (const document of documents) saved.push(await this.store.save(document));
      const target = saved.find((item) => item.pageType === 'list') ?? saved[0];
      if (!target) return;
      this.saved.set(true);
      this.boundRoute.set(target.id);
      if (documents.length > 1) {
        void this.router.navigate(['/layouts']);
        return;
      }
      void this.router.navigate(['/layouts', target.id], { replaceUrl: true });
    } catch {
      this.loadError.set("Can't save the layout.");
    }
  }

  private hydrate(layout: LayoutDocument): void {
    this.name.set(layout.name);
    this.pageType.set(layout.pageType);
    this.metadataName.set(layout.metadataName);
    this.body.set(structuredClone(layout.body));
    this.pendingSeed.set(false);
    if (layout.body.kind === 'wizard') {
      this.selectedPageId.set(layout.body.pages[0]?.id ?? null);
      this.selectedBoxId.set(layout.body.pages[0]?.boxes[0]?.id ?? null);
    }
  }

  private patchList(mutator: (body: ListLayoutBody) => void): void {
    this.body.update((body) => {
      if (body.kind !== 'list') return body;
      const next = structuredClone(body);
      mutator(next);
      return next;
    });
    this.saved.set(false);
    this.viewNotice.set('');
  }

  private patchFilter(id: string, patch: Partial<CustomFilter>): void {
    this.patchList((body) => {
      const filter = (body.filters ?? []).find((item) => item.id === id);
      if (!filter) return;
      Object.assign(filter, patch);
    });
  }

  private patchCondition(filterId: string, conditionId: string, patch: Partial<ColumnCondition>): void {
    this.patchList((body) => {
      const filter = (body.filters ?? []).find((item) => item.id === filterId);
      const condition = filter?.conditions.find((item) => item.id === conditionId);
      if (!condition) return;
      Object.assign(condition, patch);
    });
  }

  private patchWizard(mutator: (body: WizardLayoutBody) => void): void {
    this.body.update((body) => {
      if (body.kind !== 'wizard') return body;
      const next = structuredClone(body);
      mutator(next);
      return next;
    });
    this.saved.set(false);
    this.viewNotice.set('');
  }
}

function emptyCondition(): ColumnCondition {
  return { id: crypto.randomUUID(), fieldName: '', suffix: '', source: 'dynamic', value: '' };
}

function emptyFilter(): CustomFilter {
  return {
    id: crypto.randomUUID(),
    label: '',
    type: 'string',
    mode: 'columns',
    conditions: [emptyCondition()],
    name: '',
    suffix: '',
  };
}

function freshDrafts(table: string, only?: PageKind): LayoutDraft[] {
  const kinds: PageKind[] = ['list', 'edit', 'view'];
  return kinds.map((kind) => ({
    kind,
    enabled: only ? kind === only : true,
    name: table ? `${table} ${kind === 'list' ? 'list' : kind}` : '',
  }));
}
