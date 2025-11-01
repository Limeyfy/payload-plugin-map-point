import type { MapProvider } from "../types";
import { envGoogleKey, envMapboxKey } from "../token";

export type ApiKeyResolverOptions = {
  mapProvider: MapProvider;
  mapApiKey?: string;
  geocoderApiKey?: string;
  fallbackApiKey?: string; // backward-compat
};

/**
 * Resolves the API key to use for map rendering based on provider and configuration
 */
export function resolveMapApiKey(options: ApiKeyResolverOptions): string | undefined {
  const { mapProvider, mapApiKey, geocoderApiKey, fallbackApiKey } = options;
  
  // Prefer map-specific API key, then geocoder API key, then env vars, then fallback
  return (
    mapApiKey ||
    geocoderApiKey ||
    (mapProvider === "google" ? envGoogleKey : envMapboxKey) ||
    fallbackApiKey
  );
}

/**
 * Resolves the API key to use for geocoding based on provider and configuration
 */
export function resolveGeocoderApiKey(options: {
  geocoderProvider: string;
  geocoderApiKey?: string;
  mapApiKey?: string;
  mapProvider: MapProvider;
  fallbackApiKey?: string;
}): string | undefined {
  const { geocoderApiKey, mapApiKey, geocoderProvider, mapProvider, fallbackApiKey } = options;
  
  // Prefer geocoder-specific API key, then map API key, then env vars, then fallback
  if (geocoderProvider === "google" || geocoderProvider === "mapbox") {
    return (
      geocoderApiKey ||
      mapApiKey ||
      (mapProvider === "google" ? envGoogleKey : envMapboxKey) ||
      fallbackApiKey
    );
  }
  
  // Nominatim doesn't need an API key
  return undefined;
}
