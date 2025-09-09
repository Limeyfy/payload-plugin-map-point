import { PointField } from "payload";

export type GeocoderProvider = "mapbox" | "nominatim";

export type MapPointPluginOptions = {
	enabled?: boolean;
	defaultCenter?: [number, number];
	defaultZoom?: number;
	geocoder?: {
		provider?: GeocoderProvider;
		apiKey?: string; // required for mapbox
		placeholder?: string;
	};
};

export type MapPointField = PointField & {
	admin?: PointField["admin"] & {
		mapPoint?: MapPointPluginOptions;
	};
};
