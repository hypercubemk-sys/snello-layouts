# Snello Layouts

Zoneless Angular 22 app for composing Snello layouts and opening metadata records. Forms use Formly. The interface is in English.

Layouts are not stored in the browser. Every read is a GET and every save is a POST or PUT to the Snello layouts API.

## Sections

- **Layouts** (`/layouts`) is the library. Create and edit a list, edit, or view layout. Filter the library by name, metadata group, metadata, and type.
- **Data** (`/data`) lists only list layouts. The card opens the record list (`/data/:id`). From there you view, create, and edit records, with no link back to the layout editor. `/play/:id` redirects to `/data/:id`.

A list layout defines columns, search, and custom filters. A custom filter has a label and a type (`string`, `boolean`, `date`, `numeric`), then either column conditions (fixed or based on the entered value) or a name plus a REST condition. The condition list is the one in [snello-api](https://github.com/snello-cms/snello-api/blob/main/docs/rest-query-params.md#quick-reference).

## Start

```bash
npm install
npm start
```

Open `http://localhost:4200`. The Keycloak client `snello-admin` must allow `http://localhost:4200` as a login redirect.

## Configuration

On startup the app reads `/config.json`. A deploy can replace that file: nginx serves it with `Cache-Control: no-store` from `/usr/share/nginx/html/config.json`.

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

GETs on the trial API are public. Layout writes require an Admin or Manager user.

## Version and image

The account menu shows the version. Locally it comes from `src/app/version.ts`: each commit raises the patch, from `0.0.1` to `0.0.2` and so on.

A push to `main` publishes the nginx image. The action reads the `0.0.x` tags already on GHCR and Docker Hub, builds the app with the next number, and publishes that tag together with `latest`:

- `ghcr.io/snello-cms/snello-layouts`
- `snellocms/snello-layouts`, when `DOCKER_HUB_USERNAME` and `DOCKER_HUB_ACCESS_TOKEN` are set on the repository

The container listens on port 80.
