// src/app/features/auth/models/login.model.ts

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  gender?: string;
  password: string;
  confirmPassword: string;
}
export interface SocialLoginEvent {
  token: string;
  userData: {
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
  };
  provider: 'google' | 'facebook';
}
export interface SocialRegisterEvent {
  token: string;
  userData: {
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
  };
  provider: 'google' | 'facebook';
}

/**
 * OTP confirmation request
 */
export interface OtpRequest {
  otp: string;
}

/**
 * Social login request
 */
export interface SocialLoginRequest {
  provider: 'google' | 'facebook';
  idToken: string;
}

/**
 * Forgot password request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Reset password request
 */
export interface ResetPasswordRequest {
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change password request (for authenticated users)
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
