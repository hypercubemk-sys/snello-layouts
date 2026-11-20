import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import Keycloak from 'keycloak-js';
import { ButtonDirective } from '@openng/optimus-ui/button';
import { ApiOperation, ApiParam, parseSpec } from './core/openapi';
import { QUERY_CONDITIONS } from './core/query-conditions';
import { RUNTIME_CONFIG } from './core/runtime-config';
import { ToastService } from './core/toast';
import { Icon } from './icon';

interface ApiResult {
  status: number;
  ok: boolean;
  ms: number;
  body: string;
}

/**
 * API reference built from the live OpenAPI document (`<api origin>/openapi`).
 * Lists every endpoint, shows parameters, a sample body and a ready-to-copy curl call,
 * and lets you try GET requests with your own login. Used by the /api page and the slide-over.
 */
@Component({
  selector: 'app-api-explorer',
  imports: [Icon, ButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="api" [class.compact]="compact()" [class.show-detail]="view() === 'detail'">
      <nav class="api-nav" aria-label="Endpoints">
        <input class="api-search" type="search" placeholder="Search endpoints…" aria-label="Search endpoints" [value]="query()" (input)="query.set($any($event.target).value)" />
        <button type="button" class="api-item api-guide" [class.sel]="selectedId() === 'guide'" (click)="select('guide')">
          <app-icon name="book" /> Getting started
        </button>
        @if (spec.isLoading()) {
          <p class="muted api-note">Loading the API description…</p>
        }
        @if (spec.error()) {
          <p class="muted api-note">Could not read {{ origin }}/openapi.</p>
        }
        @for (group of groups(); track group.tag) {
          <section class="api-group">
            <button type="button" class="api-group-head" [attr.aria-expanded]="isOpen(group.tag)" (click)="toggleGroup(group.tag)">
              <span>{{ group.tag }}</span>
              <span class="api-count">{{ group.operations.length }}</span>
            </button>
            @if (isOpen(group.tag)) {
              @for (op of group.operations; track op.id) {
                <button type="button" class="api-item" [class.sel]="selectedId() === op.id" [attr.title]="op.summary" (click)="select(op.id)">
                  <span class="method" [class]="'method m-' + op.method.toLowerCase()">{{ op.method }}</span>
                  <span class="api-path">{{ op.path }}</span>
                </button>
              }
            }
          </section>
        }
      </nav>

      <div class="api-detail">
        @if (compact()) {
          <button type="button" pButton [text]="true" severity="secondary" size="small" class="api-back" (click)="view.set('list')">
            <app-icon name="back" /> All endpoints
          </button>
        }

        @if (selected(); as op) {
          <header class="api-head">
            <span [class]="'method m-' + op.method.toLowerCase()">{{ op.method }}</span>
            <code class="api-fullpath">{{ op.path }}</code>
          </header>
          <p class="api-summary">{{ op.summary }} <span class="muted">· {{ op.tag }}</span></p>
          @if (op.description) {
            <p class="muted api-desc">{{ op.description }}</p>
          }

          @if (op.parameters.length) {
            <h3>Parameters</h3>
            <table class="api-table">
              <thead><tr><th>Name</th><th>In</th><th>Type</th><th></th></tr></thead>
              <tbody>
                @for (param of op.parameters; track param.in + param.name) {
                  <tr>
                    <td><code>{{ param.name }}</code>@if (param.required) { <b class="req" title="Required">*</b> }</td>
                    <td>{{ param.in }}</td>
                    <td>{{ param.type }}</td>
                    <td class="muted">{{ param.description }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }

          @if (op.bodyExample) {
            <h3>Request body <span class="muted">{{ op.bodyType }}</span></h3>
            <pre class="code api-code">{{ op.bodyExample }}</pre>
          }

          @if (op.responses.length) {
            <h3>Responses</h3>
            <ul class="api-responses">
              @for (response of op.responses; track response.code) {
                <li><b>{{ response.code }}</b> <span class="muted">{{ response.description }}</span></li>
              }
            </ul>
          }

          <h3>cURL</h3>
          <div class="api-codewrap">
            <pre class="code api-code">{{ curl() }}</pre>
            <button type="button" class="icon-btn api-copy" aria-label="Copy" title="Copy" (click)="copy(curl())"><app-icon name="clone" /></button>
          </div>

          @if (op.method === 'GET') {
            <h3>Try it</h3>
            <p class="muted api-note">Sends a GET with your login. Other methods are shown as curl only, so nothing is changed from here.</p>
            <div class="api-try">
              @for (param of tryParams(); track param.in + param.name) {
                <label>
                  <span><code>{{ param.name }}</code> <span class="muted">{{ param.in }}</span>@if (param.required) { <b class="req">*</b> }</span>
                  <input [value]="value(param)" [placeholder]="param.type" (input)="setValue(param, $event)" />
                </label>
              }
            </div>
            <div class="api-send">
              <button type="button" pButton severity="contrast" size="small" [disabled]="sending() || !canSend()" (click)="send()">
                <app-icon [name]="sending() ? 'loader' : 'send'" [class.spin]="sending()" /> Send
              </button>
              <code class="api-url">{{ url() }}</code>
            </div>
            @if (result(); as r) {
              <div class="api-result" [class.bad]="!r.ok">
                <header><b>{{ r.status || 'Error' }}</b> <span class="muted">{{ r.ms }} ms</span>
                  <button type="button" class="icon-btn" aria-label="Copy response" title="Copy" (click)="copy(r.body)"><app-icon name="clone" /></button>
                </header>
                <pre class="code api-code">{{ r.body }}</pre>
              </div>
            }
          }
        } @else {
          <h2>Getting started</h2>
          <p class="muted api-lead">{{ parsed()?.title || 'Snello API' }} {{ parsed()?.version }}. The reference below is read live from the server.</p>

          <h3>Base URL</h3>
          <div class="api-codewrap">
            <pre class="code api-code">{{ base }}</pre>
            <button type="button" class="icon-btn api-copy" aria-label="Copy" title="Copy" (click)="copy(base)"><app-icon name="clone" /></button>
          </div>

          <h3>Authentication</h3>
          <p>Every call needs a Keycloak bearer token in the <code>Authorization</code> header. This app already sends yours.</p>
          <button type="button" pButton [text]="true" severity="secondary" size="small" (click)="copyToken()"><app-icon name="clone" /> Copy my token</button>

          <h3>Read records</h3>
          <div class="api-codewrap">
            <pre class="code api-code">{{ listExample }}</pre>
            <button type="button" class="icon-btn api-copy" aria-label="Copy" title="Copy" (click)="copy(listExample)"><app-icon name="clone" /></button>
          </div>
          <ul class="api-points">
            <li><code>_start</code> and <code>_limit</code> page the result.</li>
            <li><code>_sort=field:desc</code> sorts (<code>asc</code> or <code>desc</code>).</li>
            <li><code>select_fields=a,b</code> returns only those columns.</li>
          </ul>

          <h3>Filter with suffixes</h3>
          <p class="muted">Add a suffix to a field name: <code>name_containss=wave</code>.</p>
          <table class="api-table">
            <thead><tr><th>Suffix</th><th>Meaning</th><th>SQL</th></tr></thead>
            <tbody>
              @for (item of conditions; track item.suffix) {
                <tr><td><code>{{ item.suffix || '(none)' }}</code></td><td>{{ item.label }}</td><td class="muted"><code>{{ item.sql }}</code></td></tr>
              }
            </tbody>
          </table>

          <h3>Create, update, delete</h3>
          <div class="api-codewrap">
            <pre class="code api-code">{{ writeExample }}</pre>
            <button type="button" class="icon-btn api-copy" aria-label="Copy" title="Copy" (click)="copy(writeExample)"><app-icon name="clone" /></button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ApiExplorer {
  readonly compact = input(false);

  private readonly config = inject(RUNTIME_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly keycloak = inject(Keycloak);
  private readonly toasts = inject(ToastService);

  readonly origin = new URL(this.config.api_service_path).origin;
  readonly base = this.config.api_service_path.replace(/\/$/, '');
  readonly conditions = QUERY_CONDITIONS;
  readonly listExample = `curl '${this.base}/<table>?_start=0&_limit=10&_sort=creation_date:desc&name_containss=wave' \\\n  -H 'Authorization: Bearer $TOKEN'`;
  readonly writeExample = [
    `# create`,
    `curl -X POST '${this.base}/<table>' -H 'Authorization: Bearer $TOKEN' \\`,
    `  -H 'Content-Type: application/json' -d '{"name":"New"}'`,
    ``,
    `# update`,
    `curl -X PUT '${this.base}/<table>/<uuid>' -H 'Authorization: Bearer $TOKEN' \\`,
    `  -H 'Content-Type: application/json' -d '{"name":"Renamed"}'`,
    ``,
    `# delete`,
    `curl -X DELETE '${this.base}/<table>/<uuid>' -H 'Authorization: Bearer $TOKEN'`,
  ].join('\n');

  readonly spec = httpResource<unknown>(() => `${this.origin}/openapi`);
  readonly parsed = computed(() => {
    const value = this.spec.value();
    return value ? parseSpec(value) : null;
  });

  readonly query = signal('');
  readonly selectedId = signal('guide');
  readonly view = signal<'list' | 'detail'>('list');
  private readonly closed = signal<ReadonlySet<string>>(new Set());
  private readonly values = signal<Record<string, string>>({});
  readonly result = signal<ApiResult | null>(null);
  readonly sending = signal(false);

  readonly groups = computed(() => {
    const text = this.query().trim().toLowerCase();
    const groups = new Map<string, ApiOperation[]>();
    for (const op of this.parsed()?.operations ?? []) {
      if (text && !`${op.method} ${op.path} ${op.summary} ${op.tag}`.toLowerCase().includes(text)) continue;
      groups.set(op.tag, [...(groups.get(op.tag) ?? []), op]);
    }
    return [...groups].map(([tag, operations]) => ({ tag, operations }));
  });

  readonly selected = computed(() => this.parsed()?.operations.find((op) => op.id === this.selectedId()) ?? null);
  readonly tryParams = computed(() => (this.selected()?.parameters ?? []).filter((param) => param.in !== 'header'));

  readonly url = computed(() => {
    const op = this.selected();
    if (!op) return '';
    let path = op.path;
    const search = new URLSearchParams();
    for (const param of this.tryParams()) {
      const value = this.values()[this.key(param)]?.trim() ?? '';
      if (param.in === 'path') path = path.replace(`{${param.name}}`, value ? encodeURIComponent(value) : `<${param.name}>`);
      else if (value) search.set(param.name, value);
    }
    const query = search.toString();
    return `${this.origin}${path}${query ? `?${query}` : ''}`;
  });

  readonly canSend = computed(() => this.tryParams().filter((param) => param.in === 'path').every((param) => !!this.values()[this.key(param)]?.trim()));

  readonly curl = computed(() => {
    const op = this.selected();
    if (!op) return '';
    const parts = [`curl -X ${op.method} '${this.url()}'`, `-H 'Authorization: Bearer $TOKEN'`];
    if (op.bodyExample) {
      parts.push(`-H 'Content-Type: ${op.bodyType}'`);
      parts.push(`-d '${op.bodyExample.replace(/\s*\n\s*/g, ' ')}'`);
    }
    return parts.join(' \\\n  ');
  });

  select(id: string): void {
    this.selectedId.set(id);
    this.view.set('detail');
    this.result.set(null);
  }

  isOpen(tag: string): boolean {
    return !!this.query().trim() || !this.closed().has(tag);
  }

  toggleGroup(tag: string): void {
    this.closed.update((set) => {
      const next = new Set(set);
      if (!next.delete(tag)) next.add(tag);
      return next;
    });
  }

  value(param: ApiParam): string {
    return this.values()[this.key(param)] ?? '';
  }

  setValue(param: ApiParam, event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.values.update((current) => ({ ...current, [this.key(param)]: text }));
  }

  private key(param: ApiParam): string {
    return `${this.selectedId()}|${param.in}:${param.name}`;
  }

  async send(): Promise<void> {
    if (this.sending() || !this.canSend()) return;
    this.sending.set(true);
    const started = performance.now();
    try {
      const response = await firstValueFrom(this.http.get(this.url(), { observe: 'response', responseType: 'text' }));
      this.result.set({ status: response.status, ok: true, ms: Math.round(performance.now() - started), body: pretty(response.body ?? '') });
    } catch (error) {
      const failure = error as HttpErrorResponse;
      this.result.set({
        status: failure.status,
        ok: false,
        ms: Math.round(performance.now() - started),
        body: pretty(typeof failure.error === 'string' ? failure.error : JSON.stringify(failure.error ?? failure.message)),
      });
    } finally {
      this.sending.set(false);
    }
  }

  copy(text: string): void {
    void navigator.clipboard.writeText(text).then(() => this.toasts.show('Copied.'));
  }

  copyToken(): void {
    const token = this.keycloak.token;
    if (!token) {
      this.toasts.show('No token available.');
      return;
    }
    void navigator.clipboard.writeText(token).then(() => this.toasts.show('Token copied.'));
  }
}

function pretty(text: string): string {
  const clipped = text.length > 20000 ? `${text.slice(0, 20000)}\n… (truncated)` : text;
  try {
    return text.length > 20000 ? clipped : JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return clipped;
  }
}
