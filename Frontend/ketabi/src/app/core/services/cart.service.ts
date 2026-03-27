import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Cart, CartItem, cartMethods, CartRespone } from '../models/cart.model';
import { Book } from '../models/book.model';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { ToastService } from './toast.service';
@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly CART_KEY = 'ketabi_cart';
  private cartSubject = new BehaviorSubject<Cart>({ items: [], total: 0 });
  public cart$ = this.cartSubject.asObservable();

  constructor(private authService: AuthService, private http: HttpClient, private toast: ToastService) {
    this.loadCart();
    this.listenToLoginEvents();
    this.listenToLogOutEvents();
  }

  // Initialization
  // -----------------------------
  private loadCart() {
    if (this.authService.isLoggedIn()) {
      this.fetchCartFromBackend();
    }
    else this.loadCartFromLocalStorage();
  }

  private listenToLoginEvents() {
    this.authService.isAuthenticated$
      .subscribe(() => {
        this.loadCart();
      });
  }

  private listenToLogOutEvents() {
    this.authService.hasLogOut$
      .subscribe((isLogOut) => {
        if (isLogOut) {
          this.clearCart();
          this.loadCart();
        }
      })
  }

  // Cart Loading
  // -----------------------------

  private loadCartFromLocalStorage() {
    const stored = localStorage.getItem(this.CART_KEY);
    const cart = stored ? JSON.parse(stored) : { items: [], total: 0 };
    this.cartSubject.next(cart);
    this.saveCartToLocal();
  }

  private fetchCartFromBackend() {
    this.http.get<CartRespone>(`${API_ENDPOINTS.cart}`).subscribe({
      next: (res) => {
        const cartFromBackEnd = { items: res.data.items, total: res.data.total }
        this.mergeLocalStorageAndBackendCart(cartFromBackEnd);
      },
      error: (err) => {
        this.toast.show(`Couldn't load cart from server: ${err.error?.message || err.error}`, 'error');
        this.loadCartFromLocalStorage();
      }
    });
  }

  private mergeLocalStorageAndBackendCart(backendCart: Cart) {
    const localStorageCart = this.getLocalStorageCart();
    const { merged, changed } = this.mergeItems(localStorageCart.items, backendCart.items);
    const mergedCart: Cart = {
      items: merged,
      total: 0
    };
    this.cartSubject.next(mergedCart);
    if (changed) {
      this.saveCartInBulkToBackEnd();
    }
    this.updateTotals(mergedCart);
    this.saveCartToLocal();
  }

  private mergeItems(local: CartItem[], backend: CartItem[]) {
    const merged = backend;
    let changed = false;
    local.forEach(localItem => {
      const existing = merged.find(item => item._id === localItem._id);
      if (!existing) {
        merged.push(localItem);
        changed = true;
      }
    });
    return { merged, changed };
  }

  private getLocalStorageCart(): Cart {
    const stored = localStorage.getItem(this.CART_KEY);
    return stored ? JSON.parse(stored) : { items: [], total: 0 };
  }

  private saveCartToLocal() {
    const cart = this.cartSubject.value;
    localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
  }

  // Cart Operations
  // -----------------------------
  addItem(book: Book, quantity: number = 1, type: 'physical' | 'ebook') {
    const cart = this.cartSubject.value;
    const existingItem = cart.items.find(i => i._id === book._id);
    if (existingItem) {
      existingItem.type = type;
      type === 'physical' ? existingItem.quantity = Math.min(existingItem.quantity + quantity, (existingItem.stock || 1)) : existingItem.quantity = 1;
      this.saveCartToBackend(cartMethods.PUT, existingItem);
    } else {
      if (!book.stock || book.stock == 0) {
        type = 'ebook';
        quantity = 1;
      }
      const newItem: CartItem = {
        _id: book._id,
        name: book.name,
        price: book.price,
        discount: book.discount || 0,
        image: { url: book.image?.url ?? 'default-book.jpg' },
        stock: book.stock || 0,
        type: type,
        quantity: quantity
      };
      cart.items.push(newItem);
      this.saveCartToBackend(cartMethods.POST, newItem);
    }
    this.updateTotals(cart);
  }

  removeItem(bookId: string) {
    const cart = this.cartSubject.value;
    const index = cart.items.findIndex(i => i._id === bookId);
    if (index >= 0) {
      this.saveCartToBackend(cartMethods.DELETE, cart.items[index])
    }
    cart.items = cart.items.filter(i => i._id !== bookId);
    this.updateTotals(cart);
  }

  updateItem(bookId: string, quantity: number, type: 'physical' | 'ebook') {
    const cart = this.cartSubject.value;
    const item = cart.items.find(i => i._id === bookId);
    if (item) {
      if (!item.stock || item.stock == 0) {
        item.type = 'ebook';
        item.quantity = 1;
        this.toast.show(`Book: ${item.name} only available in ebook`)
      } else {
        item.type = type;
        if (type === 'ebook') {
          item.quantity = 1;
        } else {
          item.quantity = Math.min(quantity, item.stock || 0);
          if (item.quantity == 0) {
            this.toast.show(`Book: ${item.name} only avaliable in ebook`, 'info');
          } else if (item.quantity == item.stock) {
            this.toast.show(`Book: ${item.name} not enough stock. Only ${item.quantity}`, 'info');
          }
        }
      }
      this.saveCartToBackend(cartMethods.PUT, item);
      this.updateTotals(cart);
    }
  }

  clearCart() {
    const cart: Cart = {
      items: [],
      total: 0,
    };
    this.cartSubject.next(cart);
    localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    if (this.authService.isAuthenticated()) {
      this.saveCartInBulkToBackEnd();
    }
  }

  getCart() {
    const cart = this.cartSubject.value;
    return cart;
  }

  getCartItems() {
    const items = this.cartSubject.value.items;
    return items;
  }

  getTotal() {
    const total = this.cartSubject.value.total;
    return total;
  }

  hasPhysicalBooks() {
    const items = this.cartSubject.value.items;
    return items.some(i => i.type === 'physical');
  }

  // Private Helpers
  // -----------------------------

  private saveCartToBackend(action: cartMethods, item: CartItem) {
    if (!this.authService.isLoggedIn()) return;
    const body = { book: item._id, quantity: item.quantity, type: item.type };
    const book: string = item._id;
    const obsMap = {
      [cartMethods.POST]: () => this.http.post(API_ENDPOINTS.cart, body),
      [cartMethods.PUT]: () => this.http.put(API_ENDPOINTS.cart, body),
      [cartMethods.DELETE]: () => this.http.delete(API_ENDPOINTS.cart, { body: { book } })
    };

    obsMap[action]().subscribe({
      //error: err => this.toast.show(`Cart sync failed, METHOD ${action} ${item.name}: ${err.error?.message}`, 'error')
    });
  }

  private saveCartInBulkToBackEnd() {
    const cart = this.cartSubject.value.items;
    const filteredCart = cart.map(item => ({
      book: item._id,
      type: item.type,
      quantity: item.quantity
    }))
    this.http.put(`${API_ENDPOINTS.cart}/SetCart`, filteredCart).subscribe({})
  }

  private updateTotals(cart: Cart) {
    const total = cart.items.reduce((sum, item) =>
      sum +
      item.price *
      (item.type === 'ebook' ? 0.45 : 1) *
      item.quantity *
      (1 - (item.discount || 0) / 100),
      0);
    this.cartSubject.next({ ...cart, total });
    this.saveCartToLocal();
  }

}
