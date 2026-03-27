import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../../../core/services/wishlist.service';
import { WishlistItem } from '../../../core/models/wishlist.model';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css',
})
export class WishlistComponent implements OnInit, OnDestroy {
  searchTerm = '';
  sortBy = 'date';
  wishlistItems: WishlistItem[] = [];
  filteredItems: WishlistItem[] = [];

  loading = false;
  errorMessage = '';
  private destroy$ = new Subject<void>();

  defaultBookImage = 'default-book.jpg';

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Subscribe to loading state
    this.wishlistService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLoading) => (this.loading = isLoading));

    // Subscribe to wishlist changes (this will update automatically)
    this.wishlistService.wishlist$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => {
        console.log('Wishlist updated:', items);
        this.wishlistItems = items;
        this.filterItems();
      },
      error: (err) => {
        this.errorMessage = err.message;
      },
    });

    // Initial load
    this.loadWishlist();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Extract book object safely
  getBook(item: WishlistItem) {
    return item.book;
  }

  filterItems() {
    let items = [...this.wishlistItems];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();

      items = items.filter((item) => {
        const book = item.book;
        return book.name.toLowerCase().includes(term) || book.author.toLowerCase().includes(term);
      });
    }

    this.filteredItems = items;
    this.sortItems();
  }

  sortItems() {
    switch (this.sortBy) {
      case 'price-low':
        this.filteredItems.sort((a, b) => this.getFinalPrice(a.book) - this.getFinalPrice(b.book));
        break;

      case 'price-high':
        this.filteredItems.sort((a, b) => this.getFinalPrice(b.book) - this.getFinalPrice(a.book));
        break;

      case 'name':
        this.filteredItems.sort((a, b) => a.book.name.localeCompare(b.book.name));
        break;

      case 'date':
      default:
        this.filteredItems.sort(
          (a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );
    }
  }

  removeItem(bookId: string) {
    console.log('Removing item:', bookId);

    this.wishlistService.removeFromWishlist(bookId).subscribe({
      next: (updatedWishlist) => {
        console.log('Item removed successfully, updated wishlist:', updatedWishlist);
        this.toastService.show('Item removed from wishlist', 'success');
        // The wishlist$ observable will automatically update the UI
      },
      error: (err) => {
        console.error('Failed to remove item:', err);
        this.toastService.show('Failed to remove item', 'error');
      },
    });
  }

  addToCart(item: WishlistItem) {
    const book = item.book;

    if (book.status !== 'in stock') {
      this.toastService.show('This item is out of stock', 'error');
      return;
    }

    this.cartService.addItem(book, 1, 'physical');
    this.toastService.show(`${book.name} added to cart`, 'success');
    this.removeItem(book._id);
  }

  getBookImage(item: WishlistItem): string {
    return item.book.image?.url || this.defaultBookImage;
  }

  getFinalPrice(book: any): number {
    if (book.discount > 0) {
      return book.price - (book.price * book.discount) / 100;
    }
    return book.price;
  }

  formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString();
  }

  isBookInStock(item: WishlistItem): boolean {
    return item.book.status === 'in stock';
  }

  loadWishlist() {
    this.wishlistService.getWishlist().subscribe({
      error: (err) => {
        this.errorMessage = err.message;
      },
    });
  }

  isInWishList(bookId: string): boolean {
    return this.wishlistItems.some((item) => item.book._id === bookId);
  }

  clearSearch() {
    this.searchTerm = '';
    this.filterItems();
  }
}
