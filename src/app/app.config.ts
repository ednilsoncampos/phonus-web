import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { catchError, of, tap } from 'rxjs';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/auth/jwt.interceptor';
import { tokenRefreshInterceptor } from './core/auth/token-refresh.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { AuthService } from './core/auth/auth.service';
import { TokenService } from './core/auth/token.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([jwtInterceptor, tokenRefreshInterceptor, httpErrorInterceptor]),
    ),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 5000 } },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const auth = inject(AuthService);
        const tokens = inject(TokenService);
        return () =>
          tokens.getAccessToken()
            ? auth.loadMe().pipe(
                tap(() => auth.scheduleRefreshFromStorage()),
                catchError(() => of(null)),
              )
            : of(null);
      },
      multi: true,
    },
  ],
};
