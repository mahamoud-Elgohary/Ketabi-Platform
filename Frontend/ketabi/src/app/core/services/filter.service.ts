import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from "../constants/api-endpoints";
import { BooksParams, BooksResult, FilterOptions } from '../../core/models/filter.model';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  constructor(private http: HttpClient) {}

  getBooks(params: BooksParams): Observable<BooksResult> {
    let httpParams = new HttpParams()
      .set('limit', params.limit?.toString() || '12')
      .set('skip', params.skip?.toString() || '0')
      .set('sort', params.sort || '-createdAt');

    if (params.language) httpParams = httpParams.set('language', params.language);
    if (params.age) httpParams = httpParams.set('age', params.age);
    if (params.genre) httpParams = httpParams.set('genre', params.genre);
    if (params.minPrice) httpParams = httpParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());

    return this.http.get<BooksResult>(API_ENDPOINTS.books, { params: httpParams });
  }

  getFilterOptions(): Observable<FilterOptions> {
    return this.http.get<FilterOptions>(`${API_ENDPOINTS.books}/filters`);
  }
}
