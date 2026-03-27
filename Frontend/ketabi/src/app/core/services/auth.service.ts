import { SocialAuthService } from '@abacritt/angularx-social-login';
import { jwtDecode } from 'jwt-decode';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SocialLoginRequest,
} from '../../features/auth/models/login.model';
import { AuthResponse, RegisterResponse } from '../../features/auth/models/auth-response.model';
import { IUser } from '../models/user.model';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { SocialLoginData } from '../../features/auth/components/register-form/register-form.component';
import { NotificationService } from './notification.service';
import { AuthTokens } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiBaseUrl || '/api';
  private readonly TOKEN_KEY = 'token';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private readonly SESSION_ID_KEY = 'sessionId';
  private readonly ACTIVE_SESSION_KEY = 'activeSession';
  private currentSessionId: string | null = null;
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private currentUserSubject = new BehaviorSubject<IUser | null>(this.getUserFromToken());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private hasLogOutSubject = new BehaviorSubject(false);
  public hasLogOut$ = this.hasLogOutSubject.asObservable();

  private isLoggingIn = false; // Flag to prevent session check during login
  private authStateSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
  public authState$: Observable<boolean> = this.authStateSubject.asObservable();
  private authRole = new BehaviorSubject<string | null>(this.getUserRole());
  public authRole$ = this.authRole.asObservable();
  constructor(
    private http: HttpClient,
    private router: Router,
    private socialAuthService: SocialAuthService,
    private notificationService: NotificationService
  ) {
    console.log('🔵 AuthService initialized');
    console.log('Initial auth state:', this.isAuthenticatedSubject.value);
    console.log('Initial user:', this.currentUserSubject.value);

    // IMPORTANT: Delay session validity check to prevent reload crashes
    // This allows the page to fully load before running checks
    this.checkSessionValidity();

    // Listen for storage events from other tabs
    this.listenToStorageEvents();
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================
  getCurrentUserId(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.id : null;
  }
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  getCurrentUserName(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.name : null;
  }
  getAdminId(): string | null {
    // Assuming admin ID is fixed; replace with actual logic if needed
    return '68eb55652688714915d79019';
  }
  private listenToStorageEvents(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('storage', (event: StorageEvent) => {
      try {
        console.log('🔔 Storage event detected:', {
          key: event.key,
          oldValue: event.oldValue?.substring(0, 50),
          newValue: event.newValue?.substring(0, 50),
          currentSessionId: this.currentSessionId,
        });

        // IMPORTANT: Ignore storage events if we're currently logging in
        if (this.isLoggingIn) {
          console.log('⚪ Ignoring storage event - login in progress');
          return;
        }

        // Ignore events during page reload (within first 2 seconds)
        const timeSinceInit = Date.now() - (this.initTime || Date.now());
        if (timeSinceInit < 2000) {
          console.log('⚪ Ignoring storage event - page just loaded');
          return;
        }

        // Detect when active session changes in another tab
        if (event.key === this.ACTIVE_SESSION_KEY) {
          const newActiveSession = event.newValue;
          const oldActiveSession = event.oldValue;

          // Only process if both old and new sessions exist
          if (!newActiveSession || !oldActiveSession) {
            return;
          }

          // If a NEW session is created and this tab has an OLD session
          if (
            newActiveSession !== oldActiveSession &&
            this.currentSessionId &&
            this.currentSessionId === oldActiveSession
          ) {
            console.log('🔴 New login detected in another tab.');
            console.log('My session:', this.currentSessionId);
            console.log('Old session:', oldActiveSession);
            console.log('New session:', newActiveSession);

            // Check if it's the same user before logging out
            try {
              const token = localStorage.getItem(this.TOKEN_KEY);
              if (token) {
                const decoded: any = jwtDecode(token);
                const currentUserId = decoded._id || decoded.id || decoded.userId || decoded.sub;

                // For now, allow same user multiple sessions
                // Uncomment below to enforce single session per user
                // this.handleForcedLogout();

                console.log('✅ Same user detected, allowing multiple sessions');
              }
            } catch (error) {
              console.error('Error checking user ID:', error);
            }
          }
        }

        // Detect when tokens are removed (logout in another tab)
        if (event.key === this.TOKEN_KEY && event.oldValue && !event.newValue) {
          console.log('🔴 Logout detected in another tab.');
          this.handleForcedLogout();
        }
      } catch (error) {
        console.error('❌ Error in storage event listener:', error);
        // Don't crash - just log the error
      }
    });
  }
  private initTime = Date.now();

  // Make handleForcedLogout safer

  // Add this method to your AuthService class

  getCurrentUserRole(): string | null {
    // Or if you decode it from the token:
    const token = this.getAccessToken();
    if (token) {
      const decoded = this.decodeToken(token);
      return decoded.role || null;
    }
    return null;
  }
  private checkSessionValidity(): void {
    try {
      // Don't check if we're currently logging in
      if (this.isLoggingIn) {
        console.log('⚪ Skipping session check - login in progress');
        return;
      }

      const activeSession = localStorage.getItem(this.ACTIVE_SESSION_KEY);
      const storedSessionId = localStorage.getItem(this.SESSION_ID_KEY);
      const token = localStorage.getItem(this.TOKEN_KEY);

      console.log('🔍 Checking session validity:', {
        activeSession,
        storedSessionId,
        hasToken: !!token,
        currentSessionId: this.currentSessionId,
        isLoggingIn: this.isLoggingIn,
      });

      // Set current session ID if it exists
      if (storedSessionId) {
        this.currentSessionId = storedSessionId;
      }

      // Only check validity if we have a stored session and token
      // If there's no token, this is likely a fresh page load before login
      if (!token || !storedSessionId) {
        console.log('⚪ No existing session found - fresh start');
        return;
      }

      // Verify token is not expired
      if (!this.hasValidToken()) {
        console.log('⚠️ Token expired on reload');
        this.clearAuthData();
        return;
      }

      // If there's an active session and it's different from ours,
      // only log out if we're in a browser environment (not during SSR)
      if (
        typeof window !== 'undefined' &&
        activeSession &&
        storedSessionId &&
        activeSession !== storedSessionId
      ) {
        console.log('🔴 A newer session exists. Checking if same user...');

        try {
          // Get current user from token
          const currentUser = this.getUserFromToken();

          if (currentUser) {
            console.log('✅ Valid session found for user:', currentUser.name);
            // Update the session to current one if valid
            this.currentSessionId = storedSessionId;
            localStorage.setItem(this.ACTIVE_SESSION_KEY, storedSessionId);
          } else {
            console.log('⚠️ Could not verify user from token');
          }
        } catch (error) {
          console.error('Error verifying session:', error);
        }
      } else {
        console.log('✅ Session is valid and active');
      }
    } catch (error) {
      console.error('❌ Error in checkSessionValidity:', error);
      // Don't crash - just log the error
    }
  }
  private handleForcedLogout(): void {
    // Clear local data without calling backend
    this.clearAuthData();

    // Show notification (optional)
    this.showLogoutNotification();

    // Redirect to login
    this.router.navigate(['/auth/login'], {
      queryParams: { reason: 'session_expired' },
    });
  }

  private showLogoutNotification(): void {
    this.notificationService.warning(
      'You have been logged out because you signed in on another tab or device.',
      6000
    );
  }

  // ==========================================
  // TOKEN MANAGEMENT
  // ==========================================

  setTokens(accessToken: string, refreshToken: string): void {
    console.log('🔵 setTokens called');

    // Mark that we're actively logging in
    this.isLoggingIn = true;

    // Generate new session ID
    this.currentSessionId = this.generateSessionId();

    // IMPORTANT: Set all data atomically to prevent race conditions
    // First update the active session to claim this as the new active session
    localStorage.setItem(this.ACTIVE_SESSION_KEY, this.currentSessionId);

    // Then set tokens and session info
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.SESSION_ID_KEY, this.currentSessionId);

    // Decode token and extract user info
    const user = this.getUserFromToken();
    console.log('✅ User extracted from token:', user);

    // Update both subjects
    this.isAuthenticatedSubject.next(true);
    this.currentUserSubject.next(user);

    console.log('✅ Auth state updated');
    console.log('✅ isAuthenticated:', this.isAuthenticatedSubject.value);
    console.log('✅ currentUser:', this.currentUserSubject.value);
    console.log('✅ Session ID:', this.currentSessionId);

    // Clear the login flag after a short delay
    setTimeout(() => {
      this.isLoggingIn = false;
    }, 500);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }
  setAccessToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.accessTokenSubject.next(token);
  }

  // ==========================================
  // USER MANAGEMENT
  // ==========================================

  getCurrentUser(): IUser | null {
    return this.getUserFromToken();
  }

  // Extract user from JWT token
  private getUserFromToken(): IUser | null {
    const token = this.getAccessToken();
    if (!token) {
      console.log('⚠️ No token found');
      return null;
    }

    try {
      const decoded: any = jwtDecode(token);
      console.log('🔍 Decoded token:', decoded);

      // Map token payload to IUser interface
      const user: IUser = {
        id: decoded._id || decoded.id || decoded.userId || decoded.sub,
        name: decoded.name || `${decoded.firstName || ''} ${decoded.lastName || ''}`.trim(),
        email: decoded.email,
        role: decoded.role || 'user',
        phone: decoded.phone || '',
        gender: decoded.gender || '',
        address: decoded.address || '',
      };

      console.log('✅ User object created from token:', user);
      return user;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return null;
    }
  }

  // ==========================================
  // AUTHENTICATION CHECKS
  // ==========================================

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  private hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    try {
      const payload = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);
      const isValid = payload.exp > currentTime;

      if (!isValid) {
        console.warn('⚠️ Token expired');
        this.clearAuthData();
      }

      return isValid;
    } catch {
      console.warn('⚠️ Invalid token');
      return false;
    }
  }

  decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  getUserRole(): string | null {
    if (this.isAuthenticated()) {
      try {
        const token = this.getAccessToken();
        if (!token) return null;
        const decoded = this.decodeToken(token);
        return decoded?.role || null;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  // ==========================================
  // AUTH SUCCESS HANDLER
  // ==========================================

  private handleAuthSuccess(response: any): void {
    console.log('🔵 handleAuthSuccess called with:', response);

    if (response.data?.accessToken) {
      console.log('✅ Access token found');
      this.setTokens(response.data.accessToken, response.data.refreshToken);
    } else {
      console.warn('⚠️ No access token in response');
    }
  }

  // ==========================================
  // CLEAR AUTH DATA
  // ==========================================

  clearAuthData(): void {
    try {
      console.log('🔵 Clearing auth data');

      // Get current active session before clearing
      const currentActiveSession = localStorage.getItem(this.ACTIVE_SESSION_KEY);

      // Clear tokens and session ID
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.SESSION_ID_KEY);

      // Only clear activeSession if it belongs to this tab
      if (currentActiveSession === this.currentSessionId) {
        localStorage.removeItem(this.ACTIVE_SESSION_KEY);
        console.log('✅ Cleared active session (was mine)');
      } else {
        console.log('⚪ Kept active session (belongs to another tab)');
      }

      this.currentSessionId = null;
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      this.hasLogOutSubject.next(true);
      console.log('✅ Auth data cleared');
    } catch (error) {
      console.error('❌ Error clearing auth data:', error);
    }
  }

  // ==========================================
  // LOGIN METHODS
  // ==========================================

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}${API_ENDPOINTS.AUTH.LOGIN}`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          console.log('🔵 Login response:', response);
          if (response.data?.accessToken) {
            this.handleAuthSuccess(response);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  confirmLogin(otp: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(
        `${this.API_URL}${API_ENDPOINTS.AUTH.CONFIRM_LOGIN}`,
        { otp },
        { withCredentials: true }
      )
      .pipe(
        tap((response) => {
          console.log('🔵 Confirm login response:', response);
          this.handleAuthSuccess(response);
        }),
        catchError(this.handleError.bind(this))
      );
  }

  // ==========================================
  // SOCIAL LOGIN METHODS
  // ==========================================

  loginWithGmail(socialData: SocialLoginData): Observable<any> {
    return this.http
      .post(`${this.API_URL}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`, {
        idToken: socialData.token,
      })
      .pipe(
        tap((response: any) => {
          console.log('🔵 Google login response:', response);
          if (response.data?.accessToken) {
            this.handleAuthSuccess(response);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  registerWithGmail(socialData: SocialLoginData): Observable<any> {
    return this.http
      .post(`${this.API_URL}${API_ENDPOINTS.AUTH.GOOGLE_REGISTER}`, {
        idToken: socialData.token,
        ...socialData.userData,
      })
      .pipe(
        tap((response: any) => {
          console.log('🔵 Google register response:', response);
          if (response.data?.accessToken) {
            this.handleAuthSuccess(response);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  loginWithFacebook(socialData: SocialLoginData): Observable<any> {
    return this.http
      .post(`${this.API_URL}${API_ENDPOINTS.AUTH.FACEBOOK_LOGIN}`, {
        accessToken: socialData.token,
      })
      .pipe(
        tap((response: any) => {
          console.log('🔵 Facebook login response:', response);
          if (response.data?.accessToken) {
            this.handleAuthSuccess(response);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  registerWithFacebook(socialData: SocialLoginData): Observable<any> {
    return this.http
      .post(`${this.API_URL}${API_ENDPOINTS.AUTH.FACEBOOK_REGISTER}`, {
        accessToken: socialData.token,
        ...socialData.userData,
      })
      .pipe(
        tap((response: any) => {
          console.log('🔵 Facebook register response:', response);
          if (response.data?.accessToken) {
            this.handleAuthSuccess(response);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  socialAuth(data: SocialLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`, data, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          if (response.data?.accessToken) {
            this.handleAuthSuccess(response);
          }
        }),
        catchError(this.handleError.bind(this))
      );
  }

  // ==========================================
  // REGISTER & OTHER METHODS
  // ==========================================

  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${this.API_URL}${API_ENDPOINTS.AUTH.REGISTER}`, data, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  verifyEmail(data: { otp: string }): Observable<any> {
    return this.http
      .post(`${this.API_URL}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}`, data, {
        headers: new HttpHeaders().set('Content-Type', 'application/json'),
        withCredentials: true,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  resendVerificationEmail(data: { email: string }): Observable<any> {
    return this.http
      .post(`${this.API_URL}${API_ENDPOINTS.AUTH.RESEND_VERIFICATION}`, data, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  logout(): Observable<any> {
    const token = this.getAccessToken();

    return this.http
      .post(
        `${this.API_URL}${API_ENDPOINTS.AUTH.LOGOUT}`,
        { flag: 'all' },
        {
          headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
        }
      )
      .pipe(
        tap(() => {
          this.clearAuthData();
          this.router.navigate(['/auth/login']);
        }),
        catchError((error) => {
          this.clearAuthData();
          this.router.navigate(['/auth/login']);
          return throwError(() => error);
        })
      );
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<any> {
    return this.http
      .post(`${this.API_URL}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, data, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  resetPassword(data: ResetPasswordRequest): Observable<any> {
    return this.http
      .post(`${this.API_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, data, {
        withCredentials: true,
      })
      .pipe(catchError(this.handleError.bind(this)));
  }
  setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    this.refreshTokenSubject.next(token);
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Send refresh token in the Authorization header
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshToken}`, // Send refresh token as Bearer token
    });

    return this.http
      .post<any>(
        `${this.API_URL}/auth/refresh`,
        {}, // Empty body, token is in header
        { headers }
      )
      .pipe(
        tap((response) => {
          // Save the new access token
          if (response.data?.accessToken) {
            this.setAccessToken(response.data.accessToken);
          } else if (response.accessToken) {
            this.setAccessToken(response.accessToken);
          }

          // If a new refresh token is provided, update it
          if (response.data?.refreshToken) {
            this.setRefreshToken(response.data.refreshToken);
          } else if (response.refreshToken) {
            this.setRefreshToken(response.refreshToken);
          }
        })
      );
  }

  socialSignOut(): Observable<void> {
    return from(this.socialAuthService.signOut());
  }

  redirectToDashboard(): void {
    const role = this.getUserRole();
    console.log('🔵 Redirecting to dashboard, role:', role);

    switch (role) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'publisher':
        this.router.navigate(['/dashboard/publisher']);
        break;
      case 'user':
        this.router.navigate(['/home']);
        break;
      default:
        console.warn('⚠️ Unknown role, redirecting to home');
        this.router.navigate(['/']);
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ An error occurred:', error);
    return throwError(() => error);
  }

  // DEPRECATED - Keeping for backwards compatibility but not used
  setCurrentUser(user: IUser): void {
    console.warn('⚠️ setCurrentUser is deprecated. User is now extracted from token.');
    // Do nothing - user comes from token now
  }
}
