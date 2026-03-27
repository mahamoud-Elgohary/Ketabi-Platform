// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user' | 'publisher';
  status?: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  createdAt: string;
}

export interface UsersResponse {
  success: boolean;
  users: User[];
  message?: string;
}

export interface UserResponse {
  success: boolean;
  user: User;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'admin' | 'user' | 'publisher';
  status?: 'active' | 'inactive' | 'suspended';
  gender?: 'male' | 'female';
}

export interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'user' | 'publisher';
  status?: 'active' | 'inactive' | 'suspended';
  gender?: 'male' | 'female';
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiBaseUrl}/admin/users`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Get all users
   */
  getAllUsers(): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(this.apiUrl, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Create new user
   */
  createUser(userData: CreateUserDTO): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.apiUrl, userData, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Update user
   */
  updateUser(id: string, userData: UpdateUserDTO): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/${id}`, userData, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Delete user
   */
  deleteUser(id: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Update user status (activate, deactivate, suspend)
   */
  updateUserStatus(
    id: string,
    status: 'active' | 'inactive' | 'suspended'
  ): Observable<UserResponse> {
    return this.http.patch<UserResponse>(
      `${this.apiUrl}/${id}/status`,
      { status },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Update user role
   */
  updateUserRole(id: string, role: 'admin' | 'user' | 'publisher'): Observable<UserResponse> {
    return this.http.patch<UserResponse>(
      `${this.apiUrl}/${id}/role`,
      { role },
      {
        headers: this.getAuthHeaders(),
      }
    );
  }

  /**
   * Bulk delete users
   */
  bulkDeleteUsers(userIds: string[]): Observable<DeleteResponse> {
    return this.http.request<DeleteResponse>('DELETE', `${this.apiUrl}/bulk`, {
      headers: this.getAuthHeaders(),
      body: { userIds },
    });
  }

  /**
   * Search users
   */
  searchUsers(query: string): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/search`, {
      headers: this.getAuthHeaders(),
      params: { q: query },
    });
  }

  /**
   * Get users by role
   */
  getUsersByRole(role: 'admin' | 'user' | 'publisher'): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${this.apiUrl}/role/${role}`, {
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * Get users statistics
   */
  getUsersStats(): Observable<any> {
    return this.http.get<any>(`${environment.apiBaseUrl}/admin/users/stats`, {
      headers: this.getAuthHeaders(),
    });
  }
}
