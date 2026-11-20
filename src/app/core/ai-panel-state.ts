import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'ai-panel-open';

/** Open/closed state of the Ask AI panel, shared by the top bar button and the panel. */
@Injectable({ providedIn: 'root' })
export class AiPanelState {
  readonly open = signal(localStorage.getItem(STORAGE_KEY) === '1');
  readonly tab = signal<'chat' | 'help'>('chat');

  set(open: boolean): void {
    this.open.set(open);
    localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
  }

  /** Open the panel on its Help tab. */
  openHelp(): void {
    this.tab.set('help');
    this.set(true);
  }

  toggle(): void {
    this.set(!this.open());
  }
}
