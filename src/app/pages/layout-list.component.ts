import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fieldTypeCatalogGroups } from '../core/field-types';
import { LayoutDocument } from '../core/models';
import { LayoutStore } from '../core/layout-store';
import { MetadataCatalog } from '../core/metadata-catalog';
import { Icon } from '../icon';
import { MetaIcon } from '../meta-icon';

@Component({
  selector: 'app-layout-list',
  imports: [RouterLink, DatePipe, Icon, MetaIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './layout-list.component.html',
})
export class LayoutListComponent {
  private readonly store = inject(LayoutStore);
  readonly groups = fieldTypeCatalogGroups();
  readonly metadatas = inject(MetadataCatalog);
  readonly layouts = this.store.all;
  readonly pendingId = signal<string | null>(null);
  readonly metadataCount = computed(() => this.metadatas.list().length);

  askRemove(layout: LayoutDocument): void {
    this.pendingId.set(layout.id);
  }

  cancelRemove(): void {
    this.pendingId.set(null);
  }

  confirmRemove(layout: LayoutDocument): void {
    if (this.pendingId() !== layout.id) return;
    this.pendingId.set(null);
    this.store.remove(layout.id);
  }
}
