import { Routes } from '@angular/router';
import { BookListComponent } from './features/books/pages/book-list/book-list';
import { AuthGuard } from './core/guards/auth.guard';
import { CartComponent } from './features/cart/cart.component';
import { RoleGuard } from './core/guards/role.guard';
import { ShopComponent } from './features/books/pages/shop/shop';
import { MyLibrary } from './shared/components/my-library/my-library';
import { SearchResultsComponent } from './features/books/pages/search-results/search-results';
import { MyOrdersComponent } from './shared/components/my-orders/my-orders';
import { PaymentGuard } from './core/guards/payment.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'books',
    loadChildren: () => import('./features/books/book.routes').then((m) => m.BOOK_ROUTES),
    title: 'Books',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
    title: 'Authentication',
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
    title: 'Dashboard',
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/dashboard/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    title: 'Dashboard',
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
    title: 'Home',
  },
  {
    path: 'wishlist',
    loadComponent: () =>
      import('./shared/components/wishlist/wishlist.component').then((m) => m.WishlistComponent),
    title: 'Wishlist',
  },
  {
    path: 'order-success/:orderId',
    loadComponent: () =>
      import('./features/order/order.component').then((m) => m.OrderComponent),
  },
  {
    path: 'publisher',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['publisher'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/publisher/components/dashboard/dashboard.component').then(
            (m) => m.PublisherDashboardComponent
          ),
        title: 'Publisher Dashboard',
      },
      {
        path: 'books',
        loadComponent: () =>
          import('./features/publishers/pages/publisher-books/publisher-books.component').then(
            (m) => m.PublisherBooksComponent
          ),
        title: 'Publisher Books',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/publishers/pages/publisher-orders/publisher-orders.component').then(
            (m) => m.PublisherOrdersComponent
          ),
        title: 'Publisher Orders',
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  { path: 'cart', component: CartComponent },
  {
    path: 'payment',
    loadComponent: () => import('./shared/components/payment/payment').then((m) => m.Payment),
    canActivate: [PaymentGuard],
  },
  {
    path: 'shop',
    loadComponent: () => import('./features/books/pages/shop/shop').then((m) => m.ShopComponent),
  },
  {
    path: 'my-library',
    component: MyLibrary,
    canActivate: [AuthGuard],
  },
  {
    path: 'my-orders',
    loadComponent: () =>
      import('./shared/components/my-orders/my-orders').then((m) => m.MyOrdersComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./shared/components/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [AuthGuard],
    title: 'My Profile',
  },
  { path: 'search', component: SearchResultsComponent },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
