export interface User {
    _id: string;
    name: string;
}

export interface Review {
    _id: string;
    user?: User;
    book: string;
    rating: number;
    title?: string;
    body?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ReviewResponse {
    status: string;
    message?: string;
    data: {
        review?: Review;
        items?: Review[];
        pagination?: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

export interface CreateReviewRequest {
    book: string;
    rating: number;
    title?: string;
    body?: string;
}

export interface UpdateReviewRequest {
    rating?: number;
    title?: string;
    body?: string;
}

