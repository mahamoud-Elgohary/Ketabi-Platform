import { Component, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password-form.component.html',
  styleUrls: ['./forgot-password-form.component.css'],
})
export class ForgotPasswordFormComponent implements OnDestroy {
  @Input() isLoading = false;
  @Input() errorMessage = '';
  @Input() currentStep: 'email' | 'success' | 'reset' | 'complete' = 'email';

  // Outputs to parent (page component)
  @Output() submitEmail = new EventEmitter<string>();
  @Output() resendEmail = new EventEmitter<void>();
  @Output() submitReset = new EventEmitter<{
    newPassword: string;
    confirmPassword: string;
    otp: string;
  }>();
  @Output() backToLoginClick = new EventEmitter<void>();
  @Output() goToLoginClick = new EventEmitter<void>();
  @Output() moveToResetStep = new EventEmitter<void>(); // New output

  // Local form state
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  resendTimer: number = 0;
  private resendInterval: any;

  ngOnDestroy() {
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  onSubmit() {
    this.submitEmail.emit(this.email);
  }

  onResendEmail() {
    if (this.resendTimer > 0) return;

    this.startResendTimer();
    this.resendEmail.emit();
  }

  onResetSubmit() {
    if (!this.passwordsMatch()) {
      return;
    }

    this.submitReset.emit({
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword,
      otp: this.otp,
    });
  }

  onProceedToReset() {
    this.moveToResetStep.emit();
  }

  passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword && this.newPassword.length >= 8;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  startResendTimer() {
    this.resendTimer = 60;
    this.resendInterval = setInterval(() => {
      this.resendTimer--;
      if (this.resendTimer <= 0) {
        clearInterval(this.resendInterval);
      }
    }, 1000);
  }

  backToLogin(event: Event) {
    event.preventDefault();
    this.backToLoginClick.emit();
  }

  onGoToLogin() {
    this.goToLoginClick.emit();
  }

  // Method to be called by parent to reset form
  reset() {
    this.email = '';
    this.otp = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.resendTimer = 0;
    if (this.resendInterval) {
      clearInterval(this.resendInterval);
    }
  }

  // Method to set email from parent
  setEmail(email: string) {
    this.email = email;
  }
}
