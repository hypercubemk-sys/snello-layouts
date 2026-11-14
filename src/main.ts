import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { buildAppConfig } from './app/app.config';
import { RuntimeConfig } from './app/core/models';

fetch('/config.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Impossibile leggere config.json');
    }
    return response.json() as Promise<RuntimeConfig>;
  })
  .then((config) => bootstrapApplication(App, buildAppConfig(config)))
  .catch((error) => console.error(error));
