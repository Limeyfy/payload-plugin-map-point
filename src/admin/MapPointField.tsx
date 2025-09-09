import { useField, useTheme } from "@payloadcms/ui";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { envPublicKey } from "../token";
import { CustomPointFieldClientProps } from "./config";

export default function MapPointField(props: CustomPointFieldClientProps) {
	const options = props.field?.admin?.mapPoint || {};
	const { theme } = useTheme();

	const mapContainer = useRef<HTMLDivElement>(null);

	const { value, setValue } = useField({ path: props.path });

	const [query, setQuery] = useState("");
	const [coords, setCoords] = useState<[number, number] | null>(
		Array.isArray(value) ? (value as [number, number]) : null,
	);

	const apiKey = props.apiKey || (envPublicKey as string | undefined);

	const mapStyleURL =
		theme === "dark"
			? "mapbox://styles/mapbox/dark-v11"
			: "mapbox://styles/mapbox/outdoors-v12";

	const ui =
		theme === "dark"
			? {
					border: "var(--theme-border-color)",
					bg: "var(--theme-elevation-200)",
					bgAlt: "var(--theme-elevation-150)",
					text: "var(--theme-elevation-900)",
					subtle: "var(--theme-elevation-400)",
					pin: "var(--theme-error-400)",
					pinBorder: "var(--theme-elevation-200)",
				}
			: {
					border: "var(--theme-border-color)",
					bg: "var(--theme-elevation-0)",
					bgAlt: "var(--theme-elevation-50)",
					text: "var(--theme-elevation-900)",
					subtle: "var(--theme-elevation-500)",
					pin: "var(--theme-error-400)",
					pinBorder: "var(--theme-elevation-0)",
				};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		mapboxgl.accessToken = apiKey || envPublicKey;

		if (mapContainer.current) {
			const map = new mapboxgl.Map({
				container: mapContainer.current,
				style: mapStyleURL,
				center: coords || [60.6, 11.9],
				zoom: 12,
				maxZoom: 16,
				minZoom: 10,
			});

			map.on("click", (e) => {
				setCoords([e.lngLat.lng, e.lngLat.lat]);
				setValue([e.lngLat.lng, e.lngLat.lat]);
			});

			map.addControl(new mapboxgl.NavigationControl(), "top-left");
			if (coords) {
				new mapboxgl.Marker().setLngLat(coords).addTo(map);
			}

			return () => map.remove();
		}
	}, [coords, mapStyleURL, apiKey]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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

			if (lng != null && lat != null) {
				setCoords([lng, lat]);
				setValue([lng, lat]);
			}
		} catch (e) {
			// eslint-disable-next-line no-console
			console.warn("Geocoding failed", e);
		}
	}, [options?.geocoder?.provider, options?.geocoder?.apiKey, query]);

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

			{!apiKey ? (
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
					ref={mapContainer}
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
						? `Lng, Lat: ${(value as [number, number])[0]?.toFixed(6)}, ${(value as [number, number])[1]?.toFixed(6)}`
						: "Click the map to set a point"}
				</small>
				<button
					type="button"
					disabled={!!value}
					onClick={() => setValue(null)}
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
			</div>
		</div>
	);
}
