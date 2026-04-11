import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FacebookLoginProvider,
  GoogleLoginProvider,
  GoogleSigninButtonModule,
  SocialAuthService,
  SocialUser,
} from '@abacritt/angularx-social-login';
import { Subscription } from 'rxjs';

export interface UserData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  gender: string;
}

export interface SocialLoginData {
  provider: 'google' | 'facebook';
  token: string;
  userData: {
    email: string;
    name: string;
    photoUrl?: string;
    firstName?: string;
    lastName?: string;
  };
}

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GoogleSigninButtonModule],
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.css'],
})
export class RegisterFormComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() isLoading = false;
  @Input() errorMessage = '';
  @Input() showOtpInput = false;
  @Input() validationErrors: string[] = [];

  // Outputs to parent (register-page)
  @Output() submitRegister = new EventEmitter<UserData>();
  @Output() submitOtp = new EventEmitter<string>();
  @Output() resendOtpClick = new EventEmitter<void>();
  @Output() socialLogin = new EventEmitter<SocialLoginData>();

  // Local form state (UI only)
  showPassword = false;
  showConfirmPassword = false;
  acceptTerms = false;

  userData: UserData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
  };

  // OTP properties
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpError: string = '';
  resendTimer: number = 0;
  private resendInterval: any;
  private authStateSubscription?: Subscription;

  // ViewChild references for OTP inputs
  @ViewChild('otp0') otp0!: ElementRef;
  @ViewChild('otp1') otp1!: ElementRef;
  @ViewChild('otp2') otp2!: ElementRef;
  @ViewChild('otp3') otp3!: ElementRef;
  @ViewChild('otp4') otp4!: ElementRef;
  @ViewChild('otp5') otp5!: ElementRef;

  constructor(private socialAuthService: SocialAuthService) {}

  ngOnInit() {
    // Subscribe to social auth state changes (auto-detect when user signs in)
    this.authStateSubscription = this.socialAuthService.authState.subscribe({
      next: (user: SocialUser) => {
        if (user) {
          console.log('Social user detected:', user);
          this.handleSocialUser(user);
        }
      },
      error: (error) => {
        console.error('Auth state error:', error);
      },
    });
  }

  ngAfterViewInit() {
    // Auto-focus first OTP input when OTP section appears
    if (this.showOtpInput) {
      this.focusFirstOtpInput();
    }
  }

  ngOnDestroy() {
    // Clean up timer interval
    this.clearResendTimer();

    // Clean up auth state subscription
    if (this.authStateSubscription) {
      this.authStateSubscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Focus first OTP input when showOtpInput changes to true
    if (changes['showOtpInput'] && this.showOtpInput) {
      setTimeout(() => this.focusFirstOtpInput(), 200);
    }
  }

  // Handle social user from auth state
  private handleSocialUser(user: SocialUser) {
    const provider = (user.provider ?? '').toLowerCase() as 'google' | 'facebook';
    const socialData: SocialLoginData = {
      provider: provider,
      token: user.idToken || user.authToken || '',
      userData: {
        email: user.email || '',
        name: user.name || '',
        photoUrl: user.photoUrl || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      },
    };

    this.socialLogin.emit(socialData);
  }

  // Toggle password visibility
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Toggle confirm password visibility
  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Get password strength
  getPasswordStrength(): string {
    const password = this.userData.password;
    if (!password) return '';

    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }

  // Get password strength text
  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'weak':
        return 'Weak';
      case 'medium':
        return 'Medium';
      case 'strong':
        return 'Strong';
      default:
        return '';
    }
  }

  // Handle registration form submission
  onSubmit() {
    if (!this.acceptTerms) {
      this.errorMessage = 'Please accept the terms and conditions';
      return;
    }

    if (this.userData.password !== this.userData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    // Emit to parent - don't call services directly
    this.submitRegister.emit({
      name: this.userData.name,
      email: this.userData.email,
      password: this.userData.password,
      confirmPassword: this.userData.confirmPassword,
      phone: this.userData.phone,
      gender: this.userData.gender,
    });
  }

  signInWithGoogle(): void {
    this.socialAuthService
      .signIn(GoogleLoginProvider.PROVIDER_ID)
      .then((user: SocialUser) => {
        console.log('Google sign-in successful:', user);
        console.log('ID Token:', user.idToken);
        console.log('Auth Token:', user.authToken);

        // Validate that we have an ID token
        if (!user.idToken) {
          console.error('No ID token received from Google');
          alert('Failed to get authentication token from Google. Please try again.');
          return;
        }

        // Emit the event to parent component
        this.socialLogin.emit({
          token: user.idToken, // Use idToken for Google
          userData: {
            email: user.email || '',
            name: user.name || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            photoUrl: user.photoUrl || '',
          },
          provider: 'google',
        });
      })
      .catch((error) => {
        console.error('Google sign-in error:', error);

        if (
          error &&
          (error.error === 'popup_closed_by_user' ||
            error.error === 'popup_blocked_by_browser' ||
            error.message?.includes('popup') ||
            error.message?.includes('blocked'))
        ) {
          alert(
            'Popup was blocked! Please disable your popup blocker or ad blocker and try again.'
          );
        } else {
          alert('Google sign-in failed. Please try again or use email registration.');
        }
      });
  }

  signInWithFacebook(): void {
    this.socialAuthService
      .signIn(FacebookLoginProvider.PROVIDER_ID)
      .then((user: SocialUser) => {
        console.log('Facebook sign-in successful:', user);
        console.log('Auth Token:', user.authToken);

        // Validate that we have an auth token
        if (!user.authToken) {
          console.error('No auth token received from Facebook');
          alert('Failed to get authentication token from Facebook. Please try again.');
          return;
        }

        this.socialLogin.emit({
          token: user.authToken, // Use authToken for Facebook
          userData: {
            email: user.email || '',
            name: user.name || '',
            photoUrl: user.photoUrl || '',
            lastName: user.lastName || '',
            firstName: user.firstName || '',
          },
          provider: 'facebook',
        });
      })
      .catch((error) => {
        console.error('Facebook sign-in error:', error);
        alert('Facebook sign-in failed. Please try again or use email registration.');
      });
  }

  // Also update the handleSocialUser method for the authState subscription


  // Handle social login errors with user-friendly messages
  private handleSocialLoginError(error: any, provider: string) {
    if (
      error &&
      (error.error === 'popup_closed_by_user' ||
        error.error === 'popup_blocked_by_browser' ||
        error.message?.includes('popup') ||
        error.message?.includes('blocked'))
    ) {
      this.errorMessage = 'Popup was blocked! Please disable your popup blocker and try again.';
    } else if (error.error === 'idpiframe_initialization_failed') {
      this.errorMessage =
        'Third-party cookies are blocked. Please enable them in your browser settings.';
    } else {
      this.errorMessage = `${provider} sign-in failed. Please try again or use email registration.`;
    }
  }

  // OTP Input handling
  onOtpInput(event: any, index: number) {
    const input = event.target;
    let value = input.value;

    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) {
      this.otpDigits[index] = '';
      input.value = '';
      return;
    }

    // If user types more than one character, take only the first
    if (value.length > 1) {
      value = value[0];
      this.otpDigits[index] = value;
      input.value = value;
    }

    // Move to next input if value entered
    if (value && index < 5) {
      const nextInput = this.getOtpInput(index + 1);
      nextInput?.focus();
    }

    // Auto-submit when all digits are entered
    if (this.isOtpComplete()) {
      setTimeout(() => this.onOtpSubmit(), 100);
    }

    this.otpError = '';
  }

  // Handle keyboard navigation in OTP inputs
  onOtpKeyDown(event: KeyboardEvent, index: number) {
    // Handle backspace
    if (event.key === 'Backspace') {
      event.preventDefault();

      if (this.otpDigits[index]) {
        // Clear current field
        this.otpDigits[index] = '';
      } else if (index > 0) {
        // Move to previous field and clear it
        this.otpDigits[index - 1] = '';
        const prevInput = this.getOtpInput(index - 1);
        prevInput?.focus();
      }
    }

    // Handle left arrow
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      const prevInput = this.getOtpInput(index - 1);
      prevInput?.focus();
    }

    // Handle right arrow
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      const nextInput = this.getOtpInput(index + 1);
      nextInput?.focus();
    }

    // Handle Enter key
    if (event.key === 'Enter' && this.isOtpComplete()) {
      event.preventDefault();
      this.onOtpSubmit();
    }
  }

  // Handle paste in OTP inputs
  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6);

    // Fill OTP digits
    digits.forEach((digit, index) => {
      if (index < 6) {
        this.otpDigits[index] = digit;
      }
    });

    // Focus last filled input or last input
    const lastIndex = Math.min(digits.length - 1, 5);
    const lastInput = this.getOtpInput(lastIndex);
    lastInput?.focus();

    // Auto-submit if complete
    if (this.isOtpComplete()) {
      setTimeout(() => this.onOtpSubmit(), 100);
    }

    this.otpError = '';
  }

  // Get OTP input element by index
  private getOtpInput(index: number): HTMLInputElement | null {
    const inputs = [this.otp0, this.otp1, this.otp2, this.otp3, this.otp4, this.otp5];
    return inputs[index]?.nativeElement || null;
  }

  // Focus first OTP input
  private focusFirstOtpInput() {
    setTimeout(() => {
      const firstInput = this.getOtpInput(0);
      firstInput?.focus();
    }, 100);
  }

  // Check if all OTP digits are filled
  isOtpComplete(): boolean {
    return this.otpDigits.every((digit) => digit !== '');
  }

  // Get complete OTP code as string
  getOtpCode(): string {
    return this.otpDigits.join('');
  }

  // Handle OTP submission
  onOtpSubmit() {
    if (!this.isOtpComplete()) {
      this.otpError = 'Please enter all 6 digits';
      return;
    }

    const otpCode = this.getOtpCode();
    this.submitOtp.emit(otpCode);
  }

  // Handle resend OTP with countdown
  onResendOtp(event: Event) {
    event.preventDefault();

    if (this.resendTimer > 0) return;

    // Start 60-second countdown
    this.startResendTimer();

    // Clear current OTP
    this.resetOtpInputs();

    // Emit to parent
    this.resendOtpClick.emit();
  }

  // Start resend timer
  private startResendTimer() {
    this.clearResendTimer();
    this.resendTimer = 60;
    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        this.clearResendTimer();
      }
    }, 1000);
  }

  // Clear resend timer
  private clearResendTimer() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendInterval = null;
    }
  }

  // Clear error
  clearError() {
    this.errorMessage = '';
    this.otpError = '';
    this.validationErrors = [];
  }

  // Reset OTP inputs
  private resetOtpInputs() {
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpError = '';
    this.focusFirstOtpInput();
  }

  // Reset OTP state (call this from parent if needed)
  resetOtp() {
    this.resetOtpInputs();
    this.clearResendTimer();
    this.resendTimer = 0;
  }

  // Handle back to registration form
  backToRegister(event: Event) {
    event.preventDefault();
    this.showOtpInput = false;
    this.resetOtp();
    this.errorMessage = '';
  }
}
