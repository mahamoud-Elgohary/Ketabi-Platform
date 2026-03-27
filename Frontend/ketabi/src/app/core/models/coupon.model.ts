export interface couponResponse {
  status: string;
  message: string;
  code: number;
  coupon: {
    code:string;
    discountAmount:number;
    minOrderValue:number
  };
}

export interface CouponState {
  code: string | null;
  discountAmount: number;
  minOrderValue: number;
  message: string;
  error: string;
  isLoading: boolean;
}