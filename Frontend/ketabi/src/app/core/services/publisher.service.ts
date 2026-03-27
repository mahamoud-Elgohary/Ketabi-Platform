import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { PublisherBook, PublisherBooksResponse, UpdateBookRequest } from '../../features/publishers/models/book.model';
import { PublisherOrdersResponse, UpdatePublisherOrderRequest, UpdatePublisherOrderResponse } from '../../features/publishers/models/order.model';
import { Genre } from '../../features/publishers/models/genre.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class PublisherService {
    private publishersUrl = API_ENDPOINTS.publishers;
    private booksUrl = API_ENDPOINTS.books;
    private genresUrl = API_ENDPOINTS.genres;

    constructor(private http: HttpClient, private authService: AuthService) { }

    private getAuthHeaders(isJson: boolean = true): HttpHeaders {
        const token = this.authService.getAccessToken();
        let headers = new HttpHeaders();

        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
            if (isJson) {
                headers = headers.set('Content-Type', 'application/json');
            }
        }

        return headers;
    }

    getPublishedBooks(publisherId: string, page: number = 1, limit: number = 10): Observable<PublisherBooksResponse> {
        const params = {
            page: Math.max(1, page || 1),
            limit: Math.max(5, limit || 10),
        };
        return this.http.get<PublisherBooksResponse>(`${this.publishersUrl}/${publisherId}/books`, { params });
    }

    getPublisherBook(bookId: string): Observable<PublisherBook> {
        const headers = this.getAuthHeaders();
        return this.http.get<any>(`${this.booksUrl}/Get-Book/${bookId}`, { headers }).pipe(
            map((response) => response?.data?.book ?? response?.data ?? response)
        );
    }

    getGenres(): Observable<Genre[]> {
        return this.http.get<any>(this.genresUrl).pipe(
            map((response) => Array.isArray(response) ? response : response?.data ?? [])
        );
    }

    addBook(formData: FormData): Observable<any> {
        const headers = this.getAuthHeaders(false);
        return this.http.post(`${this.booksUrl}/Create-Book`, formData, { headers });
    }

    updateBook(bookId: string, data: UpdateBookRequest | FormData): Observable<any> {
        if (data instanceof FormData) {
            const headers = this.getAuthHeaders(false);
            return this.http.put(`${this.booksUrl}/Update-Book/${bookId}`, data, { headers });
        }
        const headers = this.getAuthHeaders();
        return this.http.put(`${this.booksUrl}/Update-Book/${bookId}`, data, { headers });
    }

    deleteBook(bookId: string): Observable<any> {
        const headers = this.getAuthHeaders();
        return this.http.delete(`${this.booksUrl}/Delete/${bookId}`, { headers });
    }

    getPublisherOrders(publisherId: string, page: number = 1, limit: number = 10): Observable<PublisherOrdersResponse> {
        const params = {
            page: Math.max(1, page || 1),
            limit: Math.max(5, limit || 10),
        };
        const headers = this.getAuthHeaders();
        return this.http.get<PublisherOrdersResponse>(`${this.publishersUrl}/${publisherId}/orders`, { params, headers });
    }

    updatePublisherOrder(publisherOrderId: string, data: UpdatePublisherOrderRequest): Observable<UpdatePublisherOrderResponse> {
        const headers = this.getAuthHeaders();
        return this.http.patch<UpdatePublisherOrderResponse>(`${this.publishersUrl}/${publisherOrderId}`, data, { headers });
    }
}

