import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { Paginator, PaginatorState } from '@openng/optimus-ui/paginator';
import { LayoutStore } from '../core/layout-store';
import { MetadataCatalog } from '../core/metadata-catalog';
import { Icon } from '../icon';
import { MetaIcon } from '../meta-icon';

const PAGE_SIZES = [10, 20, 50];

@Component({
  selector: 'app-data-layouts',
  imports: [RouterLink, DatePipe, Icon, MetaIcon, Paginator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-layouts.component.html',
})
export class DataLayoutsComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap);
  private readonly store = inject(LayoutStore);
  readonly metadatas = inject(MetadataCatalog);
  readonly pageStart = signal(dataPageStart(this.route.snapshot.queryParamMap));
  readonly pageSize = signal(dataPageSize(this.route.snapshot.queryParamMap));
  readonly pageSizes = PAGE_SIZES;
  readonly filtersOpen = signal(false);
  readonly draftMetadata = signal('');
  readonly appliedMetadata = signal('');
  readonly lists = computed(() => this.store.all().filter((layout) => layout.pageType === 'list'));
  readonly layoutsReady = this.store.ready;
  readonly layoutsError = this.store.error;
  readonly usedMetadata = computed(() => {
    const names = [...new Set(this.lists().map((layout) => layout.metadataName))].sort((left, right) => left.localeCompare(right));
    return names.map((name) => ({ value: name, label: this.metadatas.find(name)?.description || name }));
  });
  readonly visible = computed(() => {
    const metadata = this.appliedMetadata();
    return metadata ? this.lists().filter((layout) => layout.metadataName === metadata) : this.lists();
  });
  readonly pageItems = computed(() => {
    const size = this.pageSize();
    const start = this.pageStart();
    return this.visible().slice(start, start + size);
  });

  constructor() {
    effect(() => {
      const params = this.query();
      const size = dataPageSize(params);
      const start = dataPageStart(params);
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
    this.appliedMetadata.set(this.draftMetadata());
    this.filtersOpen.set(false);
    this.publishPage(0);
  }

  clearFilters(): void {
    this.draftMetadata.set('');
    this.appliedMetadata.set('');
    this.publishPage(0);
  }

  changePage(event: PaginatorState): void {
    const start = event.first ?? 0;
    const size = event.rows ?? this.pageSize();
    if (start === this.pageStart() && size === this.pageSize()) return;
    this.publishPage(start, size);
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
}

function dataPageSize(params: ParamMap | null | undefined): number {
  const size = Number(params?.get('size'));
  return PAGE_SIZES.includes(size) ? size : 10;
}

function dataPageStart(params: ParamMap | null | undefined): number {
  const page = Number(params?.get('page'));
  if (!Number.isFinite(page) || page < 2) return 0;
  return (Math.floor(page) - 1) * dataPageSize(params);
}
