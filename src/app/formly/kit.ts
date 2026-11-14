import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { FieldDefinition } from '../core/models';

export interface MapHit {
  label: string;
  lat: number;
  lng: number;
}

export interface StoredDocument {
  uuid?: string;
  original_name?: string;
  mimetype?: string;
}

export function definitionOf(field: FieldType<FieldTypeConfig>): FieldDefinition | null {
  const value = field.props['definition'];
  return value && typeof value === 'object' ? (value as FieldDefinition) : null;
}

export function rowsOf(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

export function textOf(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

export function splitCsv(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter((item) => item.length > 0);
  if (typeof value !== 'string' || !value.trim()) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function relationMark(token: string): { name: string; letter: string } {
  const name = token.split(':')[0]?.trim() || '?';
  const letter = name.charAt(0).toLocaleUpperCase('it') || '?';
  return { name, letter };
}

export function plainExcerpt(html: string, max = 100): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style').forEach((node) => node.remove());
  const text = (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

export function shownText(value: unknown): string {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.map((item) => String(item)).join(', ') : '—';
  return String(value);
}

export function parsePoint(value: string): [number, number] | null {
  const [lat, lng] = value.split(',').map((part) => Number(part.trim()));
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

export function formatPoint(lat: number, lng: number): string {
  return `${lat}, ${lng}`;
}

export function splitPath(value: string): string[] {
  return value
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function mapEmbed(lat: number, lng: number, marker: boolean): string {
  const delta = 0.02;
  const pin = marker ? `&marker=${lat},${lng}` : '';
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta},${lat - delta},${lng + delta},${lat + delta}&layer=mapnik${pin}`;
}

export async function searchAddress(query: string): Promise<MapHit[]> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) throw new Error(String(response.status));
  const data = (await response.json()) as { display_name: string; lat: string; lon: string }[];
  return data
    .map((item) => ({ label: item.display_name, lat: Number(item.lat), lng: Number(item.lon) }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}
