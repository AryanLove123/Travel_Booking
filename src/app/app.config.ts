import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { DataBootstarpService } from './core/data/data-bootstarp.service';
import { DatePipe } from '@angular/common';
import { PaymentGateway } from './core/payment/payment-gateway';
import { LocalMockGateway } from './core/payment/local-mock-gateway';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    DatePipe,
    { provide: PaymentGateway, useExisting: LocalMockGateway },
    provideAppInitializer(() => {
      inject(DataBootstarpService).initalize();
      return inject(AuthService).init();
    }),
  ],
};
