import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../../../core/services/book.service';
import { Book } from '../../../../core/models/book.model';
import { BookCard } from '../../../../shared/components/book-card/book-card';

@Component({
  selector: 'book-list',
  templateUrl: './book-list.html',
  styleUrls: ['./book-list.css'],
  imports: [CommonModule, BookCard],
})
export class BookListComponent implements OnInit {
  books: Book[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.fetchBooks();
  }
  fetchBooks(): void {
    this.bookService.getAllBooks().subscribe({
      next: (response) => {
        this.books = response.data.books;
        console.log('🚀 ~ BookListComponent ~ fetchBooks ~ books:', this.books);

        this.isLoading = false;
        console.log('Books loaded:', this.books);
      },
      error: (error) => {
        this.errorMessage = 'Failed to load books.';
        console.error(error);
        this.isLoading = false;
      },
    });
  }
}
