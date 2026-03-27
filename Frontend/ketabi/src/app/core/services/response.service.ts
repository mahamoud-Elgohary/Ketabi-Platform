import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Response {
  _id: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    avatar?: string;
  };
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CreateResponseDTO {
  message: string;
}

export interface UpdateResponseDTO {
  status?: 'pending' | 'approved' | 'rejected';
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ResponseService {
  private apiUrl = `${environment.apiBaseUrl}/users/responses`; // Adjust based on your API

  constructor(private http: HttpClient) {}

  // Get all responses (Admin only)
  getAllResponses(): Observable<ApiResponse<Response[]>> {
    return this.http.get<ApiResponse<Response[]>>(`${this.apiUrl}`);
  }

  // Get user's own responses
  getUserResponses(): Observable<ApiResponse<Response[]>> {
    return this.http.get<ApiResponse<Response[]>>(this.apiUrl);
  }

  // Get a single response by ID
  getResponseById(id: string): Observable<ApiResponse<Response>> {
    return this.http.get<ApiResponse<Response>>(`${this.apiUrl}/${id}`);
  }

  // Create a new response (User submits publisher request)
  createResponse(data: CreateResponseDTO): Observable<ApiResponse<Response>> {
    return this.http.post<ApiResponse<Response>>(this.apiUrl, data);
  }

  // Update a response (Admin approves/rejects)
  updateResponse(id: string, data: UpdateResponseDTO): Observable<ApiResponse<Response>> {
    return this.http.patch<ApiResponse<Response>>(`${this.apiUrl}/${id}`, data);
  }

  // Delete a response
  deleteResponse(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
