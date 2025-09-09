import { PointField } from "payload";

export type GeocoderProvider = "mapbox" | "nominatim" | "google";

export type MapProvider = "mapbox" | "google" | "leaflet";

export type MapPointPluginOptions = {
	enabled?: boolean;
	defaultCenter?: [number, number];
	defaultZoom?: number;
	// Geocoder settings (provider specific)
	geocoder?: {
		provider?: GeocoderProvider;
		apiKey?: string; // required for mapbox/google
		placeholder?: string;
	};
	// Map provider settings
	map?: {
		provider?: MapProvider; // default: mapbox
		apiKey?: string; // optional; for mapbox/google if not using geocoder.apiKey
	};
};

export type MapPointField = PointField & {
	admin?: PointField["admin"] & {
		mapPoint?: MapPointPluginOptions;
	};
};
