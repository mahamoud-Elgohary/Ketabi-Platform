import { Routes } from '@angular/router';
import { BookListComponent } from './pages/book-list/book-list';
import { BookDetailsComponent } from './pages/book-details/book-details';

export const BOOK_ROUTES: Routes = [
  {
    path: '',
    component: BookListComponent,
    title: 'Books',
  },
  {
    path: ':id',
    component: BookDetailsComponent,
    title: 'Book Details',
  },
  {
    path: 'category/:category',
    component: BookListComponent,
    title: 'Books by Category',
  },
];
