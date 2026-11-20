import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiExplorer } from './api-explorer';
import { ApiPanelState } from './core/api-panel-state';
import { Icon } from './icon';

/** Slide-over API reference, opened from the top bar on any page. */
@Component({
  selector: 'app-api-panel',
  imports: [ApiExplorer, Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (state.open()) {
      <div class="api-backdrop" (click)="state.set(false)"></div>
      <section class="api-panel" role="dialog" aria-label="API reference">
        <header>
          <span class="api-panel-title"><app-icon name="book" /> API reference</span>
          <span class="api-panel-tools">
            <a class="icon-btn" routerLink="/api" aria-label="Open as a page" title="Open as a page" (click)="state.set(false)"><app-icon name="maximize" /></a>
            <button type="button" class="icon-btn" aria-label="Close" title="Close" (click)="state.set(false)"><app-icon name="close" /></button>
          </span>
        </header>
        <app-api-explorer [compact]="true" />
      </section>
    }
  `,
})
export class ApiPanel {
  protected readonly state = inject(ApiPanelState);

  @HostListener('document:keydown.escape')
  close(): void {
    if (this.state.open()) this.state.set(false);
  }
}
