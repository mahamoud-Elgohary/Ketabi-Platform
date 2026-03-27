import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/guards/auth.guard';
import { RoleGuard } from '../../../core/guards/role.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Admin Dashboard',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'users',
    loadComponent: () => import('./components/users/user.component').then((m) => m.UserComponent),
    title: 'User Management',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'books',
    loadComponent: () => import('./components/books/books.component').then((m) => m.BooksComponent),
    title: 'Book Management',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'responses',
    loadComponent: () =>
      import('./components/Responses/response.component').then((m) => m.PublisherRequestsComponent),
    title: 'User Responses',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },
];
