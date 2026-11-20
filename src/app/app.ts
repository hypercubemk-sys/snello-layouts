import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import Keycloak from 'keycloak-js';
import { filter, map } from 'rxjs';
import { LayoutStore } from './core/layout-store';
import { Session } from './core/session';
import { AiPanel } from './ai-panel';
import { AiPanelState } from './core/ai-panel-state';
import { Icon } from './icon';
import { Toast } from './toast';
import { HelpDialog } from './help/help-dialog';
import { APP_VERSION } from './version';

interface Crumb {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, HelpDialog, AiPanel, Toast],
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
  readonly helpOpen = signal(false);
  readonly ai = inject(AiPanelState);
  readonly profile = this.session.user;
  readonly version = APP_VERSION;

  logout(): void {
    void this.keycloak.logout({ redirectUri: window.location.origin });
  }

  toggleMenu(): void {
    this.userOpen.set(false);
    this.helpOpen.set(false);
    this.menuOpen.update((open) => !open);
  }

  toggleUser(): void {
    this.menuOpen.set(false);
    this.helpOpen.set(false);
    this.userOpen.update((open) => !open);
  }

  toggleHelp(): void {
    this.menuOpen.set(false);
    this.userOpen.set(false);
    this.helpOpen.update((open) => !open);
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
