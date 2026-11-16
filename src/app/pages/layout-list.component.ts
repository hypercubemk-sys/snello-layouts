import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CheckboxModule } from '@openng/optimus-ui/checkbox';
import { Paginator, PaginatorState } from '@openng/optimus-ui/paginator';
import { FormsModule } from '@angular/forms';
import { seedBody } from '../core/layout-shape';
import { FieldDefinition, LayoutDocument, PageKind } from '../core/models';
import { LayoutStore } from '../core/layout-store';
import { groupsOf, MetadataCatalog } from '../core/metadata-catalog';
import { SnelloApi } from '../core/snello-api';
import { Icon } from '../icon';
import { MetaIcon } from '../meta-icon';

const PAGE_SIZES = [10, 20, 50];

@Component({
  selector: 'app-layout-list',
  imports: [RouterLink, DatePipe, Icon, MetaIcon, CheckboxModule, FormsModule, Paginator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-list.component.html',
})
export class LayoutListComponent {
  private readonly store = inject(LayoutStore);
  private readonly http = inject(HttpClient);
  private readonly api = inject(SnelloApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap);
  readonly metadatas = inject(MetadataCatalog);
  readonly layouts = this.store.all;
  readonly layoutsReady = this.store.ready;
  readonly layoutsError = this.store.error;
  readonly writeError = signal('');
  readonly pendingId = signal<string | null>(null);
  readonly filtersOpen = signal(false);
  readonly draftName = signal('');
  readonly draftGroup = signal('');
  readonly draftMetadata = signal('');
  readonly draftType = signal('');
  readonly appliedName = signal('');
  readonly appliedGroup = signal('');
  readonly appliedMetadata = signal('');
  readonly appliedType = signal('');
  readonly bulkOpen = signal(false);
  readonly bulkBusy = signal(false);
  readonly bulkNote = signal('');
  readonly picked = signal<string[]>([]);
  readonly kinds = signal<PageKind[]>(['list', 'edit', 'view']);
  readonly kindChoices: PageKind[] = ['list', 'edit', 'view'];
  readonly pageStart = signal(libraryPageStart(this.route.snapshot.queryParamMap));
  readonly pageSize = signal(libraryPageSize(this.route.snapshot.queryParamMap));
  readonly pageSizes = PAGE_SIZES;
  readonly groups = computed(() => groupsOf(this.layouts().map((layout) => layout.metadataName), (table) => this.metadatas.groupOf(table)));
  readonly usedMetadata = computed(() => {
    const group = this.draftGroup();
    const names = [...new Set(this.layouts().map((layout) => layout.metadataName))]
      .filter((name) => !group || this.metadatas.groupOf(name) === group)
      .sort((left, right) => left.localeCompare(right));
    return names.map((name) => ({ value: name, label: this.metadatas.find(name)?.description || name }));
  });
  readonly chips = computed(() => {
    const chips: { name: string; label: string; value: string }[] = [];
    const name = this.appliedName().trim();
    if (name) chips.push({ name: 'name', label: 'Name', value: name });
    const group = this.appliedGroup();
    if (group) chips.push({ name: 'group', label: 'Group', value: group });
    const metadata = this.appliedMetadata();
    if (metadata) chips.push({ name: 'metadata', label: 'Metadata', value: this.metadataLabel(metadata) });
    const type = this.appliedType();
    if (type === 'list' || type === 'edit' || type === 'view') chips.push({ name: 'type', label: 'Type', value: this.pageTitle(type) });
    return chips;
  });
  readonly visible = computed(() => {
    const name = this.appliedName().trim().toLowerCase();
    const group = this.appliedGroup();
    const metadata = this.appliedMetadata();
    const type = this.appliedType();
    return this.layouts().filter((layout) => {
      if (name && !layout.name.toLowerCase().includes(name)) return false;
      if (group && this.metadatas.groupOf(layout.metadataName) !== group) return false;
      if (metadata && layout.metadataName !== metadata) return false;
      if (type && layout.pageType !== type) return false;
      return true;
    });
  });
  readonly pageItems = computed(() => {
    const size = this.pageSize();
    const start = this.pageStart();
    return this.visible().slice(start, start + size);
  });

  constructor() {
    effect(() => {
      const params = this.query();
      const size = libraryPageSize(params);
      const start = libraryPageStart(params);
      untracked(() => {
        if (this.pageSize() !== size) this.pageSize.set(size);
        if (this.pageStart() !== start) this.pageStart.set(start);
      });
    });

    effect(() => {
      const count = this.visible().length;
      const size = this.pageSize();
      const start = this.pageStart();
      const maxStart = count === 0 ? 0 : Math.floor((count - 1) / size) * size;
      if (start <= maxStart) return;
      untracked(() => this.publishPage(maxStart, size));
    });
  }

  metadataLabel(name: string): string {
    return this.usedMetadata().find((item) => item.value === name)?.label || name;
  }

  applyFilters(event?: Event): void {
    event?.preventDefault();
    this.appliedName.set(this.draftName());
    this.appliedGroup.set(this.draftGroup());
    this.appliedMetadata.set(this.draftMetadata());
    this.appliedType.set(this.draftType());
    this.filtersOpen.set(false);
    this.publishPage(0);
  }

  onGroup(value: string): void {
    this.draftGroup.set(value);
    if (value && this.metadatas.groupOf(this.draftMetadata()) !== value) this.draftMetadata.set('');
  }

  clearFilters(): void {
    this.draftName.set('');
    this.draftGroup.set('');
    this.draftMetadata.set('');
    this.draftType.set('');
    this.appliedName.set('');
    this.appliedGroup.set('');
    this.appliedMetadata.set('');
    this.appliedType.set('');
    this.publishPage(0);
  }

  changePage(event: PaginatorState): void {
    const start = event.first ?? 0;
    const size = event.rows ?? this.pageSize();
    if (start === this.pageStart() && size === this.pageSize()) return;
    this.publishPage(start, size);
  }

  pageMark(kind: PageKind): string {
    if (kind === 'list') return 'L';
    if (kind === 'view') return 'V';
    return 'E';
  }

  pageTitle(kind: PageKind): string {
    if (kind === 'list') return 'List';
    if (kind === 'view') return 'View';
    return 'Edit';
  }

  openBulk(): void {
    this.bulkNote.set('');
    this.bulkOpen.set(true);
  }

  closeBulk(): void {
    if (this.bulkBusy()) return;
    this.bulkOpen.set(false);
  }

  metadataOn(name: string): boolean {
    return this.picked().includes(name);
  }

  toggleMetadata(name: string, on: boolean): void {
    this.picked.update((current) => {
      const has = current.includes(name);
      if (on === has) return current;
      return on ? [...current, name] : current.filter((item) => item !== name);
    });
  }

  selectAllMetadata(): void {
    this.picked.set(this.metadatas.list().map((item) => item.table_name));
  }

  clearMetadata(): void {
    this.picked.set([]);
  }

  kindOn(kind: PageKind): boolean {
    return this.kinds().includes(kind);
  }

  toggleKind(kind: PageKind, on: boolean): void {
    this.kinds.update((current) => {
      const has = current.includes(kind);
      if (on === has) return current;
      return on ? [...current, kind] : current.filter((item) => item !== kind);
    });
  }

  async generate(): Promise<void> {
    const tables = this.picked();
    const kinds = this.kinds();
    if (tables.length === 0 || kinds.length === 0 || this.bulkBusy()) return;
    const jobs: { table: string; kind: PageKind }[] = [];
    let skipped = 0;
    for (const table of tables) {
      for (const kind of kinds) {
        if (this.layouts().some((item) => item.metadataName === table && item.pageType === kind)) skipped += 1;
        else jobs.push({ table, kind });
      }
    }
    this.bulkBusy.set(true);
    this.bulkNote.set('');
    try {
      const fieldsByTable = new Map<string, FieldDefinition[]>();
      for (const table of [...new Set(jobs.map((job) => job.table))]) {
        fieldsByTable.set(table, await this.loadFields(table));
      }
      let created = 0;
      for (const job of jobs) {
        if (this.layouts().some((item) => item.metadataName === job.table && item.pageType === job.kind)) {
          skipped += 1;
          continue;
        }
        const metadata = this.metadatas.find(job.table);
        await this.store.save({
          id: crypto.randomUUID(),
          name: `${job.table} ${job.kind === 'list' ? 'list' : job.kind}`,
          metadataName: job.table,
          metadataUuid: metadata?.uuid ?? '',
          pageType: job.kind,
          updatedAt: new Date().toISOString(),
          body: seedBody(job.kind, fieldsByTable.get(job.table) ?? []),
        });
        created += 1;
      }
      this.bulkNote.set(created === 0 ? `Nothing new. Skipped ${skipped}.` : `Created ${created}. Skipped ${skipped}.`);
    } catch {
      this.bulkNote.set('Could not save the layouts.');
    } finally {
      this.bulkBusy.set(false);
    }
  }

  private publishPage(start: number, size = this.pageSize()): void {
    const safeSize = PAGE_SIZES.includes(size) ? size : 10;
    const page = Math.floor(Math.max(0, start) / safeSize) + 1;
    this.pageSize.set(safeSize);
    this.pageStart.set((page - 1) * safeSize);
    const nextPage = page > 1 ? String(page) : null;
    const nextSize = safeSize === 10 ? null : String(safeSize);
    const params = this.query();
    if ((params?.get('page') ?? null) === nextPage && (params?.get('size') ?? null) === nextSize) return;
    void this.router.navigate([], {
      queryParams: { page: nextPage, size: nextSize },
      queryParamsHandling: 'merge',
    });
  }

  private async loadFields(table: string): Promise<FieldDefinition[]> {
    const request = this.api.fieldsRequest(table);
    const value = await firstValueFrom(this.http.get<unknown>(request.url));
    const fields = Array.isArray(value) ? (value as FieldDefinition[]) : [];
    return fields.sort((left, right) => (left.order_num ?? 0) - (right.order_num ?? 0));
  }

  askRemove(layout: LayoutDocument): void {
    this.pendingId.set(layout.id);
  }

  cancelRemove(): void {
    this.pendingId.set(null);
  }

  confirmRemove(layout: LayoutDocument): void {
    if (this.pendingId() !== layout.id) return;
    this.pendingId.set(null);
    this.writeError.set('');
    void this.store.remove(layout.id).catch(() => this.writeError.set("Can't delete the layout."));
  }

  clone(layout: LayoutDocument): void {
    const copy = structuredClone(layout);
    copy.id = crypto.randomUUID();
    copy.name = `${layout.name} copy`;
    copy.updatedAt = new Date().toISOString();
    if (copy.body.kind === 'wizard') {
      for (const page of copy.body.pages) {
        page.id = crypto.randomUUID();
        for (const box of page.boxes) box.id = crypto.randomUUID();
      }
    }
    this.writeError.set('');
    void this.store.save(copy).catch(() => this.writeError.set("Can't save the layout."));
  }
}

function libraryPageSize(params: ParamMap | null | undefined): number {
  const size = Number(params?.get('size'));
  return PAGE_SIZES.includes(size) ? size : 10;
}

function libraryPageStart(params: ParamMap | null | undefined): number {
  const page = Number(params?.get('page'));
  if (!Number.isFinite(page) || page < 2) return 0;
  return (Math.floor(page) - 1) * libraryPageSize(params);
}
