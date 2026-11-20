import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import Keycloak from 'keycloak-js';
import { filter, map } from 'rxjs';
import { LayoutStore } from './core/layout-store';
import { Session } from './core/session';
import { ButtonDirective } from '@openng/optimus-ui/button';
import { AiPanel } from './ai-panel';
import { ApiPanel } from './api-panel';
import { ApiPanelState } from './core/api-panel-state';
import { ApiStatus } from './core/api-status';
import { AiPanelState } from './core/ai-panel-state';
import { Icon } from './icon';
import { Toast } from './toast';
import { APP_VERSION } from './version';

interface Crumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, AiPanel, ButtonDirective, ApiPanel, Toast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  private readonly keycloak = inject(Keycloak);
  private readonly router = inject(Router);
  private readonly store = inject(LayoutStore);
  private readonly session = inject(Session);
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );
  readonly crumbs = computed(() => this.trail(this.path() ?? '/'));
  readonly menuOpen = signal(false);
  readonly userOpen = signal(false);
  readonly ai = inject(AiPanelState);
  readonly api = inject(ApiPanelState);
  readonly apiStatus = inject(ApiStatus);
  readonly profile = this.session.user;
  readonly version = APP_VERSION;
  readonly statusLabel = computed(() => {
    switch (this.apiStatus.state()) {
      case 'online':
        return `API ${this.apiStatus.latency()} ms`;
      case 'slow':
        return `API slow · ${this.apiStatus.latency()} ms`;
      case 'offline':
        return 'API offline';
      default:
        return 'API …';
    }
  });
  readonly statusTitle = computed(() => {
    const status = this.apiStatus;
    const checked = status.checkedAt();
    const when = checked ? ` Checked ${checked.toLocaleTimeString()}.` : '';
    const text = { checking: 'Checking the API…', online: 'The API is reachable.', slow: 'The API answers slowly.', offline: 'The API does not answer.' }[status.state()];
    return `${text} ${status.detail()}.${when} Click to check again.`.replace(/\.\./g, '.');
  });
  readonly fullName = computed(() => `${this.profile().name ?? ''} ${this.profile().surname ?? ''}`.trim());
  readonly roles = computed(() => (this.profile().roles ?? '').split(/[,\s]+/).filter((role) => role.length > 0));

  logout(): void {
    void this.keycloak.logout({ redirectUri: window.location.origin });
  }

  toggleMenu(): void {
    this.userOpen.set(false);
    this.menuOpen.update((open) => !open);
  }

  toggleUser(): void {
    this.menuOpen.set(false);
    this.userOpen.update((open) => !open);
  }

  closeMenus(): void {
    this.menuOpen.set(false);
    this.userOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  closeFromOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.user-wrap, .menu-toggle, .shell aside')) return;
    this.closeMenus();
  }

  private trail(path: string): Crumb[] {
    const home: Crumb = { label: 'Home', link: '/' };
    if (path === '/' || path === '') return [{ label: 'Home' }];
    const layouts: Crumb = { label: 'Layouts', link: '/layouts' };
    const data: Crumb = { label: 'Data', link: '/data' };
    if (path === '/layouts') return [home, { label: 'Layouts' }];
    if (path === '/data') return [home, { label: 'Data' }];
    if (path === '/api') return [home, { label: 'API' }];
    if (path === '/layouts/new') return [home, layouts, { label: 'New layout' }];
    const editor = path.match(/^\/layouts\/([^/]+)$/);
    if (editor) return [home, layouts, { label: this.store.find(editor[1])?.name || 'Layout' }];
    const play = path.match(/^\/play\/([^/]+)$/);
    if (play) return [home, layouts, { label: this.store.find(play[1])?.name || 'Play' }];
    const opened = path.match(/^\/data\/([^/]+)$/);
    if (opened) return [home, data, { label: this.store.find(opened[1])?.name || 'List' }];
    return [home];
  }
}
