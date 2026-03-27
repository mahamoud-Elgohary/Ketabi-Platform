export enum DeliveryStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  IN_TRANSIT = 'InTransit',
  DELIVERED = 'Delivered',
  RETURNED = 'Returned'
}

export enum PaymentStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  FAILED = 'Failed',
  REFUNDED = 'Refunded',
  EXPIRED = 'Expired'
}

export interface PublisherOrderItem {
  book: string | { _id: string; name: string };
  quantity: number;
  price: number;
  discount: number;
  type: string;
  deliveryStatus: DeliveryStatus;
  paymentStatus: PaymentStatus;
}

export interface PublisherOrder {
  _id: string;
  publisher: string;
  order: string;
  email: string;
  name: string;
  items: PublisherOrderItem[];
  coupon: string;
  couponDiscount: number;
  totalPrice: number;
  shippingAddress: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phoneNumber?: string;
  };
  finalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublisherOrdersResponse {
  status: string;
  message: string;
  code: number;
  data: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    count: number;
    orders: PublisherOrder[];
  };
}

export interface UpdatePublisherOrderRequest {
  bookId: string;
  deliveryStatus?: DeliveryStatus;
  paymentStatus?: PaymentStatus;
}

export interface UpdatePublisherOrderResponse {
  status: string;
  message: string;
  code: number;
  data: {
    publisherOrder: PublisherOrder;
    mainOrder: any;
  };
}

