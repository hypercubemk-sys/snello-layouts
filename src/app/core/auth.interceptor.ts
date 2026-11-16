import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RUNTIME_CONFIG } from './runtime-config';
import { RuntimeConfig } from './models';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const config = inject(RUNTIME_CONFIG);
  if (!isApiRequest(request.url, config)) {
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

function isApiRequest(url: string, config: RuntimeConfig): boolean {
  return [
    config.api_service_path,
    config.metadata_api_path,
    config.data_list_api_path,
    config.document_api_path,
    config.layouts_api_path,
  ].some((path) => url.startsWith(path.replace(/\/$/, '')));
}
