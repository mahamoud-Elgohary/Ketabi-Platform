export interface FilterState {
  language?: string;
  age?: string;
  genre?: string;
  minPrice: number;
  maxPrice: number;
  sort: string;
}

export interface BooksParams {
  language?: string;
  age?: string;
  genre?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
  skip?: number;
}

export interface BooksResult {
  status: string;
  data: {
    books: any[];
    pagination: {
      total: number;
      limit: number;
      skip: number;
      hasMore: boolean;
    };
  };
}

export interface FilterOptions {
  status: string;
  data: {
    languages: string[];
    ages: string[];
    genres: any[];
    priceRange: { min: number; max: number };
  };
}
