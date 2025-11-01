'use client';
import { useField } from '@payloadcms/ui';
import { useCallback, useMemo, useState } from 'react';
import {
	resolveGeocoderApiKey,
	resolveMapApiKey,
} from '../map-loaders/apiKeyResolver';
import { geocode } from '../map-loaders/geocoder';
import { MapLoader } from '../map-loaders/MapLoader';
import type { CustomPointFieldClientProps } from './config';
import { Footer, SearchBar } from './shared';

export default function MapPointField(props: CustomPointFieldClientProps) {
	const [options] = useState(props.field?.admin?.mapPoint || {});
	const { value, setValue } = useField({ path: props.path });

	const [query, setQuery] = useState('');
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

	const geocodeQuery = useCallback(async (): Promise<void> => {
		const geocoderProvider =
			options?.geocoder?.provider ||
			(mapProvider === 'leaflet' ? 'nominatim' : mapProvider);
		const geocoderApiKey = resolveGeocoderApiKey({
			fallbackApiKey: props.apiKey,
			geocoderApiKey: options?.geocoder?.apiKey,
			geocoderProvider,
			mapApiKey: options.map?.apiKey,
			mapProvider,
		});

		const result = await geocode({
			apiKey: geocoderApiKey,
			provider: geocoderProvider as 'mapbox' | 'nominatim' | 'google',
			query,
		});

		if (result) {
			setCoords([result.lng, result.lat]);
			setValue([result.lng, result.lat]);
		}
	}, [
		options?.geocoder?.provider,
		options?.geocoder?.apiKey,
		options.map?.apiKey,
		query,
		mapProvider,
		setValue,
		props.apiKey,
	]);

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
