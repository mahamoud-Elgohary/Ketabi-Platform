import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BookService } from '../../../../core/services/book.service';
import { Book } from '../../../../core/models/book.model';
import { CartService } from '../../../../core/services/cart.service';
import { WishlistService } from '../../../../core/services/wishlist.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Subscription } from 'rxjs';
import { filter, distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Review } from '../../../../core/models/review.model';
import { ReviewService } from '../../../../core/services/review.service';
import { AuthService } from '../../../../core/services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-book-details',
  templateUrl: './book-details.html',
  styleUrls: ['./book-details.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class BookDetailsComponent implements OnInit, OnDestroy {
  book?: Book;
  isLoading = true;
  errorMessage = '';
  isInWishlist = false;
  Math = Math; // Expose Math to template
  readonly stars = [1, 2, 3, 4, 5];
  reviews: Review[] = [];
  reviewsLoading = false;
  reviewError = '';
  reviewPagination = { page: 1, limit: 5, total: 0, pages: 0 };
  reviewSort: 'new' | 'top' = 'new';
  reviewForm: FormGroup;
  isSubmittingReview = false;
  editingReviewId: string | null = null;
  isAuthenticated = false;
  currentUserId: string | null = null;
  pendingDeleteReviewId: string | null = null;
  private subscriptions: Subscription = new Subscription();
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private toast: ToastService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      title: ['', [Validators.maxLength(120)]],
      body: ['', [Validators.maxLength(5000)]],
    });
  }

  ngOnInit(): void {
    // Load initial book
    const initialId = this.route.snapshot.params['id'];
    if (initialId) {
      this.loadBook(initialId);
    }

    // Listen to route parameter changes - this should fire when route params change
    const paramsSub = this.route.params.pipe(
      map(params => params['id']),
      distinctUntilChanged()
    ).subscribe(id => {
      console.log('Route params changed, new book ID:', id);
      if (id) {
        this.loadBook(id);
      }
    });

    // Also listen to router navigation events as a fallback
    // This ensures we catch navigation even if params observable doesn't fire
    const routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.route.snapshot.params['id']),
      filter(id => !!id),
      distinctUntilChanged()
    ).subscribe(id => {
      console.log('Navigation end detected, book ID:', id);
      // Only load if it's different from current book
      if (!this.book || this.book._id !== id) {
        this.loadBook(id);
      }
    });

    this.subscriptions.add(paramsSub);
    this.subscriptions.add(routerSub);

    // Subscribe to wishlist changes
    this.wishlistService.wishlist$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.book) {
        this.isInWishlist = this.wishlistService.isInWishList(this.book._id);
      }
    });

    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.isAuthenticated = !!user;
      this.currentUserId = user?.id ?? null;
    });
  }

  addToCart(): void {
    if (!this.book) return;
    this.cartService.addItem(this.book, 1, 'physical');
    this.toast.show('Added to cart!', 'success');
  }

  toggleWishlist(): void {
    if (!this.book) return;
    this.wishlistService.toggleWishlist(this.book._id).subscribe({
      next: () => {
        const message = this.isInWishlist ? 'Added to wishlist!' : 'Removed from wishlist!';
        this.toast.show(message, 'success');
      },
      error: (error) => {
        this.toast.show(`Error: ${error.message}`, 'error');
      },
    });
  }

  private loadBook(id: string): void {
    if (!id) {
      this.errorMessage = 'Invalid book ID.';
      this.isLoading = false;
      return;
    }

    // Don't reload if we already have this book loaded
    if (this.book && this.book._id === id && !this.isLoading) {
      console.log('Book already loaded, skipping:', id);
      return;
    }

    console.log('Loading book with ID:', id);

    // Reset state
    this.book = undefined;
    this.errorMessage = '';
    this.isLoading = true;

    // Fetch book data
    this.bookService.getBookById(id).subscribe({
      next: (res) => {
        console.log('Book loaded successfully:', res.data?._id);
        this.book = res.data;
        this.isLoading = false;
        // Check wishlist status
        if (this.book) {
          this.isInWishlist = this.wishlistService.isInWishList(this.book._id);
          this.loadReviews(this.book._id);
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to load book details.';
        console.error('Failed to load book details:', err);
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEditingReview(): boolean {
    return !!this.editingReviewId;
  }

  private loadReviews(bookId: string, page: number = 1): void {
    if (!bookId) return;
    this.reviewsLoading = true;
    this.reviewError = '';
    const limit = this.reviewPagination.limit;
    this.reviewService.getReviewsByBook(bookId, page, limit, this.reviewSort)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.reviews = res.data.items || [];
          const pagination = res.data.pagination || { page, limit, total: this.reviews.length, pages: 1 };
          this.reviewPagination = {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            pages: pagination.pages,
          };
          this.reviewsLoading = false;
        },
        error: (err) => {
          console.error('Failed to load reviews', err);
          this.reviewError = err?.error?.message || 'Failed to load reviews. Please try again later.';
          this.reviews = [];
          this.reviewsLoading = false;
        }
      });
  }

  changeReviewSort(sort: 'new' | 'top'): void {
    if (this.reviewSort === sort || !this.book) return;
    this.reviewSort = sort;
    this.loadReviews(this.book._id, 1);
  }

  goToReviewPage(page: number): void {
    if (!this.book) return;
    if (page < 1 || page > this.reviewPagination.pages) return;
    this.loadReviews(this.book._id, page);
  }

  submitReview(): void {
    if (!this.book || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    if (!this.isAuthenticated) {
      this.toast.show('Please sign in to write a review.', 'info');
      return;
    }

    this.isSubmittingReview = true;
    const payload = {
      book: this.book._id,
      rating: this.reviewForm.value.rating,
      title: this.reviewForm.value.title?.trim() || '',
      body: this.reviewForm.value.body?.trim() || '',
    };

    const request$ = this.editingReviewId
      ? this.reviewService.updateReview(this.editingReviewId, {
        rating: payload.rating,
        title: payload.title,
        body: payload.body,
      })
      : this.reviewService.createReview(payload);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.show(this.editingReviewId ? 'Review updated!' : 'Review added!', 'success');
        this.resetReviewForm();
        this.refreshBookStats(this.book!._id);
        this.loadReviews(this.book!._id, 1);
      },
      error: (err) => {
        console.error('Failed to submit review', err);
        const message = err?.error?.message || 'Failed to submit review.';
        this.toast.show(message, 'error');
        this.isSubmittingReview = false;
      },
      complete: () => {
        this.isSubmittingReview = false;
      }
    });
  }

  startEditing(review: Review): void {
    this.editingReviewId = review._id;
    this.reviewForm.setValue({
      rating: review.rating,
      title: review.title || '',
      body: review.body || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEditing(): void {
    this.resetReviewForm();
  }

  deleteReview(review: Review): void {
    if (!this.book) return;
    this.reviewService.deleteReview(review._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toast.show('Review deleted', 'success');
        this.refreshBookStats(this.book!._id);
        this.loadReviews(this.book!._id, 1);
        this.pendingDeleteReviewId = null;
      },
      error: (err) => {
        console.error('Failed to delete review', err);
        const message = err?.error?.message || 'Failed to delete review.';
        this.toast.show(message, 'error');
        this.pendingDeleteReviewId = null;
      }
    });
  }

  promptDelete(review: Review): void {
    this.pendingDeleteReviewId = review._id;
  }

  confirmDelete(): void {
    if (!this.pendingDeleteReviewId || !this.book) return;
    const review = this.reviews.find(r => r._id === this.pendingDeleteReviewId);
    if (!review) {
      this.pendingDeleteReviewId = null;
      return;
    }
    this.deleteReview(review);
  }

  cancelDelete(): void {
    this.pendingDeleteReviewId = null;
  }

  canManageReview(review: Review): boolean {
    return !!this.currentUserId && review.user?._id === this.currentUserId;
  }

  trackByReview(_: number, review: Review): string {
    return review._id;
  }

  private refreshBookStats(bookId: string): void {
    this.bookService.getBookById(bookId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (this.book) {
          this.book = { ...this.book, ...res.data };
        } else {
          this.book = res.data;
        }
      },
      error: (err) => {
        console.error('Failed to refresh book stats', err);
      },
    });
  }

  private resetReviewForm(): void {
    this.reviewForm.reset({ rating: 5, title: '', body: '' });
    this.editingReviewId = null;
    this.isSubmittingReview = false;
  }
}
