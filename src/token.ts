export const envPublicKey =
	process.env.NEXT_PUBLIC_MAPBOX_API_KEY ||
	process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
	process.env.VITE_PUBLIC_MAPBOX_API_KEY ||
	process.env.VITE_PUBLIC_MAPBOX_TOKEN ||
	process.env.MAPBOX_PUBLIC_TOKEN ||
	process.env.MAPBOX_API_KEY ||
	process.env.MAPBOX_TOKEN;
