import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Book, BookResponse, SingleBookResponse } from '../models/book.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private apiUrl = API_ENDPOINTS.books;

  constructor(private http: HttpClient, private authService: AuthService) {}

  getBooksByCategory(category: string): Observable<SingleBookResponse> {
    return this.http.get<SingleBookResponse>(`${this.apiUrl}/${category}`);
  }

  getAllBooks(options?: {
    language?: string;
    age?: string;
    genre?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    limit?: number;
    skip?: number;
  }): Observable<BookResponse> {
    let params = new HttpParams();

    // Set a high limit to get all books (or adjust based on your needs)
    const limit = options?.limit || 1000; // Get up to 1000 books
    const skip = options?.skip || 0;

    params = params.set('limit', limit.toString());
    params = params.set('skip', skip.toString());

    if (options?.language) params = params.set('language', options.language);
    if (options?.age) params = params.set('age', options.age);
    if (options?.genre) params = params.set('genre', options.genre);
    if (options?.minPrice !== undefined)
      params = params.set('minPrice', options.minPrice.toString());
    if (options?.maxPrice !== undefined)
      params = params.set('maxPrice', options.maxPrice.toString());
    if (options?.sort) params = params.set('sort', options.sort);

    return this.http.get<BookResponse>(`${this.apiUrl}/List-Books`, { params });
  }

  getBookById(id: string): Observable<SingleBookResponse> {
    return this.http.get<SingleBookResponse>(`${this.apiUrl}/Get-Book/${id}`);
  }

  downloadBook(bookId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/Download-Book/${bookId}`);
  }
  updateBook(id: string, bookData: Partial<Book>): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/Update-Book/${id}`, bookData);
  }

  deleteBook(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/Delete/${id}`);
  }

  createBook(bookData: Partial<Book>): Observable<Book> {
    return this.http.post<Book>(`${this.apiUrl}/Create-Book`, bookData);
  }
}
