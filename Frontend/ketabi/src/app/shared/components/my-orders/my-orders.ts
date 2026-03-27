import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';

interface Order {
  _id: string;
  orderNumber: string;
  items: any[];
  totalPrice: number;
  finalPrice: number;
  paymentStatus: string;
  orderStatus: string;
  shippingAddress: any;
  createdAt: string;
  coupon:string;
  discountApplied:number;
}

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-orders.html',
  styleUrls: ['./my-orders.css']
})
export class MyOrdersComponent implements OnInit, OnDestroy {
  orders: Order[] = [];
  isLoading = false;
  error: string | null = null;
  currentPage = 1;
  limit = 5;
  totalOrders = 0;
  totalPages = 1;

  private destroy$ = new Subject<void>();

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Check authentication first
    const isAuthenticated = this.authService.isAuthenticated();
    const currentUser = this.authService.getCurrentUser();

    if (!isAuthenticated) {
      this.error = '❌ Please login to view your orders';
      return;
    }

    this.loadOrders();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOrders() {
    this.isLoading = true;
    this.error = null;

    this.orderService.getOrderHistory(this.currentPage, this.limit)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.orders = response.data?.orders || [];
          this.totalOrders = response.data?.pagination?.total || 0;
          this.totalPages = response.data?.pagination?.pages || 1;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading orders:', error);

          // Handle different error types
          if (error.status === 401) {
            this.error = '❌ Authentication failed - Please login again';
            localStorage.removeItem('token');
            this.authService.clearAuthData();
          } else if (error.status === 403) {
            this.error = '❌ You do not have permission to view these orders';
          } else if (error.status === 404) {
            this.error = 'No orders found';
          } else {
            this.error = error.error?.message || '❌ Failed to load your orders';
          }

          this.isLoading = false;
        }
      });
  }
  getDeliveryStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'shipped':
        return 'badge-info';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'completed': 'badge-success',
      'pending': 'badge-warning',
      'failed': 'badge-danger',
      'cancelled': 'badge-danger',
      'processing': 'badge-info',
      'confirmed': 'badge-info'
    };
    return statusMap[status?.toLowerCase()] || 'badge-secondary';
  }

  downloadBook(book: any) {
    if (book.pdf?.url) {
      const link = document.createElement('a');
      link.href = book.pdf.url;
      link.download = book.pdf.fileName || 'book.pdf';
      link.click();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadOrders();
      window.scrollTo(0, 0);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadOrders();
      window.scrollTo(0, 0);
    }
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get hasPrevPage(): boolean {
    return this.currentPage > 1;
  }
}