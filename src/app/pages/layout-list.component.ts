import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { FIELD_TYPE_CATALOG } from '../core/field-types';
import { LayoutDocument, Metadata } from '../core/models';
import { LayoutStore } from '../core/layout-store';
import { SnelloApi } from '../core/snello-api';
import { Icon } from '../icon';

@Component({
  selector: 'app-layout-list',
  imports: [RouterLink, DatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-list.component.html',
})
export class LayoutListComponent {
  private readonly api = inject(SnelloApi);
  private readonly store = inject(LayoutStore);
  readonly catalog = FIELD_TYPE_CATALOG;
  readonly layouts = this.store.all;
  readonly metadatas = httpResource<Metadata[]>(() => this.api.metadatasRequest(), {
    defaultValue: [],
    parse: (value) => (Array.isArray(value) ? (value as Metadata[]) : []),
  });
  readonly metadataCount = computed(() => {
    const status = this.metadatas.status();
    if (status !== 'resolved' && status !== 'local') return 0;
    return this.metadatas.value().length;
  });

  remove(layout: LayoutDocument): void {
    if (!window.confirm(`Eliminare «${layout.name}»?`)) return;
    this.store.remove(layout.id);
  }
}
