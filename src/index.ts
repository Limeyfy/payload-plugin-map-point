import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Field, Plugin, PointField } from 'payload';
import { getConfig } from './admin/config';
import { envGoogleKey, envMapboxKey, envPublicKey } from './token';
import type { MapPointField, MapPointPluginOptions } from './types';

// ---------------------------------------------
// Types & helpers for recursively enhancing fields
// ---------------------------------------------

type FieldsContainer = { fields: Field[] };
type BlocksContainer = { blocks: { fields: Field[] }[] };
type TabsContainer = { tabs: { fields: Field[] }[] };

const isPointField = (field: Field): field is PointField =>
	field?.type === 'point';

const withMapPointAdmin = (
	field: PointField,
	opts?: MapPointPluginOptions
): MapPointField => {
	const admin = (field.admin ?? {}) as MapPointField['admin'];

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
			(admin?.mapPoint as MapPointPluginOptions | undefined)
				?.defaultCenter ?? opts?.defaultCenter,
		defaultZoom:
			(admin?.mapPoint as MapPointPluginOptions | undefined)
				?.defaultZoom ?? opts?.defaultZoom,
		geocoder: { ...baseGeocoder, ...(adminGeocoder ?? {}) },
		map: {
			provider:
				(admin?.mapPoint as MapPointPluginOptions | undefined)?.map
					?.provider ??
				opts?.map?.provider ??
				'mapbox',
			apiKey:
				(admin?.mapPoint as MapPointPluginOptions | undefined)?.map
					?.apiKey ??
				opts?.map?.apiKey ??
				// fallback to geocoder api key or env by provider
				(opts?.map?.provider === 'google'
					? (opts?.geocoder?.apiKey ?? envGoogleKey)
					: (opts?.geocoder?.apiKey ?? envMapboxKey)),
		},
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
					apiKey:
						opts?.map?.apiKey ||
						opts?.geocoder?.apiKey ||
						envMapboxKey ||
						envGoogleKey ||
						'',
				},
			}),
			mapPoint,
		},
	};
};

const recurseField = (f: Field, opts?: MapPointPluginOptions): Field => {
	if (isPointField(f)) return withMapPointAdmin(f, opts);

	// Recurse into nested structures while preserving other props
	if ('fields' in f && Array.isArray((f as FieldsContainer).fields)) {
		return {
			...(f as any),
			fields: (f as FieldsContainer).fields.map((x) =>
				recurseField(x, opts)
			),
		};
	}
	if ('blocks' in f && Array.isArray((f as BlocksContainer).blocks)) {
		return {
			...(f as any),
			blocks: (f as BlocksContainer).blocks.map((b) => ({
				...b,
				fields: b.fields.map((x) => recurseField(x, opts)),
			})),
		};
	}
	if ('tabs' in f && Array.isArray((f as TabsContainer).tabs)) {
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
		const spec =
			'@limeyfy/payload-plugin-map-point/admin/ClientMapPointField';
		try {
			const thisDir = path.dirname(fileURLToPath(import.meta.url));
			const resolvedFSPath = path.resolve(
				thisDir,
				'./admin/ClientMapPointField.js'
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

		const provider = options?.map?.provider ?? 'mapbox';
		const publicMapKey =
			options?.map?.apiKey ||
			options?.geocoder?.apiKey ||
			(provider === 'google' ? envGoogleKey : envMapboxKey);
		if ((provider === 'mapbox' || provider === 'google') && !publicMapKey) {
			console.warn(
				`[payload-plugin-map-point] No public API key provided for ${provider} maps. Set map.apiKey or geocoder.apiKey or appropriate env.`
			);
		}

		// Keep existing onInit and warn if provider misconfigured
		const priorOnInit = incomingConfig.onInit;
		config.onInit = async (payload: any) => {
			if (typeof priorOnInit === 'function') {
				await priorOnInit(payload);
			}
			const geocoderProvider = options?.geocoder?.provider;
			const apiKey = options?.geocoder?.apiKey || publicMapKey;
			if (geocoderProvider === 'mapbox' && !apiKey) {
				payload.logger?.warn?.(
					'[map-point] Mapbox provider enabled but no API key provided'
				);
			}
			if (geocoderProvider === 'google' && !apiKey) {
				payload.logger?.warn?.(
					'[map-point] Google geocoder enabled but no API key provided'
				);
			}
		};

		return config;
	};

export default mapPointPlugin;
