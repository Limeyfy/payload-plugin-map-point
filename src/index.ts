import type { Plugin } from "payload";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { MapPointPluginOptions } from "./types";

// Field type modeling focused on the shapes we touch
type AdminComponents = { Field?: string };
type AdminConfig = {
	components?: AdminComponents;
	mapPoint?: MapPointPluginOptions;
};

type PointField = {
	type: "point";
	name: string;
	admin?: AdminConfig;
};

type FieldsContainer = { fields: Field[] };
type BlocksContainer = { blocks: Array<{ fields: Field[] }> };
type TabsContainer = { tabs: Array<{ fields: Field[] }> };

type CompoundField =
	| ({ type: "group" } & FieldsContainer)
	| ({ type: "array" } & FieldsContainer)
	| ({ type: "blocks" } & BlocksContainer)
	| ({ type: "row" } & FieldsContainer)
	| ({ type: "tabs" } & TabsContainer);

type OtherField = { type: string; [key: string]: unknown };
export type Field = PointField | CompoundField | OtherField;

const isPointField = (field: Field): field is PointField =>
	field?.type === "point";

const withMapPointAdmin = (
	field: PointField,
	opts?: MapPointPluginOptions,
): PointField => {
	// Use package subpath export so Payload's import map can resolve it
	const adminComponentPath =
		"@limeyfy/payload-plugin-map-point/admin/ClientMapPointField";

	const admin = field.admin ?? {};
	const components: AdminComponents = {
		...(admin.components ?? {}),
		Field: adminComponentPath,
	};
	const envApiKey =
		process.env.NEXT_PUBLIC_MAPBOX_API_KEY ||
		process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
		process.env.MAPBOX_PUBLIC_TOKEN ||
		process.env.MAPBOX_API_KEY ||
		process.env.MAPBOX_TOKEN;

	// Deep-merge geocoder so we don't lose apiKey when admin provides partial overrides
	const baseGeocoder = {
		provider: opts?.geocoder?.provider,
		apiKey: opts?.geocoder?.apiKey ?? envApiKey,
		placeholder: opts?.geocoder?.placeholder,
	};
	const adminGeocoder = (admin.mapPoint as MapPointPluginOptions | undefined)
		?.geocoder;

	const mapPoint: MapPointPluginOptions = {
		defaultCenter:
			(admin.mapPoint as MapPointPluginOptions | undefined)?.defaultCenter ??
			opts?.defaultCenter,
		defaultZoom:
			(admin.mapPoint as MapPointPluginOptions | undefined)?.defaultZoom ??
			opts?.defaultZoom,
		geocoder: { ...baseGeocoder, ...(adminGeocoder ?? {}) },
		enabled:
			(admin.mapPoint as MapPointPluginOptions | undefined)?.enabled ??
			opts?.enabled,
	};

	return {
		...field,
		admin: {
			...admin,
			components,
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

export const mapPointPlugin: (options?: MapPointPluginOptions) => Plugin =
	(options) => (incomingConfig) => {
		const config: any = { ...incomingConfig };

		if (options?.enabled === false) {
			return config;
		}

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

		const priorOnInit = incomingConfig.onInit;
		config.onInit = async (payload: any) => {
			if (typeof priorOnInit === "function") {
				await priorOnInit(payload);
			}
			const provider = options?.geocoder?.provider;
			const apiKey =
				options?.geocoder?.apiKey ||
				process.env.MAPBOX_TOKEN ||
				process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
			if (provider === "mapbox" && !apiKey) {
				payload.logger?.warn?.(
					"[map-point] Mapbox provider enabled but no API key provided",
				);
			}
		};

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
			config.admin.importMap.resolutions = {
				...(config.admin.importMap.resolutions || {}),
				[spec]: resolvedFSPath,
			};
		} catch {
			// ignore, fallback to import map generator resolving the package subpath
		}

		config.custom = {
			...(config.custom || {}),
			mapPointPluginOptions: {
				publicMapKey: options?.geocoder?.apiKey,
			},
		};

		return config;
	};

export default mapPointPlugin;
