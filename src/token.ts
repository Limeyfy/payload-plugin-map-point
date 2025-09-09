export const envMapboxKey =
	process.env.NEXT_PUBLIC_MAPBOX_API_KEY ||
	process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
	process.env.VITE_PUBLIC_MAPBOX_API_KEY ||
	process.env.VITE_PUBLIC_MAPBOX_TOKEN ||
	process.env.MAPBOX_PUBLIC_TOKEN ||
	process.env.MAPBOX_API_KEY ||
	process.env.MAPBOX_TOKEN;

export const envGoogleKey =
	process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
	process.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY ||
	process.env.GOOGLE_MAPS_API_KEY;

export const envPublicKey = envMapboxKey; // backward-compat (Mapbox)
