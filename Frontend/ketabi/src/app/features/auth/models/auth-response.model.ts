// src/app/features/auth/models/auth-response.model.ts

import { IUser } from '../../../core/models/user.model';

/**
 * Base API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

/**
 * Authentication response data
 */
export interface AuthData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Token expiry in seconds
  tokenType: string; // Usually "Bearer"
  user?: IUser;
  requiresOtp?: boolean;
  otpSentTo?: string; // Masked email/phone
}

/**
 * Main authentication response - USE THIS for login/OTP
 */
export interface AuthResponse {
  success: boolean;
  message: string;
  data: AuthData;
  timestamp?: string;
}

/**
 * Alternative: Full authentication response (extends ApiResponse)
 */
export interface AuthResponseFull extends ApiResponse<AuthData> {
  data: AuthData;
}

/**
 * Login response (may require OTP)
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  data: Partial<AuthData> & {
    requiresOtp?: boolean;
    otpSentTo?: string; // Masked email/phone
  };
}

/**
 * OTP verification response
 */
export interface OtpVerificationResponse extends ApiResponse<AuthData> {
  data: AuthData;
}

/**
 * Registration response
 */
export interface RegisterResponse
  extends ApiResponse<{
    user: IUser;
    requiresEmailVerification?: boolean;
  }> {
  data: {
    user: IUser;
    requiresEmailVerification?: boolean;
  };
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse
  extends ApiResponse<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

/**
 * Logout response
 */
export interface LogoutResponse
  extends ApiResponse<{
    message: string;
  }> {
  data: {
    message: string;
  };
}

/**
 * Password reset request response
 */
export interface ForgotPasswordResponse
  extends ApiResponse<{
    message: string;
    email: string;
  }> {
  data: {
    message: string;
    email: string;
  };
}

/**
 * Password reset confirmation response
 */
export interface ResetPasswordResponse
  extends ApiResponse<{
    message: string;
  }> {
  data: {
    message: string;
  };
}

/**
 * Email verification response
 */
export interface EmailVerificationResponse
  extends ApiResponse<{
    message: string;
    verified: boolean;
  }> {
  data: {
    message: string;
    verified: boolean;
  };
}
