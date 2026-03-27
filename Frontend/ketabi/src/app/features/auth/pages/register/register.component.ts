// Updated register-page.component.ts with auto-registration for social login

import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest } from '../../models/login.model';
import { RegisterResponse, AuthResponse } from '../../models/auth-response.model';
import {
  RegisterFormComponent,
  UserData,
  SocialLoginData,
} from '../../components/register-form/register-form.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, RegisterFormComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterPageComponent implements OnDestroy {
  // State passed to child component
  isLoading = false;
  errorMessage = '';
  showOtpInput = false;
  validationErrors: string[] = [];

  // OTP timer management
  otpTimer = 0;
  private otpTimerInterval: any;

  // Temporary storage for user data (needed for OTP resend)
  private lastUserData?: UserData;

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

  // Handle registration submission from child component
  onRegisterSubmit(userData: UserData) {
    this.isLoading = true;
    this.errorMessage = '';
    this.validationErrors = [];
    this.lastUserData = userData; // Store for potential OTP resend

    // Prepare registration request
    const registerRequest: RegisterRequest = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      phone: userData.phone,
      gender: userData.gender,
    };

    this.authService.register(registerRequest).subscribe({
      next: (response: RegisterResponse) => {
        this.isLoading = false;
        this.handleRegisterSuccess(response);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.handleRegisterError(error);
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

    // Verify email with OTP
    this.authService.verifyEmail({ otp }).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        // Email verified successfully
        if (response.status === 'success') {
          console.log('Email verified successfully', response);
          // Redirect to login page
          this.router.navigate(['/auth/login'], {
            queryParams: { verified: 'true' },
          });
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Invalid verification code. Please try again.';
      },
    });
  }

  // Handle resend OTP
  onResendOtp() {
    if (this.otpTimer > 0) {
      return;
    }

    if (!this.lastUserData) {
      this.errorMessage = 'Cannot resend code. Please try registering again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Resend verification email
    this.authService.resendVerificationEmail({ email: this.lastUserData.email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.startOtpTimer();
        // Show success message (optional)
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to resend code. Please try again.';
      },
    });
  }

  // Handle social login from child component
  onSocialLogin(socialData: SocialLoginData) {
    // Validate token
    if (!socialData.token) {
      this.errorMessage = 'No authentication token received. Please try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    console.log('Social registration attempt:', {
      provider: socialData.provider,
      hasToken: !!socialData.token,
      tokenLength: socialData.token?.length,
      userData: socialData.userData,
    });

    // On registration page, we should try to REGISTER first (not login)
    // If user exists, we'll handle that error and redirect to login
    const registerObservable =
      socialData.provider === 'google'
        ? this.authService.registerWithGmail(socialData)
        : this.authService.registerWithFacebook(socialData);

    registerObservable.subscribe({
      next: (response: AuthResponse) => {
        console.log('Social registration successful:', response);
        this.isLoading = false;
        this.handleSocialLoginSuccess(response);
      },
      error: (error: any) => {
        console.log('Social registration error:', error);

        // If user already exists (409 conflict), try to login instead
        if (error.status === 409) {
          console.log('User already exists, attempting login...');
          this.attemptSocialLogin(socialData);
        } else if (error.status === 400 && error.error?.message?.includes('verifyIdToken')) {
          // Handle invalid token error
          this.isLoading = false;
          this.errorMessage = 'Invalid authentication token. Please try signing in again.';
          console.error('Token verification failed:', error);
        } else {
          // Handle other errors
          this.isLoading = false;
          this.handleSocialLoginError(error, socialData.provider);
        }
      },
    });
  }

  // Attempt social login if registration fails due to existing user
  private attemptSocialLogin(socialData: SocialLoginData) {
    console.log('Attempting social login for existing user...');

    const loginObservable =
      socialData.provider === 'google'
        ? this.authService.loginWithGmail(socialData)
        : this.authService.loginWithFacebook(socialData);

    loginObservable.subscribe({
      next: (response: AuthResponse) => {
        console.log('Social login successful:', response);
        this.isLoading = false;
        this.handleSocialLoginSuccess(response);
      },
      error: (error: any) => {
        console.error('Social login failed:', error);
        this.isLoading = false;

        if (error.status === 404) {
          this.errorMessage = 'Account not found. Please contact support.';
        } else {
          this.handleSocialLoginError(error, socialData.provider);
        }
      },
    });
  }

  // Process successful registration response
  private handleRegisterSuccess(response: RegisterResponse) {
    console.log('Registration response:', response);

    // Show OTP input after successful registration
    this.showOtpInput = true;
    this.startOtpTimer();
  }

  // Process successful social login/registration
  private handleSocialLoginSuccess(response: AuthResponse) {
    if (response.data?.accessToken) {
      // Store tokens
      this.authService.setTokens(response.data.accessToken, response.data.refreshToken);

      // Store user data
      if (response.data.user) {
        this.authService.setCurrentUser(response.data.user);
      }

      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = 'Authentication failed. Please try again.';
    }
  }

  // Process registration errors
  private handleRegisterError(error: any) {
    this.isLoading = false;
    const status = error.status;
    const message = error.error?.message;
    const errors = error.error?.errors;

    // Handle validation errors
    if (errors && Array.isArray(errors)) {
      this.validationErrors = errors;
      this.errorMessage = 'Please fix the following errors:';
      return;
    }

    // Handle specific error codes
    switch (status) {
      case 400:
        this.errorMessage = message || 'Invalid registration data';
        break;
      case 409:
        this.errorMessage = 'Email already exists. Please use a different email or login.';
        break;
      case 422:
        this.errorMessage = message || 'Validation failed';
        if (errors) {
          this.validationErrors = Array.isArray(errors)
            ? errors
            : (Object.values(errors).flat() as string[]);
        }
        break;
      case 429:
        this.errorMessage = 'Too many requests. Please try again later.';
        break;
      case 500:
        this.errorMessage = 'Server error. Please try again later.';
        break;
      default:
        this.errorMessage = message || 'Registration failed. Please try again.';
    }

    console.error('Registration error:', error);
  }

  // Process social login errors
  private handleSocialLoginError(error: any, provider: string) {
    const status = error.status;
    const message = error.error?.message;

    switch (status) {
      case 400:
        if (message?.includes('verifyIdToken')) {
          this.errorMessage = `Invalid ${provider} token. Please try again.`;
        } else {
          this.errorMessage = message || `Invalid ${provider} authentication.`;
        }
        break;
      case 409:
        this.errorMessage = `This ${provider} account is already linked to another user.`;
        break;
      case 422:
        this.errorMessage = `Invalid ${provider} credentials.`;
        break;
      default:
        this.errorMessage = message || `${provider} sign-in failed. Please try again.`;
    }

    console.error(`${provider} login error:`, error);
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
}
