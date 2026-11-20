import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { AiPanelState } from './core/ai-panel-state';
import { HelpDialog } from './help/help-dialog';
import { Icon } from './icon';

interface AiMessage {
  role: 'user' | 'ai';
  text: string;
}

/**
 * Collapsible "Ask AI" side panel, shown on every page.
 * UI only for now: replies are a stub until an AI endpoint is wired in.
 */
@Component({
  selector: 'app-ai-panel',
  imports: [Icon, HelpDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.open]': 'state.open()' },
  template: `
    @if (state.open()) {
      <section class="ai-card" aria-label="Ask AI">
        <header>
          <span class="ai-title"><app-icon name="sparkle" /> Ask AI</span>
          <button type="button" class="icon-btn" aria-label="Collapse Ask AI" title="Collapse" (click)="state.set(false)">
            <app-icon name="forward" />
          </button>
        </header>

        <div class="ai-tabs" role="tablist">
          <button type="button" role="tab" [attr.aria-selected]="state.tab() === 'chat'" [class.on]="state.tab() === 'chat'" (click)="state.tab.set('chat')"><app-icon name="sparkle" /> Chat</button>
          <button type="button" role="tab" [attr.aria-selected]="state.tab() === 'help'" [class.on]="state.tab() === 'help'" (click)="state.tab.set('help')"><app-icon name="help" /> Help</button>
        </div>

        @if (state.tab() === 'help') {
          <div class="ai-help"><app-help-dialog [embedded]="true" /></div>
        } @else {
          <div class="ai-log" #log aria-live="polite">
            @if (messages().length === 0) {
              <div class="ai-empty">
                <p>Ask anything about your layouts, fields or data.</p>
                <div class="ai-suggestions">
                  @for (suggestion of suggestions; track suggestion) {
                    <button type="button" class="chip" (click)="send(suggestion)">{{ suggestion }}</button>
                  }
                </div>
                <p class="ai-note">Preview: the assistant is not connected yet.</p>
              </div>
            }
            @for (message of messages(); track $index) {
              <div class="ai-msg" [class.user]="message.role === 'user'">{{ message.text }}</div>
            }
            @if (thinking()) {
              <div class="ai-msg ai-thinking" aria-label="Thinking"><i></i><i></i><i></i></div>
            }
          </div>

          <form class="ai-composer" (submit)="$event.preventDefault(); send(draft.value); draft.value = ''">
            <textarea
              #draft
              rows="2"
              placeholder="Ask AI…"
              aria-label="Message"
              (keydown.enter)="onEnter($event, draft)"></textarea>
            <button type="submit" class="icon-btn btn-primary" aria-label="Send" title="Send">
              <app-icon name="send" />
            </button>
          </form>
        }
      </section>
    }
  `,
})
export class AiPanel {
  readonly state = inject(AiPanelState);
  readonly messages = signal<AiMessage[]>([]);
  readonly thinking = signal(false);
  readonly suggestions = ['Which layouts have no view yet?', 'Suggest a layout for this metadata', 'Explain this field type'];
  private readonly log = viewChild<ElementRef<HTMLElement>>('log');

  constructor() {
    effect(() => {
      this.messages();
      this.thinking();
      const element = this.log()?.nativeElement;
      if (element) queueMicrotask(() => (element.scrollTop = element.scrollHeight));
    });
  }

  onEnter(event: Event, field: HTMLTextAreaElement): void {
    if ((event as KeyboardEvent).shiftKey) return;
    event.preventDefault();
    this.send(field.value);
    field.value = '';
  }

  send(text: string): void {
    const clean = text.trim();
    if (!clean || this.thinking()) return;
    this.messages.update((list) => [...list, { role: 'user', text: clean }]);
    this.thinking.set(true);
    setTimeout(() => {
      this.messages.update((list) => [
        ...list,
        { role: 'ai', text: 'The assistant is not connected yet. Once an AI endpoint is configured, answers will appear here.' },
      ]);
      this.thinking.set(false);
    }, 700);
  }
}
