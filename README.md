# Payload-plugin-map-point
========================

Enhances Payload CMS `point` fields with an admin Map UI (Mapbox) and an optional search box to geocode an address/place. It preserves the native data format `[lng, lat]` — no breaking changes.

- Admin map UI: click to set coordinates
- Optional geocoder: Mapbox (API key) or Nominatim (no key)
- Minimal config: default center/zoom + provider/key
- Zero changes to stored value: stays `[lng, lat]`

Installation
------------

Peer dependencies are expected in the host project:

```
# with pnpm
dev: pnpm add -D @limeyfy/payload-plugin-map-point
app: pnpm add @limeyfy/payload-plugin-map-point mapbox-gl

# with npm
npm i @limeyfy/payload-plugin-map-point mapbox-gl

# with yarn
yarn add @limeyfy/payload-plugin-map-point mapbox-gl
```

Notes:
- `payload`, `react`, and `react-dom` are assumed to be present in your Payload app (peer deps).
- Map rendering uses Mapbox; a public access token is required to show the map.
- Geocoding can use Mapbox (requires token) or Nominatim (no token).

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
    provider?: 'mapbox' | 'nominatim' // defaults to 'nominatim' if unset
    apiKey?: string                   // required for provider: 'mapbox'
    placeholder?: string              // search input placeholder
  }
})
```

- Map renders with Mapbox; provide a token via `geocoder.apiKey` (or per-field override). Without a token, the UI will show a helpful notice instead of a map.
- Geocoding:
  - `mapbox`: uses Mapbox Geocoding API (requires token).
  - `nominatim`: uses OpenStreetMap Nominatim public endpoint (no token). Please respect its usage policy; consider self-hosting or adding appropriate headers for production workloads.

Data shape and behavior
-----------------------

- Value format stays `[lng, lat]` (Payload’s native `point` type). No migrations required.
- Clicking the map sets a marker and updates the field value.
- Searching via geocoder flies the map to the first result and updates the value.
- “Clear” resets to `null` so you can submit “no value.”

Troubleshooting
---------------

- Map not visible: ensure a valid Mapbox token is provided and accessible to the admin bundle (e.g., via env var in your Payload config).
- Styling/CSS: Mapbox GL v3 generally works without importing CSS for this minimal usage. If you add controls/popups and notice styling issues, include `import 'mapbox-gl/dist/mapbox-gl.css'` in your admin CSS bundle.
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
