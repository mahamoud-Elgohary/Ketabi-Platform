import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  UserService,
  User,
  CreateUserDTO,
  UpdateUserDTO,
} from '../../../../../core/services/user.service';
import { ChatComponent } from '../../../../../shared/components/chat/chat.component';

interface ExtendedUser extends User {
  selected?: boolean;
  gender?: string;
}

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ChatComponent],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent implements OnInit, OnDestroy {
  // Sidebar and Navigation
  sidebarCollapsed = false;
  isUserLoggedIn = true; // Set based on your auth logic
  role = 'admin'; // Set based on your auth logic
  notificationCount = 3; // Example notification count

  menuItems: MenuItem[] = [
    { icon: 'fa-th-large', label: 'Dashboard', route: '/admin/dashboard' },
    { icon: 'fa-book', label: 'Books', route: '/admin/books' },
    { icon: 'fa-users', label: 'Users', route: '/admin/users' },
    { icon: 'fa-comments', label: 'Responses', route: '/admin/responses' },
  ];

  // Stats
  totalUsers = 0;
  activeUsers = 0;
  adminUsers = 0;
  newUsersThisMonth = 0;

  // Table data
  users: ExtendedUser[] = [];
  filteredUsers: ExtendedUser[] = [];
  errorMessage = '';
  // Filters
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  Math = Math;

  // Selection
  selectAll = false;

  // UI State
  loading = true;
  showUserModal = false;
  modalMode: 'view' | 'edit' | 'add' = 'view';
  selectedUser: any = {};

  private destroy$ = new Subject<void>();

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Sidebar Methods
  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    // Implement your logout logic here
    console.log('Logging out...');
    this.router.navigate(['/login']);
  }

  loadUsers() {
    this.loading = true;
    this.errorMessage = '';

    this.userService
      .getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('📥 API Response:', response); // Debug log

          if (response.success) {
            this.users = response.users.map((user) => {
              console.log('👤 User from API:', user.name, 'Status:', user.status); // Debug log

              return {
                ...user,
                status: user.status,
                selected: false,
              };
            });

            console.log('✅ Processed users:', this.users); // Debug log

            this.filteredUsers = [...this.users];
            this.updateStats();
            this.updatePagination();
          } else {
            this.errorMessage = response.message || 'Failed to load users';
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error loading users:', error);
          this.errorMessage = error.error?.message || 'Failed to load users. Please try again.';
          this.loading = false;
        },
      });
  }

  private determineUserStatus(user: User): 'active' | 'inactive' | 'suspended' {
    return 'active';
  }

  updateStats() {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter((u) => u.status === 'active').length;
    this.adminUsers = this.users.filter((u) => u.role === 'admin').length;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    this.newUsersThisMonth = this.users.filter((u) => new Date(u.createdAt) > oneMonthAgo).length;
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredUsers = this.users.filter((user) => {
      const matchesSearch =
        !this.searchTerm ||
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.phone?.includes(this.searchTerm);

      const matchesRole = !this.selectedRole || user.role === this.selectedRole;
      const matchesStatus = !this.selectedStatus || user.status === this.selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });

    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  sortBy(field: string) {
    const isAscending =
      this.filteredUsers[0] &&
      this.filteredUsers[1] &&
      this.getFieldValue(this.filteredUsers[0], field) <=
        this.getFieldValue(this.filteredUsers[1], field);

    this.filteredUsers.sort((a, b) => {
      const aValue = this.getFieldValue(a, field);
      const bValue = this.getFieldValue(b, field);

      if (aValue < bValue) return isAscending ? 1 : -1;
      if (aValue > bValue) return isAscending ? -1 : 1;
      return 0;
    });
  }

  private getFieldValue(user: ExtendedUser, field: string): any {
    switch (field) {
      case 'name':
        return user.name.toLowerCase();
      case 'email':
        return user.email.toLowerCase();
      case 'role':
        return user.role;
      case 'createdAt':
        return new Date(user.createdAt).getTime();
      default:
        return '';
    }
  }

  toggleSelectAll() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const pageUsers = this.filteredUsers.slice(startIndex, endIndex);

    pageUsers.forEach((user) => {
      user.selected = this.selectAll;
    });
  }

  onUserSelect() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const pageUsers = this.filteredUsers.slice(startIndex, endIndex);

    this.selectAll = pageUsers.every((user) => user.selected);
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.selectAll = false;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, this.currentPage - 1);
      let end = Math.min(this.totalPages - 1, this.currentPage + 1);

      if (this.currentPage <= 3) {
        end = 4;
      } else if (this.currentPage >= this.totalPages - 2) {
        start = this.totalPages - 3;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      pages.push(this.totalPages);
    }

    return pages;
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  viewUser(user: ExtendedUser) {
    this.selectedUser = { ...user };
    this.modalMode = 'view';
    this.showUserModal = true;
  }

  editUser(user: ExtendedUser) {
    this.selectedUser = { ...user };
    this.modalMode = 'edit';
    this.showUserModal = true;
  }

  deleteUser(user: ExtendedUser) {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      this.userService
        .deleteUser(user._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.users = this.users.filter((u) => u._id !== user._id);
              this.applyFilters();
              this.updateStats();
              console.log('User deleted successfully');
            } else {
              alert(response.message || 'Failed to delete user');
            }
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            alert(error.error?.message || 'Failed to delete user');
          },
        });
    }
  }

  openAddUserModal() {
    this.selectedUser = {
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'user',
      status: 'active',
    };
    this.modalMode = 'add';
    this.showUserModal = true;
  }

  closeModal() {
    this.showUserModal = false;
    this.selectedUser = {};
  }

  saveUser() {
    if (this.modalMode === 'add') {
      if (!this.selectedUser.name || !this.selectedUser.email || !this.selectedUser.password) {
        alert('Please fill in all required fields');
        return;
      }

      const createData: CreateUserDTO = {
        name: this.selectedUser.name,
        email: this.selectedUser.email,
        password: this.selectedUser.password,
        phone: this.selectedUser.phone,
        role: this.selectedUser.role,
        status: this.selectedUser.status,
        gender: this.selectedUser.gender,
      };

      this.userService
        .createUser(createData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              // Reload to ensure consistency
              this.loadUsers();
              this.closeModal();
              console.log('✅ User created successfully');
            } else {
              alert(response.message || 'Failed to create user');
            }
          },
          error: (error) => {
            console.error('❌ Error creating user:', error);
            alert(error.error?.message || 'Failed to create user');
          },
        });
    } else if (this.modalMode === 'edit') {
      const updateData: UpdateUserDTO = {
        name: this.selectedUser.name,
        email: this.selectedUser.email,
        phone: this.selectedUser.phone,
        role: this.selectedUser.role,
        status: this.selectedUser.status,
        gender: this.selectedUser.gender,
      };

      console.log('🚀 Sending update:', updateData);

      this.userService
        .updateUser(this.selectedUser._id, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('📥 Update response:', response);

            if (response.success) {
              // Reload all users to ensure UI matches database
              this.loadUsers();
              this.closeModal();
              console.log('✅ User updated successfully');
            } else {
              alert(response.message || 'Failed to update user');
            }
          },
          error: (error) => {
            console.error('❌ Error updating user:', error);
            alert(error?.error?.message || 'Failed to update user');
          },
        });
    }
  }

  exportUsers() {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateCSV(): string {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Created At'];
    const rows = this.filteredUsers.map((user) => [
      user._id,
      user.name,
      user.email,
      user.phone || 'N/A',
      user.role,
      user.status || 'active',
      new Date(user.createdAt).toLocaleDateString(),
    ]);

    const csvRows = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ];

    return csvRows.join('\n');
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      admin: 'fas fa-user-shield',
      user: 'fas fa-user',
      publisher: 'fas fa-user-tie',
    };
    return icons[role] || 'fas fa-user';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
