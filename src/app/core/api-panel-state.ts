import { Injectable, signal } from '@angular/core';

/** Open/closed state of the API reference slide-over (top bar button + panel). */
@Injectable({ providedIn: 'root' })
export class ApiPanelState {
  readonly open = signal(false);

  set(open: boolean): void {
    this.open.set(open);
  }

  toggle(): void {
    this.open.update((value) => !value);
  }
}
