import { Injectable, signal } from '@angular/core';

/** Open/closed state of the API reference slide-over (top bar button + panel). */
export interface ApiRequestPreset {
  /** Operation id as the explorer lists it, e.g. `get /api/{table}`. */
  id: string;
  path: Record<string, string>;
  query: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ApiPanelState {
  readonly open = signal(false);
  /** An endpoint to jump to, with its parameters filled in (set by pages such as Data). */
  readonly request = signal<ApiRequestPreset | null>(null);

  show(request: ApiRequestPreset): void {
    this.request.set(request);
    this.open.set(true);
  }

  set(open: boolean): void {
    this.open.set(open);
  }

  toggle(): void {
    this.open.update((value) => !value);
  }
}
