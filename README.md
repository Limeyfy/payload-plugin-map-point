# Payload-plugin-map-point
========================

Enhances Payload CMS `point` fields with an admin Map UI (Mapbox, Google, or Leaflet) and an optional search box to geocode an address/place. It preserves the native data format `[lng, lat]` — no breaking changes.

- Admin map UI: click to set coordinates
- Map providers: Mapbox, Google, or Leaflet (OSM tiles)
- Optional geocoder: Mapbox, Google (API key), or Nominatim (no key)
- Minimal config: default center/zoom + provider/key
- Zero changes to stored value: stays `[lng, lat]`

Installation
------------

Peer dependencies are expected in the host project:

```
# with pnpm
dev: pnpm add -D @limeyfy/payload-plugin-map-point
app: pnpm add @limeyfy/payload-plugin-map-point mapbox-gl

# Optional (choose your provider):
# Google Maps loader (for Google provider)
app: pnpm add @googlemaps/js-api-loader
# Leaflet (for Leaflet provider)
app: pnpm add leaflet

# with npm
npm i @limeyfy/payload-plugin-map-point mapbox-gl

# with yarn
yarn add @limeyfy/payload-plugin-map-point mapbox-gl
```

Notes:
- `payload`, `react`, and `react-dom` are assumed peer deps in your Payload app.
- Choose a map provider: Mapbox (token), Google (API key), or Leaflet (no key).
- Geocoding: Mapbox (token), Google (API key), Nominatim (no key).
- Leaflet markers: Ensure default marker images are served from your app's public root. At minimum, `/marker-icon.png`, `/marker-icon-2x.png`, and `/marker-shadow.png` must be accessible. If your bundler does not copy them automatically, copy them from `node_modules/leaflet/dist/images` into your `public/` folder so they resolve at those paths.

Quick start
-----------

Add the plugin to your `payload.config.ts` and keep using your `point` fields as usual.

```ts
// payload.config.ts
import { buildConfig } from 'payload/config'
import mapPointPlugin from '@limeyfy/payload-plugin-map-point'

export default buildConfig({
  // ...
  plugins: [
    mapPointPlugin({
      defaultCenter: [10.75, 59.91], // [lng, lat]
      defaultZoom: 10,
      geocoder: {
        provider: 'mapbox',
        apiKey: process.env.MAPBOX_TOKEN,
        placeholder: 'Search address',
      },
      map: {
        provider: 'mapbox', // 'google' | 'leaflet'
        // apiKey: process.env.MAPBOX_TOKEN, // optional (falls back to geocoder.apiKey or env)
      },
    }),
  ],
})
```

Use `point` fields like normal:

```ts
// a collection example
export const Places = {
  slug: 'places',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'location', type: 'point' }, // value remains [lng, lat]
  ],
}
```

Per-field overrides
-------------------

You can override the plugin defaults per field using `admin.mapPoint`:

```ts
{
  name: 'location',
  type: 'point',
  admin: {
    mapPoint: {
      defaultCenter: [0, 0],
      defaultZoom: 3,
      geocoder: { provider: 'nominatim', placeholder: 'Search city or address' },
      map: { provider: 'leaflet' },
    },
  },
}
```

Options
-------

```ts
mapPointPlugin({
  defaultCenter?: [number, number]   // default map center for empty values
  defaultZoom?: number               // default zoom for empty values
  geocoder?: {
    provider?: 'mapbox' | 'nominatim' | 'google' // defaults to 'nominatim' for Leaflet, otherwise provider
    apiKey?: string                               // required for 'mapbox' or 'google'
    placeholder?: string                          // search input placeholder
  }
  map?: {
    provider?: 'mapbox' | 'google' | 'leaflet' // default 'mapbox'
    apiKey?: string                             // for 'mapbox' or 'google' (falls back to geocoder.apiKey)
  }
})
```

- Map rendering:
  - `mapbox`: requires a public access token.
  - `google`: requires a public API key. Uses `@googlemaps/js-api-loader` if present, else falls back to injecting the script.
  - `leaflet`: no key needed; uses OSM tiles by default.
- Geocoding:
  - `mapbox`: Mapbox Geocoding API (requires token).
  - `google`: Google Geocoding API (requires key).
  - `nominatim`: OpenStreetMap Nominatim (no key). Please respect usage policy.

Data shape and behavior
-----------------------

- Value format stays `[lng, lat]` (Payload’s native `point` type). No migrations required.
- Clicking the map sets a marker and updates the field value.
- Searching via geocoder flies the map to the first result and updates the value.
- “Clear” resets to `null` so you can submit “no value.”

Troubleshooting
---------------

- Map not visible: ensure a valid token/API key is provided for `mapbox`/`google` providers (via plugin options or env) and accessible to the admin bundle.
- Styling/CSS: Map styles are included by the field for Mapbox and Leaflet (`mapbox-gl/dist/mapbox-gl.css`, `leaflet/dist/leaflet.css`). No extra actions are needed in most setups.
- CORS/Network: Ad blockers or corporate networks may block Nominatim requests. Switch to Mapbox or configure appropriate headers.

TypeScript
----------

This package ships ESM + CJS builds with `.d.ts`. Import via either module system:

```ts
import mapPointPlugin from '@limeyfy/payload-plugin-map-point'
// or
const mapPointPlugin = require('@limeyfy/payload-plugin-map-point').default
```

Development & release
---------------------

- Build locally: `pnpm build`
- One-command release (tags, GitHub Release, npm publish): `pnpm release`
  - Requires `GITHUB_TOKEN` (repo scope) and authenticated `npm` in the environment.

License
-------

MIT
