import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Field, Plugin, PointField } from "payload";
import { getConfig } from "./admin/config";
import { envPublicKey } from "./token";
import type { MapPointField, MapPointPluginOptions } from "./types";

// ---------------------------------------------
// Types & helpers for recursively enhancing fields
// ---------------------------------------------

type FieldsContainer = { fields: Field[] };
type BlocksContainer = { blocks: { fields: Field[] }[] };
type TabsContainer = { tabs: { fields: Field[] }[] };

const isPointField = (field: Field): field is PointField =>
	field?.type === "point";

const withMapPointAdmin = (
	field: PointField,
	opts?: MapPointPluginOptions,
): MapPointField => {
	const admin = (field.admin ?? {}) as MapPointField["admin"];

	// Deep-merge geocoder so we don't lose apiKey when admin provides partial overrides
	const baseGeocoder = {
		provider: opts?.geocoder?.provider,
		apiKey: opts?.geocoder?.apiKey ?? envPublicKey,
		placeholder: opts?.geocoder?.placeholder,
	};
	const adminGeocoder = (admin?.mapPoint as MapPointPluginOptions | undefined)
		?.geocoder;

	const mapPoint: MapPointPluginOptions = {
		defaultCenter:
			(admin?.mapPoint as MapPointPluginOptions | undefined)?.defaultCenter ??
			opts?.defaultCenter,
		defaultZoom:
			(admin?.mapPoint as MapPointPluginOptions | undefined)?.defaultZoom ??
			opts?.defaultZoom,
		geocoder: { ...baseGeocoder, ...(adminGeocoder ?? {}) },
		enabled:
			(admin?.mapPoint as MapPointPluginOptions | undefined)?.enabled ??
			opts?.enabled,
	};

	return {
		...field,
		admin: {
			...admin,
			components: getConfig({
				clientProps: {
					apiKey: opts?.geocoder?.apiKey || envPublicKey || "",
				},
			}),
			mapPoint,
		},
	};
};

const recurseField = (f: Field, opts?: MapPointPluginOptions): Field => {
	if (isPointField(f)) return withMapPointAdmin(f, opts);

	// Recurse into nested structures while preserving other props
	if ("fields" in f && Array.isArray((f as FieldsContainer).fields)) {
		return {
			...(f as any),
			fields: (f as FieldsContainer).fields.map((x) => recurseField(x, opts)),
		};
	}
	if ("blocks" in f && Array.isArray((f as BlocksContainer).blocks)) {
		return {
			...(f as any),
			blocks: (f as BlocksContainer).blocks.map((b) => ({
				...b,
				fields: b.fields.map((x) => recurseField(x, opts)),
			})),
		};
	}
	if ("tabs" in f && Array.isArray((f as TabsContainer).tabs)) {
		return {
			...(f as any),
			tabs: (f as TabsContainer).tabs.map((t) => ({
				...t,
				fields: t.fields.map((x) => recurseField(x, opts)),
			})),
		};
	}
	return f;
};

// ---------------------------------------------
// Plugin
// ---------------------------------------------

export const mapPointPlugin: (options?: MapPointPluginOptions) => Plugin =
	(options) => (incomingConfig) => {
		const config: any = { ...incomingConfig };

		// Short-circuit if disabled
		if (options?.enabled === false) {
			return config;
		}

		// Ensure admin importMap resolves our client component for dev/local builds
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

		// Recursively enhance all collections & globals
		if (Array.isArray(config.collections)) {
			config.collections = config.collections.map((col: any) => ({
				...col,
				fields: Array.isArray(col.fields)
					? col.fields.map((f: Field) => recurseField(f, options))
					: col.fields,
			}));
		}

		if (Array.isArray(config.globals)) {
			config.globals = config.globals.map((g: any) => ({
				...g,
				fields: Array.isArray(g.fields)
					? g.fields.map((f: Field) => recurseField(f, options))
					: g.fields,
			}));
		}

		const publicMapKey = options?.geocoder?.apiKey ?? envPublicKey; // public only!
		if (!publicMapKey) {
			console.warn(
				'[payload-plugin-map-point] No public API key provided in plugin options or env. Mapbox maps and geocoding may not work. Set "geocoder.apiKey" or NEXT_PUBLIC_MAPBOX_TOKEN.',
			);
		}

		// Keep existing onInit and warn if provider misconfigured
		const priorOnInit = incomingConfig.onInit;
		config.onInit = async (payload: any) => {
			if (typeof priorOnInit === "function") {
				await priorOnInit(payload);
			}
			const provider = options?.geocoder?.provider;
			const apiKey = options?.geocoder?.apiKey || envPublicKey;
			if (provider === "mapbox" && !apiKey) {
				payload.logger?.warn?.(
					"[map-point] Mapbox provider enabled but no API key provided",
				);
			}
		};

		return config;
	};

export default mapPointPlugin;
