export enum cartMethods {
  POST = 'post',
  PUT = 'put',
  DELETE = "delete"
}

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  discount: number;
  image: { url: string };
  stock: number;
  type: 'ebook' | 'physical',
  quantity: number
}

export class Cart {
  constructor(public items: CartItem[] = []) { }

  get total(): number {
    return this.items.reduce(
      (sum, item) =>
        sum +
        item.price *
        (item.type === 'ebook' ? 0.45 : 1) *
        item.quantity *
        (1 - (item.discount || 0) / 100),
      0
    );
  }
}

export interface CartRespone {
  status: string;
  message: string;
  code: number;
  data: Cart;
}

