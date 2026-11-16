# Snello Layouts

Applicazione Angular 22 zoneless per comporre i layout Snello e aprire i dati dei metadati. I form usano Formly. L’interfaccia è in inglese.

I layout non restano nel browser: ogni lettura è una GET e ogni salvataggio è una POST o una PUT verso l’API layouts di Snello.

## Sezioni

- **Layouts** (`/layouts`) è la libreria. Si crea e si modifica un layout di tipo list, edit o view. Le liste si filtrano per nome, metadata group, metadato e tipo.
- **Data** (`/data`) elenca solo i layout di tipo list. La card apre la lista dei record (`/data/:id`). Da lì si consulta, si crea e si modifica il dato, senza link all’editor del layout. `/play/:id` reindirizza a `/data/:id`.

Un layout list definisce colonne, ricerca e filtri custom. Un filtro custom ha etichetta e tipo (`string`, `boolean`, `date`, `numeric`) e poi o condizioni sui campi, fisse o col valore inserito, oppure un nome e una condizione REST. L’elenco delle condizioni è quello di [snello-api](https://github.com/snello-cms/snello-api/blob/main/docs/rest-query-params.md#quick-reference).

## Avvio

```bash
npm install
npm start
```

Apri `http://localhost:4200`. Il client Keycloak `snello-admin` deve accettare `http://localhost:4200` come redirect di login.

## Configurazione

All’avvio l’app legge `/config.json`. Nel deploy si può sostituire quel file: nginx lo serve con `Cache-Control: no-store` da `/usr/share/nginx/html/config.json`.

```json
{
  "api_service_path": "https://api.sne.lol/api",
  "metadata_api_path": "https://api.sne.lol/api/metadatas",
  "data_list_api_path": "https://api.sne.lol/api/datalist",
  "document_api_path": "https://api.sne.lol/api/documents",
  "layouts_api_path": "https://api.sne.lol/api/layouts",
  "keycloakConfig": {
    "url": "https://accounts.kayak.love/",
    "realm": "alphasnello",
    "clientId": "snello-admin"
  },
  "scope": "openid"
}
```

Le GET delle API di prova sono pubbliche. Le scritture dei layout richiedono un utente Admin o Manager.

## Versione e immagine

Il menu utente mostra la versione. In locale è `src/app/version.ts`: ogni commit alza il patch, da `0.0.1` a `0.0.2` e così via.

Il push su `main` pubblica l’immagine nginx. La action legge i tag `0.0.x` già presenti su GHCR e Docker Hub, compila l’app con il numero successivo e pubblica sia quel tag sia `latest`:

- `ghcr.io/snello-cms/snello-layouts`
- `snellocms/snello-layouts`, se nel repository sono impostati `DOCKER_HUB_USERNAME` e `DOCKER_HUB_ACCESS_TOKEN`

Il container ascolta sulla porta 80.
