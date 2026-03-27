import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublisherBook } from '../../models/book.model';
import { Genre } from '../../models/genre.model';

export type PublisherBookFormMode = 'create' | 'edit';

export interface PublisherBookFormSubmitEvent {
  payload: FormData | Record<string, unknown>;
  isFormData: boolean;
}

@Component({
  selector: 'app-publisher-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './publisher-book-form.component.html',
  styleUrl: './publisher-book-form.component.css'
})
export class PublisherBookFormComponent implements OnInit, OnChanges {
  @Input() mode: PublisherBookFormMode = 'create';
  @Input() initialBook: PublisherBook | null = null;
  @Input() genres: Genre[] = [];
  @Input() submitting = false;

  @Output() submitForm = new EventEmitter<PublisherBookFormSubmitEvent>();
  @Output() cancel = new EventEmitter<void>();
  @Output() formStatusChange = new EventEmitter<boolean>();

  form!: FormGroup;
  selectedFile: File | null = null;
  selectedFileName = '';
  validationMessages: string[] = [];

  readonly recommendedAgeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Adults', value: 'adults' },
    { label: 'Kids', value: 'kids' },
  ];

  readonly languageOptions = [
    { label: 'English', value: 'english' },
    { label: 'Arabic', value: 'arabic' },
  ];

  readonly statusOptions = [
    { label: 'In Stock', value: 'in stock' },
    { label: 'Out of Stock', value: 'out of stock' },
    { label: 'Removed', value: 'removed' },
  ];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.buildForm();
    this.patchFormValues();
    this.form.statusChanges.subscribe(() => {
      this.formStatusChange.emit(this.form.valid);
    });
    this.formStatusChange.emit(this.form.valid);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.form) {
      return;
    }

    if (changes['initialBook'] && !changes['initialBook'].firstChange) {
      this.patchFormValues();
    }

    if (changes['mode'] && !changes['mode'].firstChange && this.mode === 'create') {
      this.form.reset({
        name: '',
        author: '',
        description: '',
        imageUrl: '',
        Edition: '',
        genre_id: '',
        price: '',
        discount: '',
        cost: '',
        stock: '',
        noOfPages: '',
        status: 'in stock',
        recommendedAge: 'all',
        bookLanguage: 'english',
      });
      this.selectedFile = null;
      this.selectedFileName = '';
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(1000)]],
      imageUrl: ['', [Validators.pattern(/^(https?:\/\/).+/)]],
      Edition: ['', [Validators.required, Validators.maxLength(50)]],
      genre_id: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      discount: ['', [Validators.min(0), Validators.max(100)]],
      cost: ['', [Validators.required, Validators.min(0)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      noOfPages: ['', [Validators.required, Validators.min(1)]],
      status: ['in stock', Validators.required],
      recommendedAge: ['all', Validators.required],
      bookLanguage: ['english', Validators.required],
      pdf: [null],
    }, { validators: this.priceGreaterThanCostValidator });
  }

  private priceGreaterThanCostValidator(group: FormGroup): { [key: string]: any } | null {
    const price = group.get('price')?.value;
    const cost = group.get('cost')?.value;

    if (price !== null && price !== '' && cost !== null && cost !== '') {
      const priceNum = Number(price);
      const costNum = Number(cost);

      if (!isNaN(priceNum) && !isNaN(costNum) && priceNum <= costNum) {
        return { priceMustBeGreaterThanCost: true };
      }
    }

    return null;
  }

  private patchFormValues(): void {
    if (!this.initialBook) {
      return;
    }

    const genreId = typeof this.initialBook.genre === 'object'
      ? this.initialBook.genre?._id
      : this.initialBook.genre;

    this.form.patchValue({
      name: this.initialBook.name ?? '',
      author: this.initialBook.author ?? '',
      description: this.initialBook.description ?? '',
      imageUrl: this.initialBook.image?.url ?? '',
      Edition: this.initialBook.Edition ?? '',
      genre_id: genreId ?? '',
      price: this.initialBook.price ?? '',
      discount: this.initialBook.discount ?? '',
      cost: this.initialBook.cost ?? '',
      stock: this.initialBook.stock ?? '',
      noOfPages: this.initialBook.noOfPages ?? '',
      status: this.initialBook.status ?? 'in stock',
      recommendedAge: this.initialBook.recommendedAge ?? 'all',
      bookLanguage: this.initialBook.bookLanguage ?? 'english',
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;
      this.form.get('pdf')?.setValue(this.selectedFile);
    } else {
      this.selectedFile = null;
      this.selectedFileName = '';
      this.form.get('pdf')?.reset();
    }
  }

  onSubmit(): void {
    this.validationMessages = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.validationMessages.push('Please fill in the required fields correctly.');
      this.formStatusChange.emit(false);
      return;
    }

    const raw = this.form.value;
    const payload = {
      name: raw.name?.trim(),
      author: raw.author?.trim(),
      description: raw.description?.trim() || undefined,
      imageUrl: raw.imageUrl?.trim() || undefined,
      Edition: raw.Edition?.trim(),
      genre_id: raw.genre_id,
      price: Number(raw.price),
      discount: raw.discount !== null && raw.discount !== '' ? Number(raw.discount) : undefined,
      cost: Number(raw.cost),
      stock: Number(raw.stock),
      noOfPages: Number(raw.noOfPages),
      status: raw.status,
      recommendedAge: raw.recommendedAge || 'all',
      bookLanguage: raw.bookLanguage || 'english',
    };

    if (this.mode === 'create') {
      const formData = this.buildFormData(payload);
      this.submitForm.emit({ payload: formData, isFormData: true });
      return;
    }

    if (this.selectedFile) {
      const formData = this.buildFormData(payload);
      this.submitForm.emit({ payload: formData, isFormData: true });
    } else {
      this.submitForm.emit({ payload, isFormData: false });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private buildFormData(data: Record<string, unknown>): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    if (this.selectedFile) {
      formData.append('pdf', this.selectedFile);
    }

    return formData;
  }

  getControl(path: string) {
    return this.form.get(path);
  }
}
