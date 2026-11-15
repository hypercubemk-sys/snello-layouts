import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import Keycloak from 'keycloak-js';
import { filter, map } from 'rxjs';
import { LayoutStore } from './core/layout-store';
import { Icon } from './icon';

interface SessionUser {
  name: string;
  username: string;
  email: string;
  realm: string;
  client: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  private readonly keycloak = inject(Keycloak);
  private readonly router = inject(Router);
  private readonly store = inject(LayoutStore);
  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );
  readonly crumbs = computed(() => this.trail(this.path() ?? '/layouts'));
  readonly menuOpen = signal(false);
  readonly userOpen = signal(false);
  readonly profile = this.readProfile();

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

  private trail(path: string): { label: string }[] {
    if (path === '/' || path === '/layouts') return [{ label: 'Libreria' }];
    if (path === '/layouts/new') return [{ label: 'Nuovo layout' }];
    const editor = path.match(/^\/layouts\/([^/]+)$/);
    if (editor) return [{ label: this.store.find(editor[1])?.name || 'Layout' }];
    const play = path.match(/^\/play\/([^/]+)$/);
    if (play) return [{ label: this.store.find(play[1])?.name || 'Prova' }];
    return [];
  }

  private readProfile(): SessionUser {
    const parsed = this.keycloak.tokenParsed as
      | { preferred_username?: string; name?: string; given_name?: string; email?: string; azp?: string }
      | undefined;
    const username = parsed?.preferred_username ?? '';
    return {
      name: parsed?.name || parsed?.given_name || username || 'Account',
      username,
      email: parsed?.email ?? '',
      realm: 'snello',
      client: parsed?.azp || 'snello-admin',
    };
  }
}
