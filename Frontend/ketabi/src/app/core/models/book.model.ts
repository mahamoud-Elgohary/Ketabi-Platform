export interface Genre {
  _id: string;
  name: string;
}
export interface Book {
  _id: string;
  name: string;
  author: string;
  category?: string;
  price: number;
  discount?: number;
  image: { url: string };
  description: string;
  stock?: number;
  status: string;
  genre?: { name: string; _id?: string };
  avgRating?: number;
  ratingsCount?: number;
  bookLanguage?: 'english' | 'arabic';
  recommendedAge?: 'kids' | 'adults' | 'all';
  Edition?: string;
  noOfPages?: number;
  finalPrice?: number;
}
export interface BookResponse {
  status: string;
  message: string;
  code: number;
  data: {
    books: Book[];
    pagination: any;
  };
}
export interface SingleBookResponse {
  status: string;
  message: string;
  code: number;
  data: Book;
}
