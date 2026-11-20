import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '@openng/optimus-ui/button';
import { Icon } from './icon';

/**
 * The slim top bar every page starts with: kicker, title (optionally editable),
 * and the page's actions projected on the right.
 *
 *   <app-page-bar title="Brands edit" back="/layouts" [editable]="true" (edit)="…">
 *     <button class="btn btn-primary">Save</button>
 *   </app-page-bar>
 *
 * Project an icon into [bar-icon] to show it before the kicker text.
 */
@Component({
  selector: 'app-page-bar',
  imports: [RouterLink, ButtonDirective, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'page-head top-bar', '[class.flush]': 'flush()' },
  template: `
    <div class="top-title">
      @if (back()) {
        <a pButton [text]="true" severity="secondary" size="small" class="bar-icon-btn bar-back" [routerLink]="back()" [attr.aria-label]="backLabel()" [attr.title]="backLabel()">
          <app-icon name="back" />
        </a>
      }
      @if (kicker()) {
        <p class="kicker with-icon"><ng-content select="[bar-icon]" /><span>{{ kicker() }}</span></p>
      }
      <h1>
        <span class="bar-title">{{ title() }}</span>
        @if (editable()) {
          <button type="button" pButton [text]="true" severity="secondary" size="small" class="bar-icon-btn title-edit" [attr.aria-label]="editLabel()" [attr.title]="editLabel()" (click)="edit.emit()">
            <app-icon name="pencil" />
          </button>
        }
      </h1>
    </div>
    <div class="row-actions"><ng-content /></div>
  `,
})
export class PageBar {
  readonly title = input.required<string>();
  readonly kicker = input('');
  /** Route for a back arrow before the title; empty hides it. */
  readonly back = input('');
  readonly backLabel = input('Back');
  readonly editable = input(false);
  readonly editLabel = input('Edit');
  /** Sit flush against the content below (full-height panes) instead of leaving a gap. */
  readonly flush = input(false);
  readonly edit = output<void>();
}
