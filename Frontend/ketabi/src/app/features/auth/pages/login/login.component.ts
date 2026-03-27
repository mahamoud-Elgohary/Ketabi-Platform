import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest, SocialLoginEvent } from '../../models/login.model';
import { AuthResponse } from '../../models/auth-response.model';
import { LoginFormComponent } from '../../components/login-form/login-form.component';
import { SocialLoginData } from '../../components/register-form/register-form.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, LoginFormComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginPageComponent implements OnDestroy {
  // State passed to child component
  isLoading = false;
  errorMessage = '';
  showOtpInput = false;

  // OTP timer management
  otpTimer = 0;
  private otpTimerInterval: any;

  // Temporary storage for credentials (needed for OTP resend)
  private lastCredentials?: LoginRequest;

  constructor(private authService: AuthService, private router: Router) {
    this.checkExistingSession();
  }

  ngOnDestroy() {
    this.clearOtpTimer();
  }

  // Check if user is already logged in
  private checkExistingSession() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  // Handle login submission from child component
  onLoginSubmit(credentials: { email: string; password: string }) {
    this.isLoading = true;
    this.errorMessage = '';
    this.lastCredentials = credentials; // Store for potential resend

    this.authService.login(credentials).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;
        this.handleLoginSuccess(response);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.handleLoginError(error);
      },
    });
  }

  // Handle OTP submission from child component
  onOtpSubmit(otp: string) {
    if (!otp || otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit code';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.confirmLogin(otp).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;
        this.handleLoginSuccess(response);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Invalid OTP. Please try again.';
      },
    });
  }

  // Handle resend OTP from child component
  onResendOtp() {
    if (this.otpTimer > 0) {
      return; // Still in cooldown
    }

    if (!this.lastCredentials) {
      this.errorMessage = 'Cannot resend OTP. Please try logging in again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.lastCredentials).subscribe({
      next: () => {
        this.isLoading = false;
        this.startOtpTimer();
        // Optionally show success message
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to resend code. Please try again.';
      },
    });
  }

  onSocialLogin(event: SocialLoginEvent) {
    const { token, userData, provider } = event;

    // Validate token
    if (!token) {
      this.errorMessage = 'No authentication token received. Please try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('Social login attempt:', {
      provider,
      hasToken: !!token,
      tokenLength: token?.length,
      userData: userData,
    });

    const loginData = { provider, token, userData };

    // First, try to login
    const loginEndpoint =
      provider === 'google'
        ? this.authService.loginWithGmail(loginData)
        : this.authService.loginWithFacebook(loginData);

    loginEndpoint.subscribe({
      next: (response) => {
        console.log('Login successful - User exists:', response);
        this.handleSuccessfulAuth(response, false);
      },
      error: (loginError) => {
        console.log('User not found, attempting registration...', loginError);

        // If user doesn't exist (404 or 401), create new account
        if (loginError.status === 404 || loginError.status === 401) {
          this.registerNewUser(token, userData, provider);
        } else if (
          loginError.status === 400 &&
          loginError.error?.message?.includes('verifyIdToken')
        ) {
          // Handle invalid token error specifically
          this.isLoading = false;
          this.errorMessage = 'Invalid authentication token. Please try signing in again.';
          console.error('Token verification failed:', loginError);
        } else {
          // Handle other errors
          console.error('Login error:', loginError);
          this.isLoading = false;
          this.errorMessage =
            loginError.error?.message || 'An error occurred during login. Please try again.';
        }
      },
    });
  }
  // Replace the registerNewUser method in your login-page.component.ts

  registerNewUser(token: string, userData: any, provider: 'google' | 'facebook') {
    // Normalize user data into a userData payload expected by the backend
    let userPayload;

    if (provider === 'google') {
      userPayload = {
        email: userData.email || '',
        name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        photoUrl: userData.photoUrl || '',
      };
    } else {
      // Facebook
      const firstName = userData.first_name || userData.firstName || '';
      const lastName = userData.last_name || userData.lastName || '';
      const fullName = userData.name || `${firstName} ${lastName}`.trim();

      userPayload = {
        email: userData.email || '',
        name: fullName,
        firstName: firstName,
        lastName: lastName,
        photoUrl: userData.picture?.data?.url || userData.photoUrl || '',
      };
    }

    // Build SocialLoginData-shaped payload: { provider, token, userData }
    const socialPayload: SocialLoginData = {
      provider,
      token,
      userData: userPayload,
    };

    const registerEndpoint =
      provider === 'google'
        ? this.authService.registerWithGmail(socialPayload)
        : this.authService.registerWithFacebook(socialPayload);

    registerEndpoint.subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.handleSuccessfulAuth(response, true);
      },
      error: (regError) => {
        console.log('Registration error:', regError);
        this.isLoading = false;

        // Provide more specific error messages
        const errorMessage = regError.error?.message || 'Registration failed. Please try again.';
        this.errorMessage = errorMessage;

        console.error('Full registration error:', regError);
      },
    });
  }

  // Also update the onSocialLogin method for better error handling

  // Process successful login response

  // Process login errors
  private handleLoginError(error: any) {
    this.isLoading = false;
    const status = error.status;
    const message = error.error?.message;

    switch (status) {
      case 401:
        this.errorMessage = 'Invalid Credentials. Please try again.';
        break;
      case 403:
        this.errorMessage = 'Account is locked. Please contact support.';
        break;
      case 404:
        this.errorMessage = 'Account not found';
        break;
      case 429:
        this.errorMessage = 'Too many attempts. Please try again later.';
        break;
      case 500:
        this.errorMessage = 'Server error. Please try again later.';
        break;
      default:
        this.errorMessage = message || 'Login failed. Please try again.';
    }

    // Log error for debugging
    console.error('Login error:', error);
  }

  // Start OTP resend timer
  private startOtpTimer() {
    this.clearOtpTimer();
    this.otpTimer = 60;

    this.otpTimerInterval = setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.clearOtpTimer();
      }
    }, 1000);
  }

  // Clear OTP timer
  private clearOtpTimer() {
    if (this.otpTimerInterval) {
      clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = null;
    }
  }

  handleSuccessfulAuth(response: AuthResponse, isNewUser: boolean) {
    console.log('Full response:', JSON.stringify(response, null, 2));

    // Add this line to manually check
    setTimeout(() => {
      console.log('After 1 second - User:', this.authService.getCurrentUser());
    }, 1000);

    this.authService.redirectToDashboard();
  }

  // Also update the regular login success handler
  private handleLoginSuccess(response: AuthResponse) {
    if (response.data?.accessToken) {
      // AuthService already handled everything via tap operator
      this.authService.redirectToDashboard();
    } else {
      // OTP required
      this.showOtpInput = true;
      this.startOtpTimer();
    }
  }
}
