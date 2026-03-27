import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ForgotPasswordFormComponent } from '../../components/ForgetPassword-form/forget-password-form.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ForgotPasswordFormComponent],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css'],
})
export class ForgotPasswordComponent implements OnInit {
  @ViewChild(ForgotPasswordFormComponent) formComponent!: ForgotPasswordFormComponent;

  // State passed to child component
  isLoading = false;
  errorMessage = '';
  currentStep: 'email' | 'success' | 'reset' | 'complete' = 'email';

  // Store email for reset step
  private storedEmail = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check if user came from email link with token (optional implementation)
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        // If email is in URL, user clicked link from email
        this.storedEmail = params['email'];
        this.currentStep = 'reset';

        if (this.formComponent) {
          this.formComponent.setEmail(params['email']);
        }
      }
    });
  }

  getTitle(): string {
    switch (this.currentStep) {
      case 'email':
        return 'Forgot Password';
      case 'success':
        return 'Check Your Email';
      case 'reset':
        return 'Reset Password';
      case 'complete':
        return 'Success';
      default:
        return 'Forgot Password';
    }
  }

  // Handle email submission from child component
  onSubmitEmail(email: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.storedEmail = email;

    this.authService.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Backend sends OTP to email and creates session
        // Move to success step to show "check your email" message
        this.currentStep = 'success';

        // Pass email to form component
        if (this.formComponent) {
          this.formComponent.setEmail(email);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.handleError(error);
      },
    });
  }

  // Handle resend email from child component
  onResendEmail() {
    if (!this.storedEmail) {
      this.errorMessage = 'Email not found. Please start over.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.forgotPassword({ email: this.storedEmail }).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Success message handled by form component timer
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to resend email. Please try again.';
      },
    });
  }

  // Handle moving to reset step (when user clicks "I have the OTP")
  onMoveToResetStep() {
    this.currentStep = 'reset';
    this.errorMessage = '';
  }

  // Handle password reset submission from child component
  onSubmitReset(data: { newPassword: string; confirmPassword: string; otp: string }) {
    if (!data.otp || data.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP code';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .resetPassword({
        otp: data.otp,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.currentStep = 'complete';
        },
        error: (error) => {
          this.isLoading = false;
          this.handleError(error);
        },
      });
  }

  // Handle navigation back to login
  onBackToLogin() {
    this.router.navigate(['/auth/login']);
  }

  // Handle navigation to login after successful reset
  onGoToLogin() {
    this.router.navigate(['/auth/login']);
  }

  // Error handling
  private handleError(error: any) {
    const status = error.status;
    const message = error.error?.message;

    switch (status) {
      case 404:
        this.errorMessage = 'Email address not found';
        break;
      case 400:
        if (message?.includes('expired')) {
          this.errorMessage = 'OTP has expired. Please request a new one.';
        } else if (message?.includes('Invalid OTP')) {
          this.errorMessage = 'Invalid OTP code. Please check and try again.';
        } else {
          this.errorMessage = message || 'Invalid request. Please try again.';
        }
        break;
      case 429:
        this.errorMessage = 'Too many attempts. Please try again later.';
        break;
      case 500:
        this.errorMessage = 'Server error. Please try again later.';
        break;
      default:
        this.errorMessage = message || 'An error occurred. Please try again.';
    }

    console.error('Forgot password error:', error);
  }
}
