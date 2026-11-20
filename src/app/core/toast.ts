import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
}

/** One black confirmation toast at the bottom centre, shared by every page. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<ToastMessage | null>(null);
  private nextId = 1;
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(text: string, duration = 3500): void {
    clearTimeout(this.timer);
    this.current.set({ id: this.nextId++, text });
    this.timer = setTimeout(() => this.current.set(null), duration);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.current.set(null);
  }
}
