import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Hero } from '../../../../../shared/components/hero/hero';
import { CategoryCard } from '../../../../../shared/components/category-card/category-card';
import { BookCard } from '../../../../../shared/components/book-card/book-card';
import { BookService } from '../../../../../core/services/book.service';
import { Book } from '../../../../../core/models/book.model';
import { ChatbotWidgetComponent } from '../../../../../shared/components/chatbot-widget/chatbot-widget.component';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    Hero,
    CategoryCard,
    BookCard,
    ChatbotWidgetComponent,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  categories = [
    {
      icon: 'images/arabic-books.png',
      title: 'Arabic Books',
      category: 'Arabic',
    },
    {
      icon: 'images/english-books.png',
      title: 'English Books',
      category: 'English',
    },
    {
      icon: 'images/new-arrivals.png',
      title: 'New Arrivals',
      category: 'New',
    },
    {
      icon: 'images/kids-books.png',
      title: 'Kids Books',
      category: 'Kids',
    },
  ];

  books: Book[] = [];
  loading: boolean = false;
  error: string = '';
  currentCategoryTitle: string = 'Arabic Books';

  constructor(
    private bookService: BookService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const category = params['category'] || 'Arabic';
      const catObj = this.categories.find(c => c.category === category);
      this.currentCategoryTitle = catObj ? catObj.title : 'Arabic Books';
      this.loadBooksByCategory(category);
    });
  }

  loadBooksByCategory(category: string): void {
    this.loading = true;
    this.error = '';

    this.bookService.getBooksByCategory(category).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          if (Array.isArray((response as any).data)) {
            this.books = (response as any).data as Book[];
          } else if ((response as any).data && Array.isArray((response as any).data.books)) {
            this.books = (response as any).data.books as Book[];
          } else if ((response as any).data && Array.isArray((response as any).data.data)) {
            this.books = (response as any).data.data as Book[];
          } else {
            this.books = [];
            this.error = 'Unexpected response format';
          }
        } else {
          this.error = response.message;
          this.books = [];
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load books';
        console.error('Error loading books:', err);
        this.loading = false;
      }
    });
  }

  onCategoryClick(category: string): void {
    this.router.navigate(['/books', category]);
  }

  ShowAll(): void {
    this.router.navigate(['/books', 'all']);
  }
}
