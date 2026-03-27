import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublisherService } from '../../../../core/services/publisher.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PublisherBook, PublisherBooksResponse, UpdateBookRequest } from '../../models/book.model';
import { Genre } from '../../models/genre.model';
import { PublisherBookFormComponent, PublisherBookFormSubmitEvent } from '../../components/publisher-book-form/publisher-book-form.component';

interface FeedbackMessage {
    type: 'success' | 'error';
    text: string;
}

@Component({
    selector: 'app-publisher-books',
    standalone: true,
    imports: [CommonModule, PublisherBookFormComponent],
    templateUrl: './publisher-books.component.html',
    styleUrl: './publisher-books.component.css'
})
export class PublisherBooksComponent implements OnInit {
    @Input() publisherId?: string;

    books: PublisherBook[] = [];
    genres: Genre[] = [];

    loading = false;
    genresLoading = false;
    loadingBookId: string | null = null;
    submitting = false;

    error: string | null = null;
    feedbackMessage: FeedbackMessage | null = null;

    currentPage = 1;
    limit = 10;
    totalPages = 0;
    totalBooks = 0;

    showForm = false;
    formMode: 'create' | 'edit' = 'create';
    selectedBook: PublisherBook | null = null;

    deleteConfirmId: string | null = null;
    deletingBookId: string | null = null;

    constructor(
        private publisherService: PublisherService,
        private authService: AuthService,
    ) { }

    ngOnInit(): void {
        const id = this.publisherId || this.getCurrentUserId();
        if (id) {
            this.loadGenres();
            this.loadBooks(id);
        } else {
            this.error = 'Publisher ID is required';
        }
    }

    private getCurrentUserId(): string | null {
        return this.authService.getCurrentUser()?.id || null;
    }

    private setFeedback(type: 'success' | 'error', text: string): void {
        this.feedbackMessage = { type, text };
    }

    dismissFeedback(): void {
        this.feedbackMessage = null;
    }

    loadGenres(): void {
        if (this.genres.length) {
            return;
        }
        this.genresLoading = true;
        this.publisherService.getGenres().subscribe({
            next: (genres) => {
                this.genres = genres;
                this.genresLoading = false;
            },
            error: (err) => {
                this.genresLoading = false;
                this.setFeedback('error', err.error?.message || 'Failed to load genres.');
            }
        });
    }

    loadBooks(publisherId: string, page: number = 1): void {
        this.loading = true;
        this.error = null;
        this.currentPage = page;

        this.publisherService.getPublishedBooks(publisherId, page, this.limit).subscribe({
            next: (response: PublisherBooksResponse) => {
                this.books = response.data.books || [];
                this.totalPages = response.data.totalPages || 0;
                this.totalBooks = response.data.totalBooks || 0;
                this.loading = false;
            },
            error: (err) => {
                this.error = err.error?.message || 'Failed to load books. Please try again.';
                this.loading = false;
            }
        });
    }

    addNewBook(): void {
        this.formMode = 'create';
        this.selectedBook = null;
        this.ensureGenres(() => {
            this.showForm = true;
        });
    }

    editBook(bookId: string): void {
        this.formMode = 'edit';
        this.loadingBookId = bookId;
        this.ensureGenres(() => {
            this.publisherService.getPublisherBook(bookId).subscribe({
                next: (book) => {
                    this.selectedBook = book;
                    this.loadingBookId = null;
                    this.showForm = true;
                },
                error: (err) => {
                    this.loadingBookId = null;
                    this.setFeedback('error', err.error?.message || 'Failed to load book details.');
                }
            });
        }, () => {
            this.loadingBookId = null;
        });
    }

    private ensureGenres(onSuccess: () => void, onError?: () => void): void {
        if (this.genres.length) {
            onSuccess();
            return;
        }

        this.genresLoading = true;
        this.publisherService.getGenres().subscribe({
            next: (genres) => {
                this.genres = genres;
                this.genresLoading = false;
                onSuccess();
            },
            error: (err) => {
                this.genresLoading = false;
                this.setFeedback('error', err.error?.message || 'Failed to load genres.');
                if (onError) {
                    onError();
                }
            }
        });
    }

    handleFormSubmit(event: PublisherBookFormSubmitEvent): void {
        this.submitting = true;

        if (this.formMode === 'create') {
            this.publisherService.addBook(event.payload as FormData).subscribe({
                next: () => this.onFormSuccess('Book created successfully.'),
                error: (err) => this.onFormError(err.error?.message || 'Failed to create book.'),
            });
            return;
        }

        if (!this.selectedBook?._id) {
            this.onFormError('Missing book information for update.');
            return;
        }

        if (event.isFormData) {
            this.publisherService.updateBook(this.selectedBook._id, event.payload).subscribe({
                next: () => this.onFormSuccess('Book updated successfully.'),
                error: (err) => this.onFormError(err.error?.message || 'Failed to update book.'),
            });
            return;
        }

        const payload = event.payload as Record<string, unknown>;
        const updatePayload: UpdateBookRequest = {};

        if (payload['name']) updatePayload.name = String(payload['name']).trim();
        if (payload['author']) updatePayload.author = String(payload['author']).trim();
        if (payload['description']) updatePayload.description = String(payload['description']).trim();
        if (payload['Edition']) updatePayload.Edition = String(payload['Edition']).trim();
        if (payload['genre_id']) updatePayload.genre_id = String(payload['genre_id']).trim();
        if (payload['recommendedAge']) {
            const age = String(payload['recommendedAge']) as UpdateBookRequest['recommendedAge'];
            updatePayload.recommendedAge = age;
        }
        if (payload['bookLanguage']) {
            const lang = String(payload['bookLanguage']) as UpdateBookRequest['bookLanguage'];
            updatePayload.bookLanguage = lang;
        }
        if (payload['price'] !== undefined && payload['price'] !== '') updatePayload.price = Number(payload['price']);
        if (payload['discount'] !== undefined && payload['discount'] !== '') updatePayload.discount = Number(payload['discount']);
        if (payload['cost'] !== undefined && payload['cost'] !== '') updatePayload.cost = Number(payload['cost']);
        if (payload['stock'] !== undefined && payload['stock'] !== '') updatePayload.stock = Number(payload['stock']);
        if (payload['noOfPages'] !== undefined && payload['noOfPages'] !== '') updatePayload.noOfPages = Number(payload['noOfPages']);
        if (payload['status']) {
            const statusValue = String(payload['status']);
            if (statusValue === 'in stock' || statusValue === 'out of stock') {
                updatePayload.status = statusValue;
            }
        }

        this.publisherService.updateBook(this.selectedBook._id, updatePayload).subscribe({
            next: () => this.onFormSuccess('Book updated successfully.'),
            error: (err) => this.onFormError(err.error?.message || 'Failed to update book.'),
        });
    }

    handleFormCancel(): void {
        this.closeForm();
    }

    handleFormStatusChange(valid: boolean): void {
        if (!valid) {
            this.feedbackMessage = null;
        }
    }

    private onFormSuccess(message: string): void {
        this.submitting = false;
        this.closeForm();
        this.setFeedback('success', message);
        this.refreshBooks();
    }

    private onFormError(message: string): void {
        this.submitting = false;
        this.setFeedback('error', message);
    }

    private closeForm(): void {
        this.showForm = false;
        this.selectedBook = null;
        this.formMode = 'create';
        this.loadingBookId = null;
    }

    private refreshBooks(): void {
        const id = this.publisherId || this.getCurrentUserId();
        if (id) {
            this.loadBooks(id, this.currentPage);
        }
    }

    promptDelete(bookId: string): void {
        this.deleteConfirmId = bookId;
        this.feedbackMessage = null;
    }

    cancelDelete(): void {
        this.deleteConfirmId = null;
        this.deletingBookId = null;
    }

    confirmDelete(bookId: string): void {
        this.deletingBookId = bookId;
        this.publisherService.deleteBook(bookId).subscribe({
            next: () => {
                this.deletingBookId = null;
                this.deleteConfirmId = null;
                this.setFeedback('success', 'Book deleted successfully.');
                this.refreshBooks();
            },
            error: (err) => {
                this.deletingBookId = null;
                this.setFeedback('error', err.error?.message || 'Failed to delete book.');
            }
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            const id = this.publisherId || this.getCurrentUserId();
            if (id) {
                this.loadBooks(id, page);
            }
        }
    }

    getGenreName(genre: any): string {
        if (!genre) {
            return 'Unknown';
        }
        if (typeof genre === 'string') {
            const match = this.genres.find((g) => g._id === genre);
            return match?.name ?? genre;
        }
        return genre?.name || 'Unknown';
    }
}

