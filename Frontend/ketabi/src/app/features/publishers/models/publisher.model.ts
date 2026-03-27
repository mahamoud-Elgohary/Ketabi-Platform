export interface Publisher {
  _id: string;
  name: string;
  email: string;
  role: string;
  booksPublished?: string[];
}

export interface PublisherResponse {
  status: string;
  message: string;
  code: number;
  data: Publisher;
}

