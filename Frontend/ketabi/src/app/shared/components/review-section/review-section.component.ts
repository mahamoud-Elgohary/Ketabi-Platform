import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { Review, ReviewResponse } from '../../../core/models/review.model';

@Component({
    selector: 'app-review-section',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './review-section.component.html',
    styleUrl: './review-section.component.css'
})
export class ReviewSectionComponent implements OnInit {
    @Input() bookId!: string;

    reviews: Review[] = [];
    reviewForm: FormGroup;
    loading = false;
    submitting = false;
    error: string | null = null;
    success: string | null = null;

    constructor(
        private reviewService: ReviewService,
        private fb: FormBuilder
    ) {
        this.reviewForm = this.fb.group({
            rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
            title: ['', [Validators.maxLength(120)]],
            body: ['', [Validators.maxLength(5000)]]
        });
    }

    ngOnInit(): void {
        if (this.bookId) {
            this.loadReviews();
        }
    }

    loadReviews(): void {
        this.loading = true;
        this.error = null;
        this.reviewService.getReviewsByBook(this.bookId).subscribe({
            next: (response: ReviewResponse) => {
                console.log('Backend:', response);
                this.reviews = response.data.items || [];
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading reviews:', err);
                this.error = 'Failed to load reviews. Please try again.';
                this.loading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.reviewForm.invalid || this.submitting) {
            return;
        }

        this.submitting = true;
        this.error = null;
        this.success = null;

        const formValue = this.reviewForm.value;
        const reviewData = {
            book: this.bookId,
            rating: formValue.rating,
            title: formValue.title || '',
            body: formValue.body || ''
        };

        this.reviewService.createReview(reviewData).subscribe({
            next: (response: ReviewResponse) => {
                console.log('Backend:', response);
                this.success = 'Review submitted successfully!';
                this.reviewForm.reset({ rating: 5, title: '', body: '' });
                this.submitting = false;
                // Reload reviews to show the new one
                this.loadReviews();
            },
            error: (err) => {
                console.error('Error creating review:', err);
                this.error = err.error?.message || 'Failed to submit review. Please try again.';
                this.submitting = false;
            }
        });
    }

    getStars(rating: number): number[] {
        return Array.from({ length: 5 }, (_, i) => i + 1);
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

