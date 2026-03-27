export interface SearchParams {
  query: string;
  language?: string;
  age?: string;
  limit?: number;
  skip?: number;
}

export interface SearchResult {
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

export interface AutocompleteResult {
  status: string;
  data: any[];
  warning?: string;
}
