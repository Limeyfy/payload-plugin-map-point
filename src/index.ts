import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "payload";
import type { MapPointPluginOptions } from "./types";

// ...imports

export const mapPointPlugin: (options?: MapPointPluginOptions) => Plugin =
	(options) => (incomingConfig) => {
		const config = { ...incomingConfig };

		// Ensure admin importMap resolves our client component
		const spec = "@limeyfy/payload-plugin-map-point/admin/ClientMapPointField";
		try {
			const thisDir = path.dirname(fileURLToPath(import.meta.url));
			const resolvedFSPath = path.resolve(
				thisDir,
				"./admin/ClientMapPointField.js",
			);
			config.admin = config.admin || {};
			config.admin.importMap = config.admin.importMap || {};
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			(config.admin.importMap as any).resolutions = {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				...((config.admin.importMap as any).resolutions || {}),
				[spec]: resolvedFSPath,
			};
		} catch {
			// ignore, rely on package subpath resolution
		}

		const publicMapKey = options?.geocoder?.apiKey; // public only!
		if (!publicMapKey) {
			console.warn(
				'[payload-plugin-map-point] No public API key provided in plugin options. Mapbox maps and geocoding will not work. Please provide a valid Mapbox public API key in the plugin options under "geocoder.apiKey".',
			);
		}
		config.custom = {
			...(config.custom || {}),
			mapPointPluginOptions: {
				...(config.custom as any)?.mapPointPluginOptions,
				...(publicMapKey ? { publicMapKey } : {}),
			},
		};

		return config;
	};

export default mapPointPlugin;
