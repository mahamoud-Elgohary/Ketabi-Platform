import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { Book } from '../../../core/models/book.model';
import { ToastService } from '../../../core/services/toast.service';
import { RouterModule } from '@angular/router';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './book-card.html',
  styleUrls: ['./book-card.css'],
})
export class BookCard implements OnInit, OnDestroy {
  @Input() id: string = '';
  @Input() image: string = '';
  @Input() title: string = '';
  @Input() author: string = '';
  @Input() price?: number;
  @Input() rating?: number;
  @Input() book!: Book;

  isInWishlist: boolean = false;
  Math = Math; // Expose Math to template
  private destroy$ = new Subject<void>();

  constructor(
    private cartService: CartService,
    private toast: ToastService,
    private wishlistService: WishlistService
  ) {}

  ngOnInit() {
    this.wishlistService.wishlist$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isInWishlist = this.wishlistService.isInWishList(this.book._id);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addToCart(event: Event) {
    console.log('book: ', this.book)
    this.cartService.addItem(this.book, 1, 'physical');
    this.toast.show('Added to cart!', 'success');
  }

  addToWishlist(event: Event) {
    event.preventDefault();
    this.wishlistService.toggleWishlist(this.book._id).subscribe({
      next: () => {
        const message = !this.isInWishlist ? 'Removed from wishlist!' : 'Added to wishlist!';
        this.toast.show(message, 'success');
      },
      error: (error) => {
        this.toast.show(`Error: ${error.message}`, 'error');
      },
    });
  }
}
