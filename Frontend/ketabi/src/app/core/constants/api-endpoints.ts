import { environment } from '../../../environments/environment';
export const API_ENDPOINTS = {
  books: `${environment.apiBaseUrl}/books`,
  chatbot: `${environment.apiBaseUrl}/chatbot`,

  publishers: `${environment.apiBaseUrl}/publishers`,
  genres: `${environment.apiBaseUrl}/genres`,
  reviews: `${environment.apiBaseUrl}/reviews`,
  coupon: `${environment.apiBaseUrl}/coupons`,
  order: `${environment.apiBaseUrl}/orders`,
  cart:`${environment.apiBaseUrl}/cart`,
  profile: `${environment.apiBaseUrl}/users`,

  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/confirm-email',
    CHANGE_PASSWORD: '/auth/change-password',
    CONFIRM_LOGIN: '/auth/confirm-login',
    RESEND_VERIFICATION: '/auth/resend-confirmation-otp',
    GOOGLE_LOGIN: '/auth/login/google',
    FACEBOOK_LOGIN: '/auth/login/facebook',
    GOOGLE_REGISTER: '/auth/register/google',
    FACEBOOK_REGISTER: '/auth/register/facebook',
  },

  
};
