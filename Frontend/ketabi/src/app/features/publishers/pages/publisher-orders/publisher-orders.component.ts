import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { PublisherService } from '../../../../core/services/publisher.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PublisherOrder, PublisherOrdersResponse, UpdatePublisherOrderRequest, DeliveryStatus, PaymentStatus } from '../../models/order.model';
import { ToastService } from '../../../../core/services/toast.service';
import { Router } from '@angular/router';
@Component({
    selector: 'app-publisher-orders',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './publisher-orders.component.html',
    styleUrl: './publisher-orders.component.css'
})
export class PublisherOrdersComponent implements OnInit {
    @Input() publisherId?: string;

    orders: PublisherOrder[] = [];
    loading = false;
    error: string | null = null;
    currentPage = 1;
    limit = 10;
    totalPages = 0;
    total = 0;

    
    showUpdateModal = false;
    selectedOrder: PublisherOrder | null = null;
    selectedItemIndex: number = -1;
    updateForm: FormGroup;
    updating = false;

    deliveryStatuses = Object.values(DeliveryStatus);
    paymentStatuses = Object.values(PaymentStatus);

    constructor(
        private publisherService: PublisherService,
        private fb: FormBuilder,
        private authService: AuthService,
        private toastService:ToastService,
        private router:Router
    ) {
        this.updateForm = this.fb.group({
            deliveryStatus: [''],
            paymentStatus: ['']
        });
    }

    ngOnInit(): void {
        const id = this.publisherId || this.getCurrentUserId();
        if (id) {
            this.loadOrders(id);
        } else {
            this.error = 'Publisher ID is required';
        }
    }

    private getCurrentUserId(): string | null {
        return this.authService.getCurrentUser()?.id || null;
    }

    loadOrders(publisherId: string, page: number = 1): void {
        this.loading = true;
        this.error = null;
        this.currentPage = page;

        this.publisherService.getPublisherOrders(publisherId, page, this.limit).subscribe({
            next: (response: PublisherOrdersResponse) => {
                console.log('Backend:', response);
                this.orders = response.data.orders || [];
                this.totalPages = response.data.totalPages || 0;
                this.total = response.data.total || 0;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading orders:', err);
                this.error = err.error?.message || 'Failed to load orders. Please try again.';
                this.loading = false;
            }
        });
    }

    openUpdateModal(order: PublisherOrder, itemIndex: number): void {
        this.selectedOrder = order;
        this.selectedItemIndex = itemIndex;
        const item = order.items[itemIndex];

        this.updateForm.patchValue({
            deliveryStatus: item.deliveryStatus || '',
            paymentStatus: item.paymentStatus || ''
        });

        this.showUpdateModal = true;
    }

    closeUpdateModal(): void {
        this.showUpdateModal = false;
        this.selectedOrder = null;
        this.selectedItemIndex = -1;
        this.updateForm.reset();
    }

    submitUpdate(): void {
        if (!this.selectedOrder || this.selectedItemIndex === -1) return;

        const formValue = this.updateForm.value;
        const item = this.selectedOrder.items[this.selectedItemIndex];
        const bookId = typeof item.book === 'string' ? item.book : item.book._id;

        const updateData: UpdatePublisherOrderRequest = {
            bookId: bookId,
            deliveryStatus: formValue.deliveryStatus || undefined,
            paymentStatus: formValue.paymentStatus || undefined
        };

       
        if (!updateData.deliveryStatus) delete updateData.deliveryStatus;
        if (!updateData.paymentStatus) delete updateData.paymentStatus;

        if (!updateData.deliveryStatus && !updateData.paymentStatus) {
            this.error = 'Please select at least one status to update';
            return;
        }

        this.updating = true;
        this.error = null;

        this.publisherService.updatePublisherOrder(this.selectedOrder._id, updateData).subscribe({
            next: (response) => {
                console.log('Backend:', response);
                this.updating = false;
                this.closeUpdateModal();
               
                const id = this.publisherId || this.getCurrentUserId();
                if (id) {
                    this.loadOrders(id, this.currentPage);
                }
            },
            error: (err) => {
                console.error('Error updating order:', err);
                this.error = err.error?.message || 'Failed to update order. Please try again.';
                this.updating = false;
            }
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            const id = this.publisherId || this.getCurrentUserId();
            if (id) {
                this.loadOrders(id, page);
            }
        }
    }

    getBookName(item: any): string {
        if (typeof item.book === 'string') return 'Unknown Book';
        return item.book?.name || 'Unknown Book';
    }

    getEditionName(item:any):string{
        if (typeof item.book === 'string') return 'Unknown Edition';
        return item.book?.Edition || 'Unknown Edition';
    }

    getStatusClass(status: string): string {
        const statusLower = status.toLowerCase().replace(' ', '-');
        return `status-${statusLower}`;
    }

    goToBookDetails(item:any):void{
        const id = item.book?._id;
        if (!id){
            this.toastService.show('Unknown Book','error')
        } else {
            this.router.navigate(['/books',id])
        }
    }
}

