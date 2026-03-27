import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StripeService } from '../../../core/services/stripe.service';
import { OrderService } from '../../../core/services/order.service';
import { ToastService } from '../../../core/services/toast.service';
import { CartService } from '../../../core/services/cart.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit, OnDestroy {
  clientSecret?: string;
  orderId?: string;
  name = '';
  email = '';
  processing = false;
  errorMessage = '';
  cartItems: any[] = [];
  orderDetails: any;

  constructor(
    private stripeService: StripeService,
    private orderService: OrderService,
    private cartService: CartService,
    private toast: ToastService,
    private router: Router
  ) { }

  async ngOnInit() {
    // prefer router state, fallback to stripeService
    const navState: any = history.state;
    this.clientSecret = navState.client_secret || this.stripeService.clientSecret;
    this.orderId = navState.orderId || this.stripeService.orderId;
    const cart = localStorage.getItem("ketabi_cart");
    if (cart) this.cartItems = JSON.parse(cart).items;

    const order = localStorage.getItem("current_order");
    if (order) this.orderDetails = JSON.parse(order);


    if (!this.clientSecret) {
      this.toast.show('Missing payment info', 'error');
      this.router.navigate(['/cart']);
      return;
    }

    await this.stripeService.init();
    this.stripeService.createCardElement('#card-element');
  }

  ngOnDestroy() {
    this.stripeService.destroyCardElement();
  }

  async pay() {
    if (!this.clientSecret) return;
    this.processing = true;
    this.errorMessage = '';

    try {
      const result: any = await this.stripeService.confirmCardPayment(this.clientSecret, {
        name: this.name,
        email: this.email
      });

      if (result.error) {
        this.errorMessage = result.error.message || 'Payment failed';
        this.toast.show(this.errorMessage, 'error');
        this.router.navigate(['/my-orders']);
        this.processing = false;
        return;
      }

      const intent = result.paymentIntent;
      if (intent && intent.status === 'succeeded') {
        // Frontend-level success:
        this.toast.show('Payment succeeded', 'success');
        // Clear cart locally (optional — webhook will be source of truth)
        this.cartService.clearCart();
        this.router.navigate([`/order-success/${this.orderId}`]);
      } else {
        this.toast.show('Payment processing, you will receive a confirmation shortly', 'info');
        this.router.navigate([`/order-success/${this.orderId}`]);
      }
    } catch (err: any) {
      this.toast.show(err.message || 'Payment error', 'error');
      this.processing = false;
      this.router.navigate([`/order-success/${this.orderId}`]);
    } finally {
      this.processing = false;
    }
  }
}
