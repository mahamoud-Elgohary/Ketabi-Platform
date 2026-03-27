import { Component, OnInit } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CommonModule, AsyncPipe, CurrencyPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../core/services/coupon.service';
import { ToastService } from '../../core/services/toast.service';
import { take } from 'rxjs';
import { OrderService } from '../../core/services/order.service';
import { CouponState } from '../../core/models/coupon.model';
import { CartItem } from '../../core/models/cart.model';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { StripeService } from '../../core/services/stripe.service';
import { AuthService } from '../../core/services/auth.service';
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, AsyncPipe, RouterLink, FormsModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css',
})
export class CartComponent implements OnInit {

  cartItems$!: Observable<CartItem[]>;
  total$!: Observable<number>;
  coupon$!: Observable<CouponState>;

  // coupon
  couponCode = ''

  // gift
  isGift = false;
  giftEmail = '';
  giftMessage = '';

  //shipping
  street = '';
  city = '';
  phoneNumber = '';

  checkingOut = false;
  paymentMethod: 'Stripe' | 'Paymob' = 'Stripe';

  constructor(
    private cartService: CartService,
    private couponService: CouponService,
    private toastService: ToastService,
    private orderService: OrderService,
    private router: Router,
    private stripeService: StripeService,
    private authService:AuthService
  ) { }

  async ngOnInit() {
    this.cartItems$ = this.cartService.cart$.pipe(map((cart) => cart.items));
    this.total$ = this.cartService.cart$.pipe(map((cart) => cart.total));
    this.coupon$ = this.couponService.coupon$;
  }

  applyCoupon(event: Event) {
    event.preventDefault();
    this.total$
      .pipe(take(1))
      .subscribe(total => {
        this.couponService.applyCode(this.couponCode, total);
      });
  }

  get totalOrder() {
    return this.couponService.calculateDiscountedTotal(this.subtotalBeforeCoupons());
  }

  increase(item: CartItem) {
    this.cartService.updateItem(item._id, item.quantity + 1, item.type);
    this.checkCouponValidOrNot();
  }

  decrease(item: CartItem) {
    if (item.quantity > 1) {
      this.cartService.updateItem(item._id, item.quantity - 1, item.type);
      this.checkCouponValidOrNot();
    }
  }

  changeType(item: CartItem) {
    const newType = item.type === 'ebook' ? 'physical' : 'ebook';
    this.cartService.updateItem(item._id, item.quantity, newType);
    this.checkCouponValidOrNot();
  }

  remove(item: CartItem) {
    this.cartService.removeItem(item._id);
    this.checkCouponValidOrNot();
  }

  clear() {
    this.cartService.clearCart();
    this.couponService.resetCoupon();
  }

  hasPhysicalBooks(): boolean {
    return this.cartService.hasPhysicalBooks();
  }

  subtotalBeforeCoupons() {
    return this.cartService.getCart().total;
  }

  checkCouponValidOrNot() {
    if (this.couponService.getMinOrderValue() > this.subtotalBeforeCoupons()) {
      this.toastService.show(`Minimum order for coupon ${this.couponCode} is EGP${this.couponService.getMinOrderValue()}`, 'error');
      this.couponService.resetCoupon();
    }
  }

  checkout() {
    this.checkingOut = true;
    const items = this.cartService.getCartItems();
    const formattedItems = items.map(item => ({
      book: item._id,
      quantity: item.quantity,
      type: item.type
    }));

    const orderPayload: any = {
      items: formattedItems,
      paymentMethod: this.paymentMethod,
      isGift: this.isGift,
      coupon: this.couponCode || 'No Coupon'
    };

    if (this.isGift) {
      orderPayload.recipientEmail = this.giftEmail;
      orderPayload.personalizedMessage = this.giftMessage;
    }

    const hasPhysicalBook = formattedItems.some(item => item.type === 'physical');

    if (hasPhysicalBook) {
      const phoneRegex = /^\+?\d{10,15}$/;

      if (!this.street || !this.city || !this.phoneNumber) {
        this.toastService.show("All shipping fields are required!", "error");
        this.checkingOut = false;
        return;
      }

      if (!phoneRegex.test(this.phoneNumber)) {
        this.toastService.show("Invalid phone number format!", "error");
        this.checkingOut = false;
        return;
      }

      orderPayload.shippingAddress = {
        street: this.street,
        city: this.city,
        phoneNumber: this.phoneNumber
      };
    }

    if (this.totalOrder < 200 && this.paymentMethod === 'Stripe') {
      this.toastService.show('Order must be more than EGP200', 'info');
      this.checkingOut = false;
      return;
    }

    console.log('Order payload:', orderPayload);
    this.couponCode='';
    this.couponService.resetCoupon();

    if (this.authService.getCurrentUserRole() != 'user'){
      this.toastService.show('Only users are allowed to buy books');
      return;
    }
    // call backend to create order + payment intent
    this.orderService.createOrder(orderPayload).pipe(take(1)).subscribe({
      next: (res: any) => {
        if (res.payment_method === 'Stripe') {
          const clientSecret = res.client_secret;
          const orderId = res.data?.orderNumber || res.data?.orderNumber;

          if (!clientSecret) {
            this.toastService.show('Payment initialization failed', 'error');
            this.checkingOut = false;
            return;
          }
          localStorage.setItem('current_order', JSON.stringify(res.data));
          // store in stripe service so payment page can use it if router state lost
          this.stripeService.clientSecret = clientSecret;
          this.stripeService.orderId = orderId;

          this.checkingOut = false;
          // navigate to payment page and pass data via router state (optional)
          this.router.navigate(['/payment'], { state: { client_secret: clientSecret, orderId } });
        } else if (res.payment_method === 'Paymob') {
          this.toastService.show('Redirecting to Paymob...', 'success');
          window.location.href = res.iframe_url;
        }
        
      },
      error: err => {
        this.toastService.show(err.error.message || 'Order creation failed', 'error');
        this.checkingOut = false;
      }
    });
  }

  trackById(_: number, item: CartItem) {
    return item._id;
  }
}
