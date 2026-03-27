export interface PublisherBook {
    _id: string;
    name: string;
    author: string;
    description: string;
    Edition: string;
    recommendedAge: 'kids' | 'adults' | 'all';
    bookLanguage: 'english' | 'arabic';
    genre: string | { _id: string; name: string };
    price: number;
    discount?: number;
    cost: number;
    stock?: number;
    noOfPages: number;
    image?: { url?: string };
    status: 'in stock' | 'out of stock' | 'removed';
    pdf?: {
        key: string;
        url: string;
        fileName: string;
        size: number;
        mimeType: string;
        uploadedAt: string;
    };
    avgRating?: number;
    ratingsCount?: number;
    publisher: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PublisherBooksResponse {
    status: string;
    message: string;
    code: number;
    data: {
        page: number;
        limit: number;
        totalPages: number;
        totalBooks: number;
        count: number;
        books: PublisherBook[];
    };
}

export interface UpdateBookRequest {
    name?: string;
    author?: string;
    description?: string;
    imageUrl?: string;
    Edition?: string;
    recommendedAge?: 'kids' | 'adults' | 'all';
    bookLanguage?: 'english' | 'arabic';
    genre_id?: string;
    genre?: string;
    price?: number;
    discount?: number;
    cost?: number;
    stock?: number;
    noOfPages?: number;
    status?: 'in stock' | 'out of stock';
}

