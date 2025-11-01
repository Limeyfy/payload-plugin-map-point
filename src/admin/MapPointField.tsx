'use client';
import { useField } from '@payloadcms/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	resolveGeocoderApiKey,
	resolveMapApiKey,
} from '../map-loaders/apiKeyResolver';
import { autocomplete, geocode } from '../map-loaders/geocoder';
import { MapLoader } from '../map-loaders/MapLoader';
import type { CustomPointFieldClientProps } from './config';
import { Footer, SearchBar, type AutocompleteOption } from './shared';

export default function MapPointField(props: CustomPointFieldClientProps) {
	const [options] = useState(props.field?.admin?.mapPoint || {});
	const { value, setValue } = useField({ path: props.path });

	const [query, setQuery] = useState('');
	const [autocompleteOptions, setAutocompleteOptions] = useState<AutocompleteOption[]>([]);
	const [coords, setCoords] = useState<[number, number] | null>(
		Array.isArray(value) ? (value as [number, number]) : null,
	);

	const defaultCenter: [number, number] = useMemo(
		() => options.defaultCenter ?? [60.6, 11.9],
		[options.defaultCenter],
	);
	const defaultZoom = useMemo(
		() => options.defaultZoom ?? 12,
		[options.defaultZoom],
	);

	const mapProvider = options.map?.provider ?? 'mapbox';
	const mapApiKey = resolveMapApiKey({
		fallbackApiKey: props.apiKey,
		geocoderApiKey: options.geocoder?.apiKey,
		mapApiKey: options.map?.apiKey,
		mapProvider,
	});

	const geocoderProvider = useMemo(
		() =>
			options?.geocoder?.provider ||
			(mapProvider === 'leaflet' ? 'nominatim' : mapProvider),
		[options?.geocoder?.provider, mapProvider],
	);

	const geocoderApiKey = useMemo(
		() =>
			resolveGeocoderApiKey({
				fallbackApiKey: props.apiKey,
				geocoderApiKey: options?.geocoder?.apiKey,
				geocoderProvider,
				mapApiKey: options.map?.apiKey,
				mapProvider,
			}),
		[
			props.apiKey,
			options?.geocoder?.apiKey,
			geocoderProvider,
			options.map?.apiKey,
			mapProvider,
		],
	);

	// Debounced autocomplete search
	useEffect(() => {
		if (!query.trim()) {
			setAutocompleteOptions([]);
			return;
		}

		const timeoutId = setTimeout(async () => {
			try {
				const results = await autocomplete({
					apiKey: geocoderApiKey,
					provider: geocoderProvider as 'mapbox' | 'nominatim' | 'google',
					query,
				});
				setAutocompleteOptions(
					results.map((r) => ({
						displayName: r.displayName,
						lng: r.lng,
						lat: r.lat,
					})),
				);
			} catch (e) {
				// eslint-disable-next-line no-console
				console.warn('Autocomplete search failed', e);
				setAutocompleteOptions([]);
			}
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [query, geocoderProvider, geocoderApiKey]);

	const geocodeQuery = useCallback(async (): Promise<void> => {
		const result = await geocode({
			apiKey: geocoderApiKey,
			provider: geocoderProvider as 'mapbox' | 'nominatim' | 'google',
			query,
		});

		if (result) {
			setCoords([result.lng, result.lat]);
			setValue([result.lng, result.lat]);
			setAutocompleteOptions([]);
		}
	}, [geocoderApiKey, geocoderProvider, query, setValue]);

	const handleSelectOption = useCallback(
		(option: AutocompleteOption) => {
			setCoords([option.lng, option.lat]);
			setValue([option.lng, option.lat]);
			setQuery(option.displayName);
			setAutocompleteOptions([]);
		},
		[setValue],
	);

	const onPick = useCallback(
		(pt: [number, number]) => {
			setCoords(pt);
			setValue(pt);
		},
		[setValue],
	);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
			{(options?.geocoder?.provider || options?.geocoder?.apiKey) && (
				<SearchBar
					value={query}
					onChange={setQuery}
					onSubmit={geocodeQuery}
					placeholder={options?.geocoder?.placeholder}
					options={autocompleteOptions}
					onSelectOption={handleSelectOption}
				/>
			)}

			<MapLoader
				provider={mapProvider}
				apiKey={mapApiKey}
				defaultCenter={defaultCenter}
				defaultZoom={defaultZoom}
				value={coords}
				onPick={onPick}
			/>

			<Footer
				value={coords}
				onClear={() => {
					setCoords(null);
					setValue(null);
				}}
			/>
		</div>
	);
}
