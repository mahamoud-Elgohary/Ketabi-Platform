import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { loadStripe } from '@stripe/stripe-js';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly base_url = `${API_ENDPOINTS.order}`;
  private readonly base_url_library = `${API_ENDPOINTS.profile}`;
  constructor(private http: HttpClient, private authService: AuthService) { }

  createOrder(payload: any): Observable<any> {
    return this.http.post(`${this.base_url}`, payload);
  }

  getLibrary(page: number = 1, limit: number = 10): Observable<any> {
    const token = this.authService.getAccessToken();

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.base_url_library}/library`, {
      headers
    });
  }

  getOrderHistory(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.base_url}/order-history`);
  }

  getOrderDetails(orderId: string): Observable<any> {
    console.log('info: ',`${this.base_url}/order/${orderId}`);
    return this.http.get(`${this.base_url}/order/${orderId}`);
  }

  // GET ALL ORDERS (Admin)
  getAllOrders(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.base_url}`, {
      params: {
        page: page.toString(),
        limit: limit.toString()
      }
    });
  }
}