import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { BookService } from '../../../core/services/book.service';  // ✅ أضف
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface PurchasedBook {
  _id: string;
  name: string;
  author: string;
  price: number;
  discount: number;
  avgRating: number;
  ratingsCount: number;
  pdf?: {
    url: string;
    fileName: string;
  };
  image?: {
    url: string;
  };
}

@Component({
  selector: 'app-my-library',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-library.html',
  styleUrls: ['./my-library.css']
})

export class MyLibrary implements OnInit, OnDestroy {
  purchasedBooks: PurchasedBook[] = [];
  isLoading = false;
  isDownloading: { [key: string]: boolean } = {};
  error: string | null = null;
  currentPage = 1;
  limit = 12;
  totalBooks = 0;
  totalPages = 1;

  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private bookService: BookService,  
    private authService: AuthService,
    private router: Router,
    private toastService?: ToastService
  ) { }

  ngOnInit() {
    console.log('MyLibrary Component initialized');

    const isAuthenticated = this.authService.isAuthenticated();
    console.log('Is Authenticated:', isAuthenticated);

    if (!isAuthenticated) {
      this.error = '❌ Please login to view your library';
      return;
    }

    this.loadPurchasedBooks();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPurchasedBooks() {
    this.isLoading = true;
    this.error = null;

    console.log('Loading purchased books...');

    this.orderService.getLibrary(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Orders loaded:', response);
          this.ebooksLibrary(response.data || []);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading library:', error);

          if (error.status === 401) {
            this.error = 'Authentication failed - Please login again';
            localStorage.removeItem('token');
            this.authService.clearAuthData();
          } else {
            this.error = error.error?.message || 'Failed to load your library';
          }

          this.isLoading = false;
        }
      });
  }

  private ebooksLibrary(books: any[]) {
    this.purchasedBooks = books;
    this.totalBooks = this.purchasedBooks.length;
    this.totalPages = Math.ceil(this.totalBooks / this.limit);

    console.log(`📊 Found ${this.purchasedBooks.length} books`);
  }

  downloadBook(book: PurchasedBook) {
    if (this.isDownloading[book._id]) return;
    this.isDownloading[book._id] = true;

    this.bookService.downloadBook(book._id)
      .subscribe({
        next: (response: any) => {

          const fileName = response.data?.fileName || `${book.name}.pdf`;

          // If server returns a direct URL
          if (response.data?.url) {
            const link = document.createElement('a');
            link.href = response.data.url;
            link.download = fileName;
            link.target = "_blank"; // new tab
            link.rel = "noopener";  // security best practice

            document.body.appendChild(link); // needed for Firefox
            link.click();
            document.body.removeChild(link);
          }

          // If server returns a Blob
          else {
            const blobUrl = window.URL.createObjectURL(response);
            const link = document.createElement('a');

            link.href = blobUrl;
            link.download = fileName;

            document.body.appendChild(link); // needed for Firefox + Safari
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);

            console.log('Downloaded successfully');
          }

          this.isDownloading[book._id] = false;

          if (this.toastService) {
            this.toastService.show('✅ PDF downloaded!', 'success');
          }
        },

        error: (error) => {
          console.error('Download error:', error);
          this.isDownloading[book._id] = false;
        }
      });
  }

  viewBookDetails(bookId: string) {
    console.log('👀 Viewing book details:', bookId);
    this.router.navigate(['/books', bookId]);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      window.scrollTo(0, 0);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      window.scrollTo(0, 0);
    }
  }

  get paginatedBooks(): PurchasedBook[] {
    const startIndex = (this.currentPage - 1) * this.limit;
    return this.purchasedBooks.slice(startIndex, startIndex + this.limit);
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get hasPrevPage(): boolean {
    return this.currentPage > 1;
  }
}