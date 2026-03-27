// search-bar.component.ts
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  filter,
} from "rxjs/operators";
import { SearchService } from "../../../core/services/search.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-search-bar",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./search-bar.html",
  styleUrls: ["./search-bar.css"],
})
export class SearchBarComponent implements OnInit {
  searchControl = new FormControl("");
  suggestions: any[] = [];
  isLoading = false;
  showSuggestions = false;
  fallbackWarning = ""; // ✅ Show if using fallback

  constructor(private searchService: SearchService, private router: Router) {}

  ngOnInit(): void {
    // ✅ Setup autocomplete with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only if value changed
        filter(query => query !== null && query.trim().length >= 2), // Min 2 chars
        switchMap(query => {
          this.isLoading = true;
          return this.searchService.getAutocompleteSuggestions(query as string);
        })
      )
      .subscribe({
        next: (response) => {
          this.suggestions = response.data;
          this.fallbackWarning = response.warning || ""; // ✅ Show warning if fallback used
          this.showSuggestions = true;
          this.isLoading = false;
        },
        error: (error) => {
          console.error("Autocomplete error:", error);
          this.isLoading = false;
          this.suggestions = [];
          this.fallbackWarning = "";
        },
      });
  }

  onSearch(): void {
    const query = this.searchControl.value?.trim();
    if (query && query.length >= 2) {
      this.showSuggestions = false;
      this.router.navigate(["/search"], { queryParams: { q: query } });
    }
  }

  selectSuggestion(suggestion: any): void {
    this.searchControl.setValue(suggestion.name, { emitEvent: false });
    this.showSuggestions = false;
    this.onSearch();
  }

  onFocus(): void {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  clearSearch(): void {
    this.searchControl.setValue("");
    this.suggestions = [];
    this.showSuggestions = false;
    this.fallbackWarning = "";
  }
}
