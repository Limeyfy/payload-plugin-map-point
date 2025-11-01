'use client';
import * as mod from '@googlemaps/js-api-loader';
import type React from 'react';
import { useEffect, useRef } from 'react';

export const GoogleMap: React.FC<{
	containerRef: React.RefObject<HTMLDivElement | null>;
	apiKey: string;
	center: [number, number];
	zoom: number;
	value: [number, number] | null;
	onPick: (coords: [number, number]) => void;
}> = ({ containerRef, apiKey, center, zoom, value, onPick }) => {
	const mapRef = useRef<any>(null);
	const markerRef = useRef<any>(null);

	useEffect(() => {
		let canceled = false;
		if (!containerRef.current) return;

		const load = async () => {
			// Prefer loader if available, else fallback to script tag
			try {
				const loader = new mod.Loader({ apiKey, version: 'weekly' });
				await loader.load();
			} catch {
				// Fallback: inject script only once
				const src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
					apiKey,
				)}`;
				if (!document.querySelector(`script[src='${src}']`)) {
					await new Promise<void>((resolve, reject) => {
						const s = document.createElement('script');
						s.src = src;
						s.async = true;
						s.onload = () => resolve();
						s.onerror = () =>
							reject(new Error('Failed to load Google Maps'));
						document.head.appendChild(s);
					});
				}
			}

			if (canceled) return;
			const g = (window as any).google as any;
			if (!g?.maps) return;
			const map = new g.maps.Map(containerRef.current as HTMLElement, {
				center: {
					lat: value?.[1] ?? center[1],
					lng: value?.[0] ?? center[0],
				},
				fullscreenControl: false,
				mapTypeControl: false,
				streetViewControl: false,
				zoom,
			});
			map.addListener('click', (e: any) => {
				const lat = e.latLng?.lat();
				const lng = e.latLng?.lng();
				if (lat == null || lng == null) return;
				const coords: [number, number] = [lng, lat];
				onPick(coords);
				if (!markerRef.current) {
					markerRef.current = new g.maps.Marker({
						map,
						position: { lat, lng },
					});
				} else {
					markerRef.current.setPosition({ lat, lng });
				}
			});
			mapRef.current = map;
			if (value) {
				markerRef.current = new g.maps.Marker({
					map,
					position: { lat: value[1], lng: value[0] },
				});
			}
		};

		load();
		return () => {
			canceled = true;
			if (markerRef.current) {
				markerRef.current.setMap(null);
				markerRef.current = null;
			}
			mapRef.current = null;
		};
	}, [containerRef, apiKey]);

	useEffect(() => {
		const g = (window as any).google as any | undefined;
		const map = mapRef.current;
		if (!map || !g?.maps) return;
		if (value) {
			const pos = { lat: value[1], lng: value[0] };
			if (!markerRef.current) {
				markerRef.current = new g.maps.Marker({ map, position: pos });
			} else {
				markerRef.current.setPosition(pos);
			}
		} else if (markerRef.current) {
			markerRef.current.setMap(null);
			markerRef.current = null;
		}
	}, [value]);

	return null;
};

export default GoogleMap;
