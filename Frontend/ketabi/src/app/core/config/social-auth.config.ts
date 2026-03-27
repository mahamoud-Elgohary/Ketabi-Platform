// src/app/core/config/social-auth.providers.ts
import { Provider } from '@angular/core';
import {
  GoogleLoginProvider,
  FacebookLoginProvider,
  SocialAuthService,
} from '@abacritt/angularx-social-login';
import { environment } from '../../../environments/environment';

export function provideSocialAuth(): Provider[] {
  return [
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
            id: GoogleLoginProvider.PROVIDER_ID,
            provider: new GoogleLoginProvider(environment.social.googleClientId, {
              oneTapEnabled: false,
              prompt: 'select_account',
              scopes: 'profile email',
            }),
          },
          {
            id: FacebookLoginProvider.PROVIDER_ID,
            provider: new FacebookLoginProvider(environment.social.facebookAppId, {
              scope: 'email,public_profile',
              return_scopes: true,
              enable_profile_selector: true,
            }),
          },
        ],
        onError: (err: any) => {
          console.error('Social auth error:', err);
        },
      },
    },
    SocialAuthService,
  ];
}
