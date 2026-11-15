import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { metadataIconClass } from './core/metadata-catalog';

@Component({
  selector: 'app-meta-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (glyph()) {
      <i class="meta-icon" [class]="classes()" [attr.title]="tip()" [attr.aria-label]="tip()"></i>
    } @else if (label()) {
      <i class="meta-icon letter" [attr.title]="tip()" [attr.aria-label]="tip()">{{ letter() }}</i>
    }
  `,
})
export class MetaIcon {
  readonly icon = input('');
  readonly label = input('');
  readonly title = input('');
  readonly tip = computed(() => this.title() || this.label());
  readonly glyph = computed(() => metadataIconClass(this.icon()));
  readonly classes = computed(() => `meta-icon ${this.glyph()}`);
  readonly letter = computed(() => this.label().trim().charAt(0).toLocaleUpperCase('it') || '?');
}
