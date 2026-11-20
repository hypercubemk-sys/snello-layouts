import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SnelloApi } from './snello-api';

export type ApiState = 'checking' | 'online' | 'slow' | 'offline';

/**
 * Pings a small public endpoint of the Snello API on a timer and exposes whether it answers.
 * There is no health endpoint, so the list of table names is used (tiny, always available).
 */
@Injectable({ providedIn: 'root' })
export class ApiStatus implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly api = inject(SnelloApi);

  readonly state = signal<ApiState>('checking');
  readonly latency = signal<number | null>(null);
  readonly checkedAt = signal<Date | null>(null);
  readonly detail = signal('');

  private timer: ReturnType<typeof setInterval> | undefined;
  private readonly onVisible = () => {
    if (!document.hidden) void this.check();
  };
  private readonly onNetwork = () => void this.check();

  constructor() {
    void this.check();
    this.timer = setInterval(() => {
      if (!document.hidden) void this.check();
    }, 30000);
    document.addEventListener('visibilitychange', this.onVisible);
    window.addEventListener('online', this.onNetwork);
    window.addEventListener('offline', this.onNetwork);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    document.removeEventListener('visibilitychange', this.onVisible);
    window.removeEventListener('online', this.onNetwork);
    window.removeEventListener('offline', this.onNetwork);
  }

  async check(): Promise<void> {
    const started = performance.now();
    try {
      const response = await firstValueFrom(this.http.get(`${this.api.dataList}/names`, { observe: 'response', responseType: 'text' }));
      const ms = Math.round(performance.now() - started);
      this.latency.set(ms);
      this.detail.set(`HTTP ${response.status}`);
      this.state.set(ms > 1500 ? 'slow' : 'online');
    } catch (error) {
      const status = (error as { status?: number }).status ?? 0;
      this.latency.set(null);
      this.detail.set(status ? `HTTP ${status}` : 'No answer');
      // 401/403/404 still prove the server is reachable; only no answer or a 5xx counts as down.
      this.state.set(status > 0 && status < 500 ? 'online' : 'offline');
    }
    this.checkedAt.set(new Date());
  }
}
