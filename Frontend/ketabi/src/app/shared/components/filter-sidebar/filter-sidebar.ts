import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService } from '../../../core/services/filter.service';

export interface FilterState {
  language?: string;
  age?: string;
  genre?: string;
  minPrice: number;
  maxPrice: number;
  sort: string;
}

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.html',
  styleUrls: ['./filter-sidebar.css'],
 
})
export class FilterSidebar implements OnInit {
  @Output() filtersChanged = new EventEmitter<FilterState>();

  filters: FilterState = {
    minPrice: 0,
    maxPrice: 1000,
    sort: '-createdAt'
  };

  languages: string[] = [];
  ages: string[] = [];
  genres: any[] = [];
  priceRange = { min: 0, max: 1000 };
  loading = false;

  constructor(private filterService: FilterService) {}

  ngOnInit(): void {
    this.loadFilterOptions();
  }

  loadFilterOptions(): void {
    this.loading = true;
    this.filterService.getFilterOptions().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.languages = response.data.languages;
          this.ages = response.data.ages;
          this.genres = response.data.genres;
          this.priceRange = response.data.priceRange;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading filters:', err);
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.filtersChanged.emit(this.filters);
  }

  resetFilters(): void {
    this.filters = {
      minPrice: this.priceRange.min,
      maxPrice: this.priceRange.max,
      sort: '-createdAt'
    };
    this.onFilterChange();
  }
}
