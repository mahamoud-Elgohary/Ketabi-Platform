import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap, filter, take, retry, delay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip auth for public endpoints
  if (isPublicAuthEndpoint(req.url)) {
    return next(req);
  }

  // Add token to request
  if (!req.url.includes('/auth/refresh')) {
    const accessToken = authService.getAccessToken();
    if (accessToken) {
      req = addTokenToRequest(req, accessToken);
    }
  } else {
    const refreshToken = authService.getRefreshToken();
    if (refreshToken) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${refreshToken}`,
        },
      });
    }
  }

  return next(req).pipe(
    // Add retry logic for network errors (but not for auth errors)
    retry({
      count: 1,
      delay: (error) => {
        // Only retry on network errors, not auth errors
        if (error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500)) {
          console.log('🔄 Retrying request after network error');
          return of(error).pipe(delay(1000));
        }
        throw error;
      },
    }),
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        // Handle 401 - Unauthorized
        if (error.status === 401) {
          // If refresh token request failed, force logout
          if (req.url.includes('/auth/refresh')) {
            console.log('❌ Refresh token failed');
            isRefreshing = false;
            authService.clearAuthData();
            router.navigate(['/auth/login'], {
              queryParams: { reason: 'session_expired' },
            });
            return throwError(() => new Error('Refresh token expired'));
          }

          // Try to refresh the token
          return handle401Error(req, next, authService, router);
        }

        // Handle 403 - Forbidden
        if (error.status === 403) {
          const errorMessage = error.error?.message || '';

          if (
            errorMessage.includes('User not found') ||
            errorMessage.includes('User is inactive') ||
            errorMessage.includes('User deleted') ||
            error.error?.userDeleted
          ) {
            console.log('❌ User account issue detected');
            handleUserDeletion(authService, router);
            return throwError(() => new Error('User account no longer exists'));
          }
        }

        // Handle user deletion signals
        if (error.error?.shouldLogout || error.error?.userDeleted) {
          console.log('❌ User session invalidated');
          handleUserDeletion(authService, router);
          return throwError(() => new Error('User session invalidated'));
        }

        // Handle network errors gracefully
        if (error.status === 0) {
          console.error('❌ Network error - server may be down');
          // Don't log out on network errors
          return throwError(() => new Error('Network error - please check your connection'));
        }
      }

      return throwError(() => error);
    })
  );
};

function addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function handle401Error(
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();

    if (!refreshToken) {
      console.log('❌ No refresh token available');
      isRefreshing = false;
      authService.clearAuthData();
      router.navigate(['/auth/login']);
      return throwError(() => new Error('No refresh token available'));
    }

    console.log('🔄 Attempting to refresh token...');

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newAccessToken = response.data?.accessToken || response.accessToken;

        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }

        console.log('✅ Token refreshed successfully');
        refreshTokenSubject.next(newAccessToken);
        authService.setTokens(newAccessToken, response.data?.refreshToken || response.refreshToken);

        // Retry the original request with new token
        return next(addTokenToRequest(req, newAccessToken));
      }),
      catchError((err) => {
        console.error('❌ Token refresh failed:', err);
        isRefreshing = false;

        if (err instanceof HttpErrorResponse) {
          const errorMessage = err.error?.message || '';
          if (
            errorMessage.includes('User not found') ||
            errorMessage.includes('User deleted') ||
            err.error?.userDeleted
          ) {
            handleUserDeletion(authService, router);
            return throwError(() => new Error('User account deleted'));
          }
        }

        authService.clearAuthData();
        router.navigate(['/auth/login'], {
          queryParams: { reason: 'session_expired' },
        });
        return throwError(() => err);
      })
    );
  } else {
    // Wait for the token refresh to complete
    console.log('⏳ Waiting for token refresh...');
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next(addTokenToRequest(req, token!)))
    );
  }
}

function handleUserDeletion(authService: AuthService, router: Router): void {
  console.log('🔴 Handling user deletion/deactivation');
  isRefreshing = false;
  refreshTokenSubject.next(null);
  authService.clearAuthData();
  router.navigate(['/auth/login'], {
    queryParams: { reason: 'account_deleted' },
  });
}

function isPublicAuthEndpoint(url: string): boolean {
  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/google-login',
    '/auth/facebook-login',
    '/auth/verify-email',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/confirm-login',
  ];
  return publicEndpoints.some((endpoint) => url.includes(endpoint));
}
