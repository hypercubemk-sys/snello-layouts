import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { LayoutListComponent } from './pages/layout-list.component';
import { LayoutEditorComponent } from './pages/layout-editor.component';
import { LayoutPlayComponent } from './pages/layout-play.component';
import { DataLayoutsComponent } from './pages/data-layouts.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'layouts', component: LayoutListComponent },
  { path: 'layouts/new', component: LayoutEditorComponent },
  { path: 'layouts/:id', component: LayoutEditorComponent },
  { path: 'data', component: DataLayoutsComponent },
  { path: 'data/:id', component: LayoutPlayComponent },
  { path: 'play/:id', redirectTo: 'data/:id' },
];
