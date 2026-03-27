import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { ChatbotResponse } from '../../../core/models/chatbot.model';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  books?: any[];
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chatbot-widget.component.html',
  styleUrl: './chatbot-widget.component.css'
})
export class ChatbotWidgetComponent implements OnInit {
  isOpen = false;
  messages: ChatMessage[] = [];
  userInput = '';
  isLoading = false;
  hasError = false;
  errorMessage = '';

  constructor(
    private chatbotService: ChatbotService,
    private cartService: CartService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.messages.push({
      id: '1',
      type: 'bot',
      message: '👋 Hello! I\'m your AI book assistant. How can I help you find the perfect book today?',
      timestamp: new Date()
    });
  }

  toggleWidget(): void {
    this.isOpen = !this.isOpen;
  }

  closeWidget(): void {
    this.isOpen = false;
  }

  sendMessage(): void {
    if (!this.userInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: this.userInput,
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    const query = this.userInput;
    this.userInput = '';
    this.isLoading = true;
    this.hasError = false;

    this.chatbotService.askChatbot({ query }).subscribe({
      next: (response: ChatbotResponse) => {
        this.isLoading = false;

        if (response.success) {
          const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'bot',
            message: response.data.response,
            books: response.data.books,
            timestamp: new Date()
          };
          this.messages.push(botMessage);
        } else {
          this.showError('Failed to get response from chatbot');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Chatbot error:', err);
        this.showError('Connection error. Please try again.');
      }
    });
  }

  addToCart(event: Event, book: any): void {
    event.stopPropagation(); 

    if (book.status !== 'in stock') {
      this.toast.show('Book is out of stock', 'error');
      return;
    }

    this.cartService.addItem(book, 1, 'physical');
    this.toast.show('Added to cart!', 'success');
  }

  private showError(message: string): void {
    this.hasError = true;
    this.errorMessage = message;
    const errorMessage: ChatMessage = {
      id: (Date.now() + 2).toString(),
      type: 'bot',
      message: ` ${message}`,
      timestamp: new Date()
    };
    this.messages.push(errorMessage);
  }

  clearChat(): void {
    this.messages = [{
      id: '1',
      type: 'bot',
      message: '👋 Hello! I\'m your AI book assistant. How can I help you find the perfect book today?',
      timestamp: new Date()
    }];
  }
}
