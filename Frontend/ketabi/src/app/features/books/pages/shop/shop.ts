import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterService,  } from '../../../../core/services/filter.service';
import { BooksParams, FilterState } from '../../../../core/models/filter.model';

import { BookCard } from '../../../../shared/components/book-card/book-card';
import { FilterSidebar } from '../../../../shared/components/filter-sidebar/filter-sidebar';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, BookCard, FilterSidebar, PaginationComponent],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class ShopComponent implements OnInit {
  books: any[] = [];
  loading = false;
  error = '';
  totalResults = 0;
  currentPage = 0;
  pageSize = 12;
  hasMore = false;
  Math = Math;

  filters: FilterState = {
    minPrice: 0,
    maxPrice: 1000,
    sort: '-createdAt'
  };

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.loading = true;
    this.error = '';

    const params: BooksParams = {
      language: this.filters.language,
      age: this.filters.age,
      genre: this.filters.genre,
      minPrice: this.filters.minPrice,
      maxPrice: this.filters.maxPrice,
      sort: this.filters.sort,
      limit: this.pageSize,
      skip: this.currentPage * this.pageSize,
    };

    this.filterService.getBooks(params).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.books = response.data.books;
          this.totalResults = response.data.pagination.total;
          this.hasMore = response.data.pagination.hasMore;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading books:', err);
        this.error = 'فشل في تحميل الكتب';
        this.loading = false;
      }
    });
  }

  onFiltersChanged(newFilters: FilterState): void {
    this.filters = newFilters;
    this.currentPage = 0;
    this.loadBooks();
  }

  onPageChanged(page: number): void {
    this.currentPage = page;
    this.loadBooks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
