import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../../core/services/auth.service';
import { PublisherService } from '../../../../../core/services/publisher.service';
import { PublisherBooksResponse } from '../../../../../features/publishers/models/book.model';
import {
  PublisherOrdersResponse,
  DeliveryStatus,
  PaymentStatus,
} from '../../../../../features/publishers/models/order.model';

interface DashboardStats {
  totalBooks: number;
  totalOrders: number;
  ordersByDeliveryStatus: Record<string, number>;
  ordersByPaymentStatus: Record<string, number>;
}

@Component({
  selector: 'app-publisher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class PublisherDashboardComponent implements OnInit {
  @Input() publisherId?: string;

  loading = false;
  error: string | null = null;

  stats: DashboardStats = {
    totalBooks: 0,
    totalOrders: 0,
    ordersByDeliveryStatus: {},
    ordersByPaymentStatus: {},
  };

  deliveryStatusKeys: string[] = [];
  paymentStatusKeys: string[] = [];

  constructor(private publisherService: PublisherService, private authService: AuthService) { }

  ngOnInit(): void {
    const id = this.publisherId || this.getCurrentUserId();

    if (!id) {
      this.error = 'Publisher ID is required';
      return;
    }

    this.loadDashboardData(id);
  }

  private getCurrentUserId(): string | null {
    return this.authService.getCurrentUser()?.id || null;
  }

  private loadDashboardData(publisherId: string): void {
    this.loading = true;
    this.error = null;

    this.publisherService.getPublishedBooks(publisherId, 1, 5).subscribe({
      next: (booksResponse: PublisherBooksResponse) => {
        this.stats.totalBooks = booksResponse.data.totalBooks || 0;

        this.publisherService.getPublisherOrders(publisherId, 1, 100).subscribe({
          next: (ordersResponse: PublisherOrdersResponse) => {
            this.stats.totalOrders = ordersResponse.data.total || 0;
            this.calculateOrderStats(ordersResponse.data.orders || []);
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading orders:', err);
            this.error = err.error?.message || 'Failed to load dashboard data.';
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error('Error loading books:', err);
        this.error = err.error?.message || 'Failed to load dashboard data.';
        this.loading = false;
      },
    });
  }

  private calculateOrderStats(orders: PublisherOrdersResponse['data']['orders'] = []): void {
    const deliveryCounts: Record<string, number> = {};
    const paymentCounts: Record<string, number> = {};

    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const deliveryStatus = item.deliveryStatus || DeliveryStatus.PENDING;
        deliveryCounts[deliveryStatus] = (deliveryCounts[deliveryStatus] || 0) + 1;

        const paymentStatus = item.paymentStatus || PaymentStatus.PENDING;
        paymentCounts[paymentStatus] = (paymentCounts[paymentStatus] || 0) + 1;
      });
    });

    this.stats.ordersByDeliveryStatus = deliveryCounts;
    this.stats.ordersByPaymentStatus = paymentCounts;
    this.deliveryStatusKeys = Object.keys(deliveryCounts);
    this.paymentStatusKeys = Object.keys(paymentCounts);
  }

  getStatusPercentage(status: string, total: number): number {
    if (total === 0) {
      return 0;
    }

    const count =
      this.stats.ordersByDeliveryStatus[status] || this.stats.ordersByPaymentStatus[status] || 0;

    return Math.round((count / total) * 100);
  }

  getStatusCount(status: string): number {
    return this.stats.ordersByDeliveryStatus[status] || this.stats.ordersByPaymentStatus[status] || 0;
  }

  getTotalItemsCount(): number {
    return Object.values(this.stats.ordersByDeliveryStatus).reduce((sum, count) => sum + count, 0);
  }
}
