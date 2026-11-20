import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, HostListener, input, output, signal } from '@angular/core';
import { HelpSection, Inline, parseDocument } from './markdown';
import { Icon } from '../icon';

interface DocEntry {
  id: string;
  title: string;
  file: string;
}

@Component({
  selector: 'app-help-dialog',
  imports: [Icon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-dialog.html',
})
export class HelpDialog {
  readonly closed = output<void>();
  /** Shown inline (for the AI panel) instead of as a modal sheet. */
  readonly embedded = input(false);
  private readonly openIds = signal<ReadonlySet<string>>(new Set());

  /** Inline help is an accordion: topics are closed until clicked, or while searching. */
  isOpen(section: HelpSection): boolean {
    if (!this.embedded()) return true;
    return !!this.query().trim() || section.heading === section.document || this.openIds().has(section.id);
  }

  toggle(id: string): void {
    this.openIds.update((set) => {
      const next = new Set(set);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }
  readonly query = signal('');
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly sections = signal<HelpSection[]>([]);
  readonly visible = computed(() => {
    const needle = this.query().trim().toLowerCase();
    const sections = this.sections();
    if (!needle) return sections;
    return sections.filter((section) => `${section.document} ${section.heading} ${section.text}`.toLowerCase().includes(needle));
  });

  constructor() {
    void this.load();
    queueMicrotask(() => document.querySelector<HTMLInputElement>('.help-sheet input')?.focus());
  }

  close(): void {
    this.closed.emit();
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  pieces(value: string): { hit: boolean; value: string }[] {
    const needle = this.query().trim();
    if (!needle) return [{ hit: false, value }];
    const parts: { hit: boolean; value: string }[] = [];
    const source = value.toLowerCase();
    const target = needle.toLowerCase();
    let cursor = 0;
    let found = source.indexOf(target, cursor);
    while (found >= 0) {
      if (found > cursor) parts.push({ hit: false, value: value.slice(cursor, found) });
      parts.push({ hit: true, value: value.slice(found, found + needle.length) });
      cursor = found + needle.length;
      found = source.indexOf(target, cursor);
    }
    if (cursor < value.length) parts.push({ hit: false, value: value.slice(cursor) });
    return parts.filter((part) => part.value.length > 0);
  }

  trackPart(part: Inline, index: number): string {
    return `${index}-${part.kind}-${part.value}`;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  private async load(): Promise<void> {
    try {
      const index = await readJson<DocEntry[]>(asset('documentation/index.json'));
      const documents = await Promise.all(
        index.map(async (entry) => ({ entry, markdown: await readText(asset(`documentation/${entry.file}`)) })),
      );
      this.sections.set(documents.flatMap(({ entry, markdown }) => parseDocument(markdown, entry.id, entry.title)));
      this.status.set('ready');
    } catch {
      this.status.set('error');
    }
  }
}

function asset(path: string): string {
  const base = document.querySelector('base')?.getAttribute('href') || '/';
  return new URL(path, new URL(base, window.location.origin)).toString();
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(url);
  return response.json() as Promise<T>;
}

async function readText(url: string): Promise<string> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(url);
  return response.text();
}
