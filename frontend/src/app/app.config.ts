import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { I18NEXT_SERVICE, provideI18Next } from 'angular-i18next';
import en from '../assets/i18n/en.json';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';
import { registerIcons } from './core/icons/icons';
import { AppTitleStrategy } from './core/services/app-title.strategy';
import { StoreInfoService } from './core/services/store-info.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideI18Next(),
    provideAppInitializer(() => {
      registerIcons();
      inject(StoreInfoService).load();
      return inject(I18NEXT_SERVICE).init({
        lng: 'en',
        fallbackLng: 'en',
        supportedLngs: ['en'],
        resources: { en: { translation: en } },
        interpolation: { escapeValue: false },
      });
    }),
  ],
};
