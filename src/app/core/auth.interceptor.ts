import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RUNTIME_CONFIG } from './runtime-config';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(RUNTIME_CONFIG);
  if (!request.url.startsWith(config.apiBase)) {
    return next(request);
  }

  const keycloak = inject(Keycloak);
  if (!keycloak.authenticated) {
    return next(request);
  }

  return from(keycloak.updateToken(20)).pipe(
    switchMap(() => {
      const token = keycloak.token;
      if (!token) return next(request);
      return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
    }),
  );
};
