import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { StripeService } from '../services/stripe.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentGuard implements CanActivate {

  constructor(
    private stripeService: StripeService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const clientSecret = this.stripeService.clientSecret;
    const orderId = this.stripeService.orderId;

    // Or also check localStorage if needed:
    const order = localStorage.getItem('current_order');

    if (!clientSecret || !orderId || !order) {
      this.router.navigate(['/cart']);
      return false;
    }

    return true;
  }
}
