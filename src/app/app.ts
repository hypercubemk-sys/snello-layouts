import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import Keycloak from 'keycloak-js';
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
