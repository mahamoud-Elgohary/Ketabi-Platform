import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnInit,
  OnChanges,
  SimpleChanges,
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
import { SocialLoginEvent } from '../../models/login.model';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, GoogleSigninButtonModule],
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
})
export class LoginFormComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() isLoading = false;
  @Input() errorMessage = '';
  @Input() showOtpInput = false;

  @Output() submitLogin = new EventEmitter<{ email: string; password: string }>();
  @Output() submitOtp = new EventEmitter<string>();
  @Output() resendOtpClick = new EventEmitter<void>();
  @Output() socialLogin = new EventEmitter<SocialLoginEvent>();

  // Local form state (UI only)
  showPassword = false;
  rememberMe = false;

  credentials = {
    email: '',
    password: '',
  };

  // OTP properties
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpError: string = '';
  resendTimer: number = 0;
  private resendInterval: any;

  // ViewChild references for OTP inputs
  @ViewChild('otp0') otp0!: ElementRef;
  @ViewChild('otp1') otp1!: ElementRef;
  @ViewChild('otp2') otp2!: ElementRef;
  @ViewChild('otp3') otp3!: ElementRef;
  @ViewChild('otp4') otp4!: ElementRef;
  @ViewChild('otp5') otp5!: ElementRef;

  ngOnInit() {
    // Load remembered email from localStorage (UI concern)
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.credentials.email = rememberedEmail;
      this.rememberMe = true;
    }
  }
  constructor(private socialAuthService: SocialAuthService) {
    this.socialAuthService.authState.subscribe((user) => {
      if (user) {
        this.handleSocialUser(user);
      }
    });
  }
  handleGoogleLogin() {
    // Don't call signIn() - the button handles it automatically
    // The authState subscription above will catch the login
  }
  private handleSocialUser(user: any) {
    const provider = user.provider === 'GOOGLE' ? 'google' : 'facebook';

    this.socialLogin.emit({
      token: user.idToken || user.authToken,
      userData: user,
      provider: provider as 'google' | 'facebook',
    });
  }
  ngAfterViewInit() {
    // Auto-focus first OTP input when OTP section appears
    if (this.showOtpInput) {
      setTimeout(() => this.otp0?.nativeElement?.focus(), 100);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Watch for showOtpInput changes to auto-focus
    if (changes['showOtpInput'] && changes['showOtpInput'].currentValue) {
      setTimeout(() => this.otp0?.nativeElement?.focus(), 200);
    }
  }

  ngOnDestroy() {
    // Clean up timer interval
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  // Toggle password visibility
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // Handle login form submission
  onSubmit() {
    if (this.rememberMe) {
      localStorage.setItem('rememberedEmail', this.credentials.email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }
    this.submitLogin.emit({
      email: this.credentials.email,
      password: this.credentials.password,
    });
  }

  // OTP Input handling
  onOtpInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    // Only allow numbers
    if (value && !/^[0-9]$/.test(value)) {
      this.otpDigits[index] = '';
      return;
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
      if (!this.otpDigits[index] && index > 0) {
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
  }

  // Handle paste in OTP inputs
  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').split('').slice(0, 6);

    digits.forEach((digit, index) => {
      this.otpDigits[index] = digit;
    });

    // Focus last filled input or last input
    const lastIndex = Math.min(digits.length, 5);
    const lastInput = this.getOtpInput(lastIndex);
    lastInput?.focus();

    // Auto-submit if complete
    if (this.isOtpComplete()) {
      setTimeout(() => this.onOtpSubmit(), 100);
    }

    this.otpError = '';
  }

  // Get OTP input element by index
  getOtpInput(index: number): HTMLInputElement | null {
    const inputs = [this.otp0, this.otp1, this.otp2, this.otp3, this.otp4, this.otp5];
    return inputs[index]?.nativeElement || null;
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
    this.resendTimer = 60;
    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);

    // Clear current OTP
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpError = '';

    // Focus first input
    setTimeout(() => this.otp0?.nativeElement?.focus(), 100);

    // Emit to parent
    this.resendOtpClick.emit();
  }

  signInWithGoogle(): void {
    this.socialAuthService
      .signIn(GoogleLoginProvider.PROVIDER_ID)
      .then((user: SocialUser) => {
        console.log('Google sign-in successful:', user);

        // Emit the event to parent component
        this.socialLogin.emit({
          token: user.idToken ? user.idToken : '',
          userData: {
            email: user.email ? user.email : '',
            name: user.name ? user.name : '',
            firstName: user.firstName ? user.firstName : '',
            lastName: user.lastName ? user.lastName : '',
            photoUrl: user.photoUrl ? user.photoUrl : '',
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

        this.socialLogin.emit({
          token: user.authToken ? user.authToken : '',
          userData: {
            email: user.email ? user.email : '',
            name: user.name ? user.name : '',
            photoUrl: user.photoUrl ? user.photoUrl : '',
            lastName: user.lastName ? user.lastName : '',
            firstName: user.firstName ? user.firstName : '',
          },
          provider: 'facebook',
        });
      })
      .catch((error) => {
        console.error('Facebook sign-in error:', error);
        alert('Facebook sign-in failed. Please try again or use email registration.');
      });
  }

  // Clear error (optional)
  clearError() {
    this.errorMessage = '';
    this.otpError = '';
  }

  // Reset OTP state (call this from parent if needed)
  resetOtp() {
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpError = '';
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
      this.resendTimer = 0;
    }
  }

  // Handle back to login
  backToLogin(event: Event) {
    event.preventDefault();
    this.showOtpInput = false;
    this.resetOtp();
    this.errorMessage = '';
  }
}
