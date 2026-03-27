import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BookService } from '../../../../../core/services/book.service';
import { ChatComponent } from '../../../../../shared/components/chat/chat.component';
import { Book } from '../../../../../core/models/book.model';

interface ExtendedBook extends Book {
  selected?: boolean;
  genreName?: string;
  rating?: number;
  stock?: number;
}

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface Genre {
  _id: string;
  name: string;
}

@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChatComponent],
  templateUrl: './books.component.html',
  styleUrl: './books.component.css',
})
export class BooksComponent implements OnInit, OnDestroy {
  // Sidebar and Navigation
  sidebarCollapsed = false;
  isUserLoggedIn = true;
  role = 'admin';
  notificationCount = 3;

  menuItems: MenuItem[] = [
    { icon: 'fa-th-large', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'fa-book', label: 'Books', route: '/admin/books' },
    { icon: 'fa-users', label: 'Users', route: '/admin/users' },
    { icon: 'fa-comments', label: 'Responses', route: '/admin/responses' },
  ];

  // Stats
  totalBooks = 0;
  publishedBooks = 0;
  totalGenres = 0;
  totalRevenue = 0;

  // Data
  books: ExtendedBook[] = [];
  filteredBooks: ExtendedBook[] = [];
  genres: Genre[] = [];

  // Filters
  searchTerm = '';
  selectedGenre = '';
  selectedStatus = '';
  selectedPriceRange = '';
  selectedLanguage = '';
  selectedAge = '';

  // View Mode
  viewMode: 'grid' | 'list' = 'grid';

  // Pagination
  currentPage = 1;
  pageSize = 12;
  totalPages = 1;
  Math = Math;

  // Selection
  selectAll = false;

  // UI State
  loading = true;
  errorMessage = '';
  showBookModal = false;
  modalMode: 'view' | 'edit' | 'add' = 'view';
  selectedBook: any = {};

  private destroy$ = new Subject<void>();

  constructor(private router: Router, private bookService: BookService) {}

  ngOnInit() {
    this.loadBooks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    console.log('Logging out...');
    this.router.navigate(['/login']);
  }

  loadBooks() {
    this.loading = true;
    this.errorMessage = '';

    this.bookService
      .getAllBooks({ limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📥 Books API Response:', response);

          if (response.status && response.data.books) {
            this.books = response.data.books.map((book) => ({
              ...book,
              name: book.name || 'Untitled',
              author: book.author || 'Unknown Author',
              price: book.price,
              stock: book.stock || 0,
              genreName: book.genre?.name || 'Uncategorized',
              status: this.normalizeStatus(book.status),
              image: { url: book.image?.url || '' },
              description: book.description || '',
              selected: false,
            }));

            console.log('✅ Processed books:', this.books.length);

            // Extract unique genres
            const genreMap = new Map<string, Genre>();
            this.books.forEach((book) => {
              if (book.genre && book.genre._id && book.genre.name) {
                genreMap.set(book.genre._id, {
                  _id: book.genre._id,
                  name: book.genre.name,
                });
              }
            });
            this.genres = Array.from(genreMap.values());

            this.filteredBooks = [...this.books];
            this.updateStats();
            this.updatePagination();
          } else {
            this.errorMessage = response.message || 'Failed to load books';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading books:', error);
          this.errorMessage = error.error?.message || 'Failed to load books. Please try again.';
          this.loading = false;
        },
      });
  }

  private normalizeStatus(status: any): 'published' | 'draft' | 'archived' {
    const statusStr = typeof status === 'string' ? status.toLowerCase() : '';
    if (statusStr.includes('stock') || statusStr === 'published') {
      return 'published';
    } else if (statusStr === 'draft') {
      return 'draft';
    } else if (statusStr === 'archived') {
      return 'archived';
    }
    return 'published';
  }

  updateStats() {
    this.totalBooks = this.books.length;
    this.publishedBooks = this.books.filter((b) => b.status === 'published').length;
    this.totalGenres = this.genres.length;
    this.totalRevenue = this.books.reduce((sum, book) => sum + (book.price || 0), 0);
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredBooks = this.books.filter((book) => {
      const matchesSearch =
        !this.searchTerm ||
        (book.name && book.name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (book.author && book.author.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesGenre = !this.selectedGenre || book.genre?._id === this.selectedGenre;
      const matchesStatus = !this.selectedStatus || book.status === this.selectedStatus;
      const matchesLanguage = !this.selectedLanguage || book.bookLanguage === this.selectedLanguage;
      const matchesAge = !this.selectedAge || book.recommendedAge === this.selectedAge;

      let matchesPriceRange = true;
      if (this.selectedPriceRange) {
        const price = book.price || 0;
        if (this.selectedPriceRange === '0-100') {
          matchesPriceRange = price >= 0 && price <= 100;
        } else if (this.selectedPriceRange === '100-250') {
          matchesPriceRange = price > 100 && price <= 250;
        } else if (this.selectedPriceRange === '250-500') {
          matchesPriceRange = price > 250 && price <= 500;
        } else if (this.selectedPriceRange === '500+') {
          matchesPriceRange = price > 500;
        }
      }

      return (
        matchesSearch &&
        matchesGenre &&
        matchesStatus &&
        matchesPriceRange &&
        matchesLanguage &&
        matchesAge
      );
    });

    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedGenre = '';
    this.selectedStatus = '';
    this.selectedPriceRange = '';
    this.selectedLanguage = '';
    this.selectedAge = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  sortBy(field: string) {
    const isAscending =
      this.filteredBooks[0] &&
      this.filteredBooks[1] &&
      this.getFieldValue(this.filteredBooks[0], field) <=
        this.getFieldValue(this.filteredBooks[1], field);

    this.filteredBooks.sort((a, b) => {
      const aValue = this.getFieldValue(a, field);
      const bValue = this.getFieldValue(b, field);

      if (aValue < bValue) return isAscending ? 1 : -1;
      if (aValue > bValue) return isAscending ? -1 : 1;
      return 0;
    });
  }

  private getFieldValue(book: ExtendedBook, field: string): any {
    switch (field) {
      case 'title':
        return (book.name || '').toLowerCase();
      case 'author':
        return (book.author || '').toLowerCase();
      case 'price':
        return book.price || 0;
      case 'rating':
        return book.avgRating || 0;
      default:
        return '';
    }
  }

  get paginatedBooks(): ExtendedBook[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredBooks.slice(startIndex, endIndex);
  }

  toggleSelectAll() {
    this.paginatedBooks.forEach((book) => {
      book.selected = this.selectAll;
    });
  }

  onBookSelect() {
    this.selectAll = this.paginatedBooks.every((book) => book.selected);
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredBooks.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    } else if (this.totalPages === 0) {
      this.currentPage = 1;
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.selectAll = false;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      let start = Math.max(2, this.currentPage - 1);
      let end = Math.min(this.totalPages - 1, this.currentPage + 1);

      if (this.currentPage <= 3) {
        end = 4;
      } else if (this.currentPage >= this.totalPages - 2) {
        start = this.totalPages - 3;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      pages.push(this.totalPages);
    }

    return pages;
  }

  getPaginationInfo() {
    const start = Math.min((this.currentPage - 1) * this.pageSize + 1, this.filteredBooks.length);
    const end = Math.min(this.currentPage * this.pageSize, this.filteredBooks.length);
    return { start, end, total: this.filteredBooks.length };
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  viewBook(book: ExtendedBook) {
    this.selectedBook = { ...book };
    this.modalMode = 'view';
    this.showBookModal = true;
  }

  editBook(book: ExtendedBook) {
    this.selectedBook = { ...book, genre: book.genre?._id };
    this.modalMode = 'edit';
    this.showBookModal = true;
  }

  deleteBook(book: ExtendedBook) {
    if (confirm(`Are you sure you want to delete "${book.name}"?`)) {
      this.bookService
        .deleteBook(book._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.message) {
              this.loadBooks();
              console.log('✅ Book deleted successfully');
            } else {
              alert(response.message || 'Failed to delete book');
            }
          },
          error: (error) => {
            console.error('❌ Error deleting book:', error);
            alert(error.error?.message || 'Failed to delete book');
          },
        });
    }
  }

  openAddBookModal() {
    this.selectedBook = {
      name: '',
      author: '',
      price: 0,
      stock: 0,
      genre: '',
      status: 'draft',
      description: '',
      publisher: '',
      Edition: '1st',
      noOfPages: 0,
      bookLanguage: 'english',
      recommendedAge: 'all',
      discount: 0,
      cost: 0,
    };
    this.modalMode = 'add';
    this.showBookModal = true;
  }

  closeModal() {
    this.showBookModal = false;
    this.selectedBook = {};
  }

  saveBook() {
    if (this.modalMode === 'add') {
      if (!this.selectedBook.name || !this.selectedBook.author || !this.selectedBook.price) {
        alert('Please fill in all required fields');
        return;
      }

      this.bookService
        .createBook(this.selectedBook)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.loadBooks();
              this.closeModal();
              console.log('✅ Book added successfully');
            } else {
              alert(response.status || 'Failed to create book');
            }
          },
          error: (error) => {
            console.error('❌ Error creating book:', error);
            alert(error.error?.message || 'Failed to create book');
          },
        });
    } else if (this.modalMode === 'edit') {
      this.bookService
        .updateBook(this.selectedBook._id, this.selectedBook)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.loadBooks();
              this.closeModal();
              console.log('✅ Book updated successfully');
            } else {
              alert(response.status || 'Failed to update book');
            }
          },
          error: (error) => {
            console.error('❌ Error updating book:', error);
            alert(error.error?.message || 'Failed to update book');
          },
        });
    }
  }

  exportBooks() {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `books_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateCSV(): string {
    const headers = ['ID', 'Name', 'Author', 'Genre', 'Price', 'Stock', 'Language', 'Status'];
    const rows = this.filteredBooks.map((book) => [
      book._id,
      book.name,
      book.author,
      book.genreName,
      book.price,
      book.stock,
      book.bookLanguage,
      book.status,
    ]);

    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ];

    return csvRows.join('\n');
  }
}
