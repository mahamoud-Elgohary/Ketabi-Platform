import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Review, ReviewResponse, CreateReviewRequest, UpdateReviewRequest } from '../models/review.model';

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private apiUrl = API_ENDPOINTS.reviews;


    constructor(
        private http: HttpClient) { }



    getReviewsByBook(bookId: string, page: number = 1, limit: number = 10, sort: 'top' | 'new' = 'new'): Observable<ReviewResponse> {
        const params: any = { page, limit, sort };
        return this.http.get<ReviewResponse>(`${this.apiUrl}/book/${bookId}`, { params });
    }

    createReview(data: CreateReviewRequest): Observable<ReviewResponse> {
        console.log('Creating review:', data);
        return this.http.post<ReviewResponse>(`${this.apiUrl}`, data);
    }

    updateReview(id: string, data: UpdateReviewRequest): Observable<ReviewResponse> {
        console.log('Updating review:', id, data);
        return this.http.patch<ReviewResponse>(`${this.apiUrl}/${id}`, data);
    }

    deleteReview(id: string): Observable<ReviewResponse> {
        console.log('Deleting review:', id);
        return this.http.delete<ReviewResponse>(`${this.apiUrl}/${id}`);
    }

    getReviewById(id: string): Observable<ReviewResponse> {
        return this.http.get<ReviewResponse>(`${this.apiUrl}/${id}`);
    }
}

