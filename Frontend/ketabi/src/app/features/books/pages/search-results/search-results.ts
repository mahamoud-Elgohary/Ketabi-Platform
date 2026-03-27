import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService } from '../../../../core/services/search.service';
import { SearchParams } from '../../../../core/models/search.model';

import { FilterService,  } from '../../../../core/services/filter.service';
import { BooksParams, FilterState } from '../../../../core/models/filter.model';

import { BookCard } from '../../../../shared/components/book-card/book-card';
import { FilterSidebar } from '../../../../shared/components/filter-sidebar/filter-sidebar';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, BookCard, FilterSidebar, PaginationComponent],
  templateUrl: './search-results.html',
  styleUrl: './search-results.css'
})
export class SearchResultsComponent implements OnInit {
  books: any[] = [];
  loading = false;
  error = '';
  searchQuery = '';
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private searchService: SearchService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.currentPage = parseInt(params['page'] || '0', 10);

      if (this.searchQuery) {
        this.performSearch();
      }
    });
  }

  performSearch(): void {
    this.loading = true;
    this.error = '';

    const searchParams: SearchParams = {
      query: this.searchQuery,
      language: this.filters.language,
      age: this.filters.age,
      limit: this.pageSize,
      skip: this.currentPage * this.pageSize,
    };

    this.searchService.searchBooks(searchParams).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.books = response.data.books;
          this.totalResults = response.data.pagination.total;
          this.hasMore = response.data.pagination.hasMore;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Search Error:', err);
        this.error = 'The search failed. Please try again';
        this.loading = false;
      }
    });
  }

  onFiltersChanged(newFilters: FilterState): void {
    this.filters = newFilters;
    this.currentPage = 0;
    this.performSearch();
  }


  onPageChanged(page: number): void {
    this.currentPage = page;
    this.performSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
