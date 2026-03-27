import { registerables, Chart } from 'chart.js';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ChatComponent } from '../../../../../shared/components/chat/chat.component';
import { AuthService } from '../../../../../core/services/auth.service';
import { AdminDashboardService } from '../../../../../core/services/admin.service';

// Register Chart.js components
Chart.register(...registerables);

interface DashboardStats {
  totalBooks: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  booksChange: number;
  ordersChange: number;
  revenueChange: number;
  usersChange: number;
}

interface RecentOrder {
  _id: string;
  orderNumber: string;
  user: {
    _id?: string;
    name: string;
    email: string;
  };
  totalPrice: number;
  orderStatus: string;
  createdAt: string;
}

interface LowStockBook {
  _id: string;
  name: string;
  author: string;
  stock: number;
  price: number;
  image?: {
    url: string;
  };
}

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-dashboard.component',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, ChatComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersChart') ordersChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;

  isUserLoggedIn = false;
  role: string | null = null;
  sidebarCollapsed = false;
  notificationCount = 0;

  revenueFilter = '1m';
  ordersFilter = '1m';

  menuItems: MenuItem[] = [
    { icon: 'fa-th-large', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'fa-book', label: 'Books', route: '/admin/books' },
    { icon: 'fa-users', label: 'Users', route: '/admin/users' },
    { icon: 'fa-comments', label: 'Responses', route: '/admin/responses' },
  ];

  private destroy$ = new Subject<void>();
  private revenueChart?: Chart;
  private ordersChart?: Chart;
  private categoryChart?: Chart;
  private chartsInitialized = false;

  stats: DashboardStats = {
    totalBooks: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    booksChange: 0,
    ordersChange: 0,
    revenueChange: 0,
    usersChange: 0,
  };

  recentOrders: RecentOrder[] = [];
  lowStockBooks: LowStockBook[] = [];

  loading = true;
  error = '';

  // Chart data
  revenueData = {
    '7d': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [2400, 3200, 2800, 4100, 3600, 4800, 5200],
    },
    '1m': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      data: [12000, 19000, 15000, 22000],
    },
    '3m': {
      labels: ['Month 1', 'Month 2', 'Month 3'],
      data: [45000, 52000, 61000],
    },
    '1y': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [32000, 38000, 35000, 42000, 48000, 55000, 52000, 58000, 63000, 68000, 72000, 78000],
    },
  };

  ordersData = {
    '7d': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      data: [12, 19, 15, 23, 18, 28, 32],
    },
    '1m': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      data: [45, 67, 52, 78],
    },
    '3m': {
      labels: ['Month 1', 'Month 2', 'Month 3'],
      data: [156, 189, 234],
    },
    '1y': {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      data: [145, 167, 152, 178, 195, 212, 198, 223, 245, 267, 289, 312],
    },
  };

  categoryData = {
    labels: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Children', 'Technology'],
    data: [450, 380, 320, 280, 210, 190, 150],
  };

  userName = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: AdminDashboardService
  ) {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      console.log('❌ User not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      console.log('❌ No user found, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isUserLoggedIn = true;
    this.role = currentUser.role;
    this.userName = currentUser.name || 'Admin User';

    console.log('✅ Dashboard initialized for user:', this.userName);
  }

  ngOnInit() {
    console.log('🔵 Dashboard ngOnInit called');

    // Load data but don't initialize charts yet
    this.loadDashboardData();

    const notif = this.menuItems.find((i) => i.label === 'Notifications');
    this.notificationCount = notif?.badge ?? 0;
  }

  ngAfterViewInit() {
    console.log('🔵 Dashboard ngAfterViewInit called');

    // Wait for data to load before initializing charts
    // The charts will be initialized in loadDashboardData's success callback
  }

  ngOnDestroy() {
    console.log('🔵 Dashboard ngOnDestroy called');

    this.destroy$.next();
    this.destroy$.complete();

    // Destroy charts safely
    this.destroyCharts();
  }

  private destroyCharts() {
    try {
      if (this.revenueChart) {
        this.revenueChart.destroy();
        this.revenueChart = undefined;
      }
      if (this.ordersChart) {
        this.ordersChart.destroy();
        this.ordersChart = undefined;
      }
      if (this.categoryChart) {
        this.categoryChart.destroy();
        this.categoryChart = undefined;
      }
      this.chartsInitialized = false;
      console.log('✅ Charts destroyed successfully');
    } catch (error) {
      console.error('Error destroying charts:', error);
    }
  }

  initializeCharts() {
    // Prevent double initialization
    if (this.chartsInitialized) {
      console.log('⚪ Charts already initialized, skipping');
      return;
    }

    // Check if view children are available
    if (!this.revenueChartRef || !this.ordersChartRef || !this.categoryChartRef) {
      console.warn('⚠️ Chart refs not available yet, retrying...');
      setTimeout(() => this.initializeCharts(), 100);
      return;
    }

    console.log('🔵 Initializing charts...');

    try {
      this.createRevenueChart();
      this.createOrdersChart();
      this.createCategoryChart();
      this.chartsInitialized = true;
      console.log('✅ All charts initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing charts:', error);
      this.error = 'Failed to initialize charts';
    }
  }

  createRevenueChart() {
    if (!this.revenueChartRef?.nativeElement) {
      console.warn('⚠️ Revenue chart ref not available');
      return;
    }

    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ Could not get canvas context for revenue chart');
      return;
    }

    // Destroy existing chart if any
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }

    const data = this.revenueData[this.revenueFilter as keyof typeof this.revenueData];

    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Revenue',
            data: data.data,
            borderColor: '#667eea',
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(102, 126, 234, 0.2)');
              gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
              return gradient;
            },
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#2c3e50',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              label: (context) => {
                return `Revenue: $${context?.parsed?.y?.toLocaleString()}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              callback: (value) => {
                return '$' + value.toLocaleString();
              },
              font: {
                size: 12,
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
              },
            },
          },
        },
      },
    });

    console.log('✅ Revenue chart created');
  }

  createOrdersChart() {
    if (!this.ordersChartRef?.nativeElement) {
      console.warn('⚠️ Orders chart ref not available');
      return;
    }

    const ctx = this.ordersChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ Could not get canvas context for orders chart');
      return;
    }

    // Destroy existing chart if any
    if (this.ordersChart) {
      this.ordersChart.destroy();
    }

    const data = this.ordersData[this.ordersFilter as keyof typeof this.ordersData];

    this.ordersChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Orders',
            data: data.data,
            backgroundColor: (context) => {
              const ctx = context.chart.ctx;
              const gradient = ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(240, 147, 251, 0.8)');
              gradient.addColorStop(1, 'rgba(245, 87, 108, 0.8)');
              return gradient;
            },
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#2c3e50',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              label: (context) => {
                return `Orders: ${context.parsed.y}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: {
                size: 12,
              },
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 12,
              },
            },
          },
        },
      },
    });

    console.log('✅ Orders chart created');
  }

  createCategoryChart() {
    if (!this.categoryChartRef?.nativeElement) {
      console.warn('⚠️ Category chart ref not available');
      return;
    }

    const ctx = this.categoryChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.warn('⚠️ Could not get canvas context for category chart');
      return;
    }

    // Destroy existing chart if any
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const colors = [
      'rgba(102, 126, 234, 0.8)',
      'rgba(240, 147, 251, 0.8)',
      'rgba(79, 172, 254, 0.8)',
      'rgba(67, 233, 123, 0.8)',
      'rgba(245, 87, 108, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(153, 102, 255, 0.8)',
    ];

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.categoryData.labels,
        datasets: [
          {
            data: this.categoryData.data,
            backgroundColor: colors,
            borderWidth: 3,
            borderColor: '#fff',
            hoverBorderWidth: 4,
            hoverBorderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 20,
              font: {
                size: 13,
              },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: '#2c3e50',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              },
            },
          },
        },
      },
    });

    console.log('✅ Category chart created');
  }

  setRevenueFilter(filter: string) {
    this.revenueFilter = filter;
    this.createRevenueChart();
  }

  setOrdersFilter(filter: string) {
    this.ordersFilter = filter;
    this.createOrdersChart();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if logout fails, redirect to login
        this.router.navigate(['/auth/login']);
      },
    });
  }

  loadDashboardData() {
    this.loading = true;
    this.error = '';

    console.log('🔵 Loading dashboard data...');

    this.dashboardService
      .getAllDashboardData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log('✅ Dashboard data loaded:', data);

          this.stats = {
            totalBooks: data.totalBooks,
            totalOrders: data.totalOrders,
            totalRevenue: data.totalRevenue,
            totalUsers: data.totalUsers,
            booksChange: 12.5,
            ordersChange: 8.3,
            revenueChange: 15.2,
            usersChange: 23.1,
          };

          this.recentOrders = data.recentOrders.slice(0, 5).map((order: any) => ({
            _id: order._id,
            orderNumber: order.orderNumber,
            user: order.user,
            totalPrice: order.totalPrice,
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
          }));

          this.loading = false;

          // Initialize charts AFTER data is loaded and DOM is ready
          setTimeout(() => {
            this.initializeCharts();
          }, 100);
        },
        error: (error) => {
          console.error('❌ Error loading dashboard data:', error);
          this.error = 'Failed to load dashboard data. Please try again.';
          this.loading = false;
        },
      });

    this.loadLowStockBooks();
  }

  loadLowStockBooks() {
    this.dashboardService
      .getLowStockBooks(5, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.lowStockBooks = response.lowStockBooks;
            console.log('✅ Low stock books loaded');
          }
        },
        error: (error) => {
          console.error('❌ Error loading low stock books:', error);
        },
      });
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      Pending: 'status-pending',
      Processing: 'status-processing',
      Shipped: 'status-shipped',
      Delivered: 'status-delivered',
      Cancelled: 'status-cancelled',
    };
    return statusMap[status] || 'status-pending';
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  getChangeIcon(change: number): string {
    return change >= 0 ? '↑' : '↓';
  }

  getChangeClass(change: number): string {
    return change >= 0 ? 'positive' : 'negative';
  }
}
