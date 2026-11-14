import { Injectable, computed, signal } from '@angular/core';
import { LayoutDocument } from './models';

const STORAGE_KEY = 'snello.layouts.v1';

@Injectable({ providedIn: 'root' })
export class LayoutStore {
  private readonly documents = signal<LayoutDocument[]>(this.read());
  readonly all = computed(() =>
    [...this.documents()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
  );

  find(id: string | null | undefined): LayoutDocument | null {
    if (!id) return null;
    return this.documents().find((item) => item.id === id) ?? null;
  }

  save(document: LayoutDocument): void {
    this.documents.update((current) => {
      const next = [document, ...current.filter((item) => item.id !== document.id)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  remove(id: string): void {
    this.documents.update((current) => {
      const next = current.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  private read(): LayoutDocument[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LayoutDocument[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
