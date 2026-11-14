import { Routes } from '@angular/router';
import { LayoutListComponent } from './pages/layout-list.component';
import { LayoutEditorComponent } from './pages/layout-editor.component';
import { LayoutPlayComponent } from './pages/layout-play.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'layouts' },
  { path: 'layouts', component: LayoutListComponent },
  { path: 'layouts/new', component: LayoutEditorComponent },
  { path: 'layouts/:id', component: LayoutEditorComponent },
  { path: 'play/:id', component: LayoutPlayComponent },
];
