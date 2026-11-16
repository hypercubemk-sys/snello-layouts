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
        config: config.keycloakConfig,
        initOptions: {
          onLoad: 'login-required',
          checkLoginIframe: false,
          ...(config.scope ? { scope: config.scope } : {}),
        },
      }),
      provideRouter(routes, withComponentInputBinding()),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideFormlyCore(formlyConfig),
      provideOptimus({
        theme: { preset: Aura },
        translation: {
          firstDayOfWeek: 1,
          dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
          monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          today: 'Today',
          clear: 'Clear',
          chooseDate: 'Choose date',
        },
      }),
    ],
  };
}
