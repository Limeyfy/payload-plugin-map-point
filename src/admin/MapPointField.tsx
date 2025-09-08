import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
	Map as MapboxMap,
	Marker as MapboxMarker,
	MapMouseEvent,
} from "mapbox-gl";
import type { AdminFieldProps } from "./types";

const defaultCenter: [number, number] = [0, 0];
const defaultZoom = 1;

export default function MapPointField(props: AdminFieldProps) {
	const { value, onChange, field } = props;
	const options = field?.admin?.mapPoint || {};

	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<MapboxMap | null>(null);
	const markerRef = useRef<MapboxMarker | null>(null);

	type MapboxModule = {
		Map: new (options: unknown) => MapboxMap;
		Marker: new (options?: unknown) => MapboxMarker;
		accessToken: string;
	};
	const [mapboxgl, setMapbox] = useState<MapboxModule | null>(null);
	const [query, setQuery] = useState("");

	// Detect system/admin dark mode to switch map styles + UI colors
	const [prefersDark, setPrefersDark] = useState<boolean>(() =>
		typeof window !== "undefined"
			? window.matchMedia &&
				window.matchMedia("(prefers-color-scheme: dark)").matches
			: false,
	);

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
		if (mql.addEventListener) mql.addEventListener("change", handler);
		else mql.addListener(handler);
		return () => {
			if (mql.removeEventListener) mql.removeEventListener("change", handler);
			else mql.removeListener(handler);
		};
	}, []);

	const center = useMemo(
		() => value ?? options.defaultCenter ?? defaultCenter,
		[value, options.defaultCenter],
	);
	const zoom = useMemo(
		() => (value ? 12 : (options.defaultZoom ?? defaultZoom)),
		[value, options.defaultZoom],
	);

	const mapStyleURL = prefersDark
		? "mapbox://styles/mapbox/dark-v11"
		: "mapbox://styles/mapbox/streets-v12";

	const ui = prefersDark
		? {
				border: "#374151",
				bg: "#111827",
				bgAlt: "#1f2937",
				text: "#e5e7eb",
				subtle: "#9ca3af",
			}
		: {
				border: "#cccccc",
				bg: "#ffffff",
				bgAlt: "#fafafa",
				text: "#111111",
				subtle: "#555555",
			};

	useEffect(() => {
		// Dynamically import mapbox-gl only in the browser
		let mounted = true;
		import("mapbox-gl").then((m) => {
			if (!mounted) return;
			const mod = m as unknown as { default?: MapboxModule } & MapboxModule;
			setMapbox(mod.default ?? (mod as unknown as MapboxModule));
		});
		return () => {
			mounted = false;
		};
	}, []);

	const accessToken = options?.geocoder?.apiKey;

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!mapboxgl) return;
		if (!containerRef.current) return;
		if (!accessToken) return;

		mapboxgl.accessToken = accessToken;

		const map = new mapboxgl.Map({
			container: containerRef.current,
			style: mapStyleURL,
			center: center ?? defaultCenter,
			zoom: zoom ?? defaultZoom,
			attributionControl: true,
		});
		mapRef.current = map;

		const updateMarker = (lng: number, lat: number) => {
			if (!mapRef.current || !mapboxgl) return;
			if (!markerRef.current) {
				markerRef.current = new mapboxgl.Marker({ draggable: false });
			}
			markerRef.current.setLngLat([lng, lat]).addTo(mapRef.current);
		};

		if (value && Array.isArray(value) && value.length === 2) {
			updateMarker(value[0], value[1]);
		}

		map.on("click", (e: MapMouseEvent) => {
			const { lng, lat } = e.lngLat;
			updateMarker(lng, lat);
			if (typeof onChange === "function") onChange([lng, lat]);
		});

		return () => {
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
		};
	}, [mapboxgl, accessToken]);

	// Update map style when theme changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!mapRef.current || !mapboxgl || !accessToken) return;
		try {
			mapRef.current.setStyle(mapStyleURL);
		} catch {
			// ignore style changes if map not ready
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [prefersDark]);

	useEffect(() => {
		// Keep marker in sync if value changes externally
		if (!mapRef.current || !mapboxgl || !accessToken) return;
		if (value && Array.isArray(value) && value.length === 2) {
			if (!markerRef.current) {
				markerRef.current = new mapboxgl.Marker({ draggable: false });
			}
			markerRef.current.setLngLat(value);
		}
	}, [value, mapboxgl, accessToken]);

	const geocode = useCallback(async (): Promise<void> => {
		const provider = options?.geocoder?.provider;
		const apiKey = options?.geocoder?.apiKey;
		const q = query.trim();
		if (!q) return;

		try {
			let lng: number | null = null;
			let lat: number | null = null;
			if (provider === "mapbox") {
				if (!apiKey) return;
				const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${apiKey}`;
				const res = await fetch(url);
				const data: { features?: Array<{ center?: [number, number] }> } =
					await res.json();
				const center = data?.features?.[0]?.center;
				if (Array.isArray(center) && center.length >= 2) {
					lng = Number(center[0]);
					lat = Number(center[1]);
				}
			} else if (provider === "nominatim" || !provider) {
				const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
				const res = await fetch(url, {
					headers: {
						"Accept-Language": "en",
					},
				});
				const data: Array<{ lon?: string | number; lat?: string | number }> =
					await res.json();
				const item = data?.[0];
				if (item?.lon && item?.lat) {
					lng = Number(item.lon);
					lat = Number(item.lat);
				}
			}

			if (lng != null && lat != null && mapRef.current) {
				mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
				if (typeof onChange === "function") onChange([lng, lat]);
			}
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn("Geocoding failed", e);
		}
	}, [options?.geocoder?.provider, options?.geocoder?.apiKey, query, onChange]);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
			{(options?.geocoder?.provider || options?.geocoder?.apiKey) && (
				<div style={{ display: "flex", gap: 8 }}>
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") geocode();
						}}
						placeholder={options?.geocoder?.placeholder || "Search location"}
						style={{
							flex: 1,
							padding: 8,
							background: ui.bg,
							color: ui.text,
							border: `1px solid ${ui.border}`,
							borderRadius: 6,
						}}
					/>
					<button
						type="button"
						onClick={geocode}
						style={{
							padding: "8px 12px",
							background: ui.bgAlt,
							color: ui.text,
							border: `1px solid ${ui.border}`,
							borderRadius: 6,
							cursor: "pointer",
						}}
					>
						Search
					</button>
				</div>
			)}

			{!accessToken ? (
				<div
					style={{
						width: "100%",
						height: 320,
						borderRadius: 6,
						border: `1px dashed ${ui.border}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: ui.subtle,
						background: ui.bgAlt,
					}}
				>
					Mapbox access token required to render map.
				</div>
			) : (
				<div
					ref={containerRef}
					style={{
						width: "100%",
						height: 320,
						borderRadius: 6,
						overflow: "hidden",
						border: `1px solid ${ui.border}`,
					}}
				/>
			)}

			<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<small style={{ opacity: 0.9, color: ui.subtle }}>
					{value
						? `Lng, Lat: ${value[0].toFixed(6)}, ${value[1].toFixed(6)}`
						: "Click the map to set a point"}
				</small>
				{value && (
					<button
						type="button"
						onClick={() => typeof onChange === "function" && onChange(null)}
						style={{
							marginLeft: "auto",
							padding: "6px 10px",
							background: ui.bgAlt,
							color: ui.text,
							border: `1px solid ${ui.border}`,
							borderRadius: 6,
							cursor: "pointer",
						}}
					>
						Clear
					</button>
				)}
			</div>
		</div>
	);
}
