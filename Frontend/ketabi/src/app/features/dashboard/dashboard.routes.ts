import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'user',
    pathMatch: 'full',
  },
  {
    path: 'publisher',
    loadComponent: () =>
      import('./publisher/components/dashboard/dashboard.component').then(
        (m) => m.PublisherDashboardComponent
      ),
    title: 'Publisher Dashboard',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['publisher'] },
  },
];
