// admin-dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BookStats {
  totalBooks: number;
  booksByGenre: Array<{ _id: string; count: number }>;
}

export interface OrderStats {
  totalOrders: number;
}
export interface LowStockBook {
  _id: string;
  name: string;
  author: string;
  stock: number;
  price: number;
  image?: {
    url: string;
  };
}

export interface UserStats {
  totalUsers: number;
}

export interface RevenueStats {
  success: boolean;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
}

export interface RecentOrder {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  totalPrice: number;
  orderStatus: string;
  createdAt: string;
}

export interface DashboardData {
  totalBooks: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  averageOrderValue: number;
  recentOrders: RecentOrder[];
}

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private apiUrl = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  getBooksStats(): Observable<BookStats> {
    return this.http.get<BookStats>(`${this.apiUrl}/books/stats`);
  }

  getOrdersStats(): Observable<OrderStats> {
    return this.http.get<OrderStats>(`${this.apiUrl}/orders/stats`);
  }

  getUsersStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/users/stats`);
  }

  getRevenueStats(): Observable<RevenueStats> {
    return this.http.get<RevenueStats>(`${this.apiUrl}/revenue/stats`);
  }

  getRecentOrders(): Observable<{ success: boolean; recentOrders: RecentOrder[] }> {
    return this.http.get<{ success: boolean; recentOrders: RecentOrder[] }>(
      `${this.apiUrl}/orders/recent`
    );
  }

  getAllDashboardData(): Observable<DashboardData> {
    return forkJoin({
      books: this.getBooksStats(),
      orders: this.getOrdersStats(),
      users: this.getUsersStats(),
      revenue: this.getRevenueStats(),
      recentOrders: this.getRecentOrders(),
    }).pipe(
      map((result) => ({
        totalBooks: result.books.totalBooks,
        totalOrders: result.orders.totalOrders,
        totalRevenue: result.revenue.totalRevenue,
        totalUsers: result.users.totalUsers,
        averageOrderValue: result.revenue.averageOrderValue,
        recentOrders: result.recentOrders.recentOrders,
      }))
    );
  }
  // Add to admin-dashboard.service.ts
  getLowStockBooks(
    limit: number = 10,
    threshold: number = 10
  ): Observable<{ success: boolean; lowStockBooks: LowStockBook[] }> {
    return this.http.get<{ success: boolean; lowStockBooks: LowStockBook[] }>(
      `${this.apiUrl}/books/low-stock`,
      { params: { limit: limit.toString(), threshold: threshold.toString() } }
    );
  }
}
