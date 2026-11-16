import { Injectable, inject, signal } from '@angular/core';
import Keycloak, { KeycloakProfile, KeycloakTokenParsed } from 'keycloak-js';

export interface SessionUser {
  initial: string;
  username: string;
  name: string;
  surname: string;
  lang: string;
  roles: string;
}

const DISPLAY_ROLES = ['User', 'Manager', 'Admin'];

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly keycloak = inject(Keycloak);
  readonly user = signal<SessionUser>(emptyUser());

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.keycloak.authenticated) return;
    const token = this.keycloak.tokenParsed as TokenClaims | undefined;
    const idToken = this.keycloak.idTokenParsed as TokenClaims | undefined;
    let profile: KeycloakProfile | undefined;
    try {
      profile = await this.keycloak.loadUserProfile();
    } catch {
      profile = undefined;
    }
    const roles = userRoles(token);
    const extra = token?.extraroles ?? [];
    const shown = displayRoles(roles, extra);
    const username = text(profile?.username) || claim(token?.preferred_username, idToken?.preferred_username);
    const name = text(profile?.firstName) || claim(token?.given_name, idToken?.given_name);
    const surname = text(profile?.lastName) || claim(token?.family_name, idToken?.family_name);
    this.user.set({
      initial: initialOf(name || username),
      username,
      name,
      surname,
      lang: 'en',
      roles: (shown.length ? shown : roles).join(', '),
    });
  }
}

interface TokenClaims extends KeycloakTokenParsed {
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  extraroles?: string[];
}

function emptyUser(): SessionUser {
  return { initial: '', username: '', name: '', surname: '', lang: 'en', roles: '' };
}

function userRoles(parsed: TokenClaims | undefined): string[] {
  const realm = parsed?.realm_access?.roles ?? [];
  const clients = Object.values(parsed?.resource_access ?? {}).flatMap((item) => item.roles ?? []);
  return [...new Set([...realm, ...clients])].filter((role) => role && role !== 'offline_access' && role !== 'uma_authorization');
}

function displayRoles(roles: string[], extra: string[]): string[] {
  const owned = new Set([...roles, ...extra].map((role) => role.toLowerCase()));
  return DISPLAY_ROLES.filter((role) => owned.has(role.toLowerCase()));
}

function claim(access?: string, id?: string): string {
  return text(access) || text(id);
}

function text(value: string | undefined): string {
  return value?.trim() ?? '';
}

function initialOf(value: string): string {
  return value.trim().charAt(0).toUpperCase();
}
