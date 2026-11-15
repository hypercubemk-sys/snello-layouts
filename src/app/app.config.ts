import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideKeycloak } from 'keycloak-angular';
import { provideFormlyCore } from '@ngx-formly/core';
import { routes } from './app.routes';
import { RuntimeConfig } from './core/models';
import { RUNTIME_CONFIG } from './core/runtime-config';
import { authInterceptor } from './core/auth.interceptor';
import { provideOptimus } from '@openng/optimus-ui/config';
import Aura from '@openng/optimus-ui-themes/aura';
import { formlyConfig } from './formly/register';

export function buildAppConfig(config: RuntimeConfig): ApplicationConfig {
  return {
    providers: [
      provideZonelessChangeDetection(),
      provideBrowserGlobalErrorListeners(),
      { provide: RUNTIME_CONFIG, useValue: config },
      provideKeycloak({
        config: config.keycloak,
        initOptions: {
          onLoad: 'login-required',
          checkLoginIframe: false,
          redirectUri: window.location.origin,
        },
      }),
      provideRouter(routes, withComponentInputBinding()),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideFormlyCore(formlyConfig),
      provideOptimus({
        theme: { preset: Aura },
        translation: {
          firstDayOfWeek: 1,
          dayNames: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
          dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
          dayNamesMin: ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'],
          monthNames: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
          monthNamesShort: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
          today: 'Oggi',
          clear: 'Pulisci',
          chooseDate: 'Scegli data',
        },
      }),
    ],
  };
}
