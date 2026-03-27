import { Book } from './book.model';

export interface WishlistItem {
  addedDate: string;
  book: Book;
}

// Update to match API response
export interface WishlistResponse {
  status: string; // Changed from 'success: boolean'
  message: string;
  code: number;
  data: WishlistItem[];
}

export interface AddToWishlistRequest {
  bookId: string;
}

// Update to match API response
export interface AddToWishlistResponse {
  status: string; // Changed from 'success: boolean'
  message: string;
  code: number;
  data: WishlistItem[]; // API returns array, not single item
}

// Update to match API response
export interface RemoveFromWishlistResponse {
  status: string; // Changed from 'success: boolean'
  message: string;
  code: number;
  data: WishlistItem[]; // API returns updated wishlist array
}
