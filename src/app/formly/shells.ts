import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldWrapper } from '@ngx-formly/core';
import { PanelModule } from '@openng/optimus-ui/panel';
import { fieldTypeIcon, FIELD_TYPE_CATALOG } from '../core/field-types';
import { Icon } from '../icon';

@Component({
  selector: 'app-field-shell',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field" [class.is-error]="showError">
      <div class="field-head">
        @if (!search && typeLabel) {
          <span class="type-badge" [attr.title]="typeTitle" [attr.aria-label]="typeTitle">
            <app-icon [name]="typeIcon" />
          </span>
        }
        <label [attr.for]="id">{{ props.label }}</label>
        @if (props.required) {
          <em>*</em>
        }
      </div>
      <ng-container #fieldComponent></ng-container>
      @if (props.description) {
        <p class="hint">{{ props.description }}</p>
      }
      @if (showError) {
        <p class="error">Required</p>
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

  get typeTitle(): string {
    return FIELD_TYPE_CATALOG.find((item) => item.id === this.typeLabel)?.label ?? this.typeLabel;
  }
}

@Component({
  selector: 'app-box-shell',
  imports: [PanelModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-panel [header]="title" [toggleable]="true">
      <ng-container #fieldComponent></ng-container>
    </p-panel>
  `,
})
export class BoxShell extends FieldWrapper {
  get title(): string {
    return this.props.label ?? '';
  }
}
