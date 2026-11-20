import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiExplorer } from '../api-explorer';
import { PageBar } from '../page-bar';

@Component({
  selector: 'app-api-docs',
  imports: [ApiExplorer, PageBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-bar kicker="api.sne.lol" title="API reference" [flush]="true" />
    <div class="api-page"><app-api-explorer /></div>
  `,
})
export class ApiDocsComponent {}
