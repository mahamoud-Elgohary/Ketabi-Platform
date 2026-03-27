import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AddToWishlistRequest,
  AddToWishlistResponse,
  RemoveFromWishlistResponse,
  WishlistItem,
  WishlistResponse,
} from '../models/wishlist.model';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private apiUrl = environment.apiBaseUrl;

  private wishlistSubject = new BehaviorSubject<WishlistItem[]>([]);
  public wishlist$ = this.wishlistSubject.asObservable();

  private wishlistCountSubject = new BehaviorSubject<number>(0);
  public wishlistCount$ = this.wishlistCountSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  getWishlist(): Observable<WishlistItem[]> {
    this.loadingSubject.next(true);

    return this.http
      .get<WishlistResponse>(`${this.apiUrl}/users/wishlist`, { headers: this.getHeaders() })
      .pipe(
        map((response) => {
          console.log('Raw API response:', response);
          console.log('Response data:', response.data);

          // Normalize the data structure
          const normalizedData = response.data.map((item: any) => {
            // Handle case where the structure might be nested incorrectly
            let book = item.book;
            let addedDate = item.addedDate;

            // If addedDate is an array or object, try to extract the actual date
            if (Array.isArray(addedDate) && addedDate.length > 0) {
              addedDate = addedDate[0];
            }

            // Ensure we have a valid date string
            if (!addedDate || typeof addedDate !== 'string') {
              addedDate = new Date().toISOString();
            }

            return {
              book: book,
              addedDate: addedDate,
            };
          });

          console.log('Normalized data:', normalizedData);
          return normalizedData;
        }),
        tap((wishlist) => {
          this.wishlistSubject.next(wishlist);
          this.wishlistCountSubject.next(wishlist.length);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  addToWishlist(bookId: string): Observable<WishlistItem[]> {
    this.loadingSubject.next(true);

    const body: AddToWishlistRequest = { bookId };

    return this.http
      .post<AddToWishlistResponse>(`${this.apiUrl}/users/wishlist`, body, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data), // API returns full wishlist array
        tap((updatedWishlist) => {
          // Update with the full wishlist returned from API
          this.wishlistSubject.next(updatedWishlist);
          this.wishlistCountSubject.next(updatedWishlist.length);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  removeFromWishlist(bookId: string): Observable<WishlistItem[]> {
    this.loadingSubject.next(true);

    return this.http
      .delete<RemoveFromWishlistResponse>(`${this.apiUrl}/users/wishlist/${bookId}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data), // API returns updated wishlist array
        tap((updatedWishlist) => {
          // Update with the full wishlist returned from API
          this.wishlistSubject.next(updatedWishlist);
          this.wishlistCountSubject.next(updatedWishlist.length);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          return this.handleError(error);
        })
      );
  }

  isInWishlist(bookId: string): Observable<boolean> {
    return this.wishlist$.pipe(
      map((wishlist) => wishlist.some((item) => item.book._id === bookId))
    );
  }

  getWishlistCount(): number {
    return this.wishlistCountSubject.value;
  }

  getCurrentWishlist(): WishlistItem[] {
    return this.wishlistSubject.value;
  }

  clearWishlist(): void {
    this.wishlistSubject.next([]);
    this.wishlistCountSubject.next(0);
  }

  toggleWishlist(bookId: string): Observable<WishlistItem[]> {
    const isInList = this.getCurrentWishlist().some((item) => item.book._id === bookId);

    if (isInList) {
      return this.removeFromWishlist(bookId);
    } else {
      return this.addToWishlist(bookId);
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage =
        error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('Wishlist Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
  isInWishList(bookId: string): boolean {
    return this.getCurrentWishlist().some((item) => item.book._id === bookId);
  }
}
