import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { couponResponse, CouponState } from '../models/coupon.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { BehaviorSubject, catchError, map, of } from 'rxjs';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class CouponService {

  private readonly api_url = API_ENDPOINTS.coupon;

  private couponSubject = new BehaviorSubject<CouponState>({
    code: null,
    discountAmount: 0,
    error: '',
    isLoading: false,
    message: '',
    minOrderValue: 0
  });

  coupon$ = this.couponSubject.asObservable();
  
  constructor(private http: HttpClient, private toast: ToastService) {}


  applyCode(code: string, subtotal: number) {
    if (!code.trim()) return;

    this.updateState({ isLoading: true });

    const params = new HttpParams().set('subtotal', subtotal.toString());

    this.http
      .get<couponResponse>(`${this.api_url}/${code}`, { params })
      .pipe(
        map((res) => ({
          code,
          discountAmount: res.coupon.discountAmount,
          minOrderValue: res.coupon.minOrderValue,
          message: res.message,
          error: '',
          isLoading: false
        })),
        catchError((err) => {
          const message = err.error?.message;
          this.toast.show(message, "error");
          return of({
            code: null,
            discountAmount: 0,
            minOrderValue: 0,
            message: '',
            error: message,
            isLoading: false
          });
        })
      ).subscribe((newState) => {
        this.updateState(newState);
        if (!newState.error && newState.discountAmount > 0) {
          this.toast.show(`Coupon Applied! ${newState.discountAmount}% OFF`, 'success');
        } else {}
      });
  }

  calculateDiscountedTotal(subtotal: number) {
    const discountAmount = this.couponSubject.value.discountAmount;
    return Math.round(subtotal * (1 - discountAmount / 100) * 100) / 100;
  }

  getMinOrderValue(){
    const coupon = this.couponSubject.value.minOrderValue;
    return coupon;
  }

  resetCoupon() {
    this.updateState({
      code: null,
      discountAmount: 0,
      minOrderValue: 0,
      message: '',
      error: '',
      isLoading: false
    });
  }

  private updateState(partialUpdate: Partial<CouponState>) {
    this.couponSubject.next({ ...this.couponSubject.value, ...partialUpdate });
  }

}