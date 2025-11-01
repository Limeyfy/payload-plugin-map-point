import type { GeocoderProvider } from "../types";

export type GeocodeOptions = {
  provider: GeocoderProvider;
  apiKey?: string;
  query: string;
};

export type GeocodeResult = {
  lng: number;
  lat: number;
} | null;

/**
 * Geocode a query string using the specified provider
 */
export async function geocode(options: GeocodeOptions): Promise<GeocodeResult> {
  const { provider, apiKey, query: q } = options;
  const query = q.trim();
  if (!query) return null;

  try {
    let lng: number | null = null;
    let lat: number | null = null;

    if (provider === "mapbox") {
      if (!apiKey) return null;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${apiKey}`;
      const res = await fetch(url);
      const data: { features?: Array<{ center?: [number, number] }> } = await res.json();
      const center = data?.features?.[0]?.center;
      if (Array.isArray(center) && center.length >= 2) {
        lng = Number(center[0]);
        lat = Number(center[1]);
      }
    } else if (provider === "google") {
      if (!apiKey) return null;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
      const res = await fetch(url);
      const data: any = await res.json();
      const loc = data?.results?.[0]?.geometry?.location;
      if (loc?.lng != null && loc?.lat != null) {
        lng = Number(loc.lng);
        lat = Number(loc.lat);
      }
    } else {
      // nominatim by default
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data: Array<{ lon?: string | number; lat?: string | number }> = await res.json();
      const item = data?.[0];
      if (item?.lon && item?.lat) {
        lng = Number(item.lon);
        lat = Number(item.lat);
      }
    }

    if (lng != null && lat != null) {
      return { lng, lat };
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("Geocoding failed", e);
  }

  return null;
}
