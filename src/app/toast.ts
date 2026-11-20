import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ToastService } from './core/toast';
import { Icon } from './icon';

@Component({
  selector: 'app-toast',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of items(); track item.id) {
      <div class="toast" role="status" aria-live="polite" (click)="toasts.dismiss()">
        <app-icon name="check" />
        {{ item.text }}
      </div>
    }
  `,
})
export class Toast {
  protected readonly toasts = inject(ToastService);
  protected readonly items = computed(() => {
    const current = this.toasts.current();
    return current ? [current] : [];
  });
}
