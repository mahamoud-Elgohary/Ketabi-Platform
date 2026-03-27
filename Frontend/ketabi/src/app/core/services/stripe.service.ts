import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private stripe: Stripe | null = null;
  private elements: ReturnType<Stripe['elements']> | null = null;
  private cardElement: StripeCardElement | null = null;

  public clientSecret?: string;
  public orderId?: string;

  async init(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await loadStripe(environment.stripePubKey);
    }
    return this.stripe;
  }

  createCardElement(mountSelector: string): StripeCardElement {
    if (!this.stripe) throw new Error('Stripe not initialized. Call init() first');

    if (!this.elements) {
      this.elements = this.stripe.elements();
    }

    this.cardElement = this.elements.create('card', { hidePostalCode: true });
    this.cardElement.mount(mountSelector);

    return this.cardElement;
  }

  destroyCardElement() {
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement = null;
    }
    this.elements = null;
  }

  async confirmCardPayment(clientSecret: string, billing: { name?: string; email?: string }) {
    if (!this.stripe || !this.cardElement)
      throw new Error('Stripe or card element not ready');

    return this.stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: this.cardElement,
        billing_details: billing,
      },
    });
  }
}
