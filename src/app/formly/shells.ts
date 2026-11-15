import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';
import { fieldTypeIcon } from '../core/field-types';
import { Icon } from '../icon';

@Component({
  selector: 'app-field-shell',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field" [class.is-error]="showError">
      <div class="field-head">
        <label [attr.for]="id">{{ props.label }}</label>
        @if (props.required) {
          <em>*</em>
        }
        @if (!search && typeLabel) {
          <span class="type-pill type-mark">
            <app-icon [name]="typeIcon" />
            {{ typeLabel }}
          </span>
        }
      </div>
      <ng-container #fieldComponent></ng-container>
      @if (props.description) {
        <p class="hint">{{ props.description }}</p>
      }
      @if (showError) {
        <p class="error">Obbligatorio</p>
      }
    </div>
  `,
})
export class FieldShell extends FieldWrapper {
  get search(): boolean {
    return this.props['search'] === true;
  }

  get typeLabel(): string {
    const label = this.props['typeLabel'];
    return typeof label === 'string' ? label : '';
  }

  get typeIcon(): string {
    return fieldTypeIcon(this.typeLabel);
  }
}

@Component({
  selector: 'app-box-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="box">
      <header>{{ props.label }}</header>
      <ng-container #fieldComponent></ng-container>
    </section>
  `,
})
export class BoxShell extends FieldWrapper {}
