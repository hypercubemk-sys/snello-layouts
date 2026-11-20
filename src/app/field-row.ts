import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { Icon } from './icon';

/**
 * One field in the layout studio: type badge, name, optional controls
 * (projected into [options]) and move/remove actions.
 * Used by both the block field cards and the list column rows.
 */
@Component({
  selector: 'app-field-row',
  imports: [Icon, CdkDragHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.off]': 'off()' },
  template: `
    <div class="fr-main">
      <span class="fr-grip" cdkDragHandle title="Drag to reorder" aria-label="Drag to reorder"><app-icon name="grip" /></span>
      <span class="type-badge" [attr.title]="typeTitle()" [attr.aria-label]="typeTitle()">
        <app-icon [name]="icon()" />
      </span>
      <strong class="fr-name">{{ label() }}</strong>
    </div>
    <div class="fr-options"><ng-content select="[options]" /></div>
    <span class="fr-actions">
        <button type="button" class="icon-btn" aria-label="Move up" title="Move up" (click)="moveUp.emit()">
          <app-icon name="up" />
        </button>
        <button type="button" class="icon-btn" aria-label="Move down" title="Move down" (click)="moveDown.emit()">
          <app-icon name="down" />
        </button>
        @if (removable()) {
          <button type="button" class="icon-btn" aria-label="Remove" title="Remove" (click)="remove.emit()">
            <app-icon name="close" />
          </button>
        }
      </span>

  `,
})
export class FieldRow {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly typeTitle = input('');
  readonly removable = input(true);
  readonly off = input(false);
  readonly moveUp = output<void>();
  readonly moveDown = output<void>();
  readonly remove = output<void>();
}
