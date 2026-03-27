import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { CartService } from '../../core/services/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {
  loading = true;
  orderId = '';
  order: any = null;

  hasPhysical = false;
  hasEbooks = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private toastService: ToastService,
    private cartService: CartService
  ) { }

  ngOnInit() {
    // 1Read "/order/:orderId"
    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';
    if (!this.orderId) {
      this.toastService.show("Invalid order ID", "error");
      this.router.navigate(['/']);
      return;
    }

    // Fetch order from backend
    this.loadOrder();
  }

  loadOrder() {
    this.orderService.getOrderDetails(this.orderId).subscribe({
      next: (res) => {
        this.order = res.data || res;

        this.hasPhysical = this.order.items.some((i: any) => i.type === 'physical');
        this.hasEbooks = this.order.items.some((i: any) => i.type === 'ebook');

        this.loading = false;

        this.evaluateOrderStatus();
        if (this.order.paymentStatus === 'Pending') {
          setTimeout(() => this.loadOrder(), 3000);
        }
      },
      error: () => {
        this.toastService.show("Order not found", "error");
        this.router.navigate(['/']);
      }
    });
  }

  evaluateOrderStatus() {
    const payment = this.order.paymentStatus;
    const status = this.order.orderStatus;

    if (payment === 'Completed') {
      this.toastService.show("Payment Successful!", "success");
      this.cartService.clearCart();
    }
    else if (payment === 'Failed') {
      this.toastService.show("Payment Failed", "error");
    }
    else if (payment === 'Expired') {
      this.toastService.show("Payment Expired", "error");
    }

    // Additional UI logic can depend on:
    // order.orderStatus = Pending | Processing | Shipped | Delivered | Returned
  }

  goToLibrary() {
    this.router.navigate(['/my-library']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard/user']);
  }

  retryPayment() {
    this.router.navigate(['/cart']);
  }
}
