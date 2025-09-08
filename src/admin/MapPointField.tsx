import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { AdminFieldProps } from "./types";
import { useConfig, useTheme } from "@payloadcms/ui";

const defaultCenter: [number, number] = [0, 0];
const defaultZoom = 1;

export default function MapPointField(props: AdminFieldProps) {
	const { value, onChange, field } = props;
	const options = field?.admin?.mapPoint || {};
	const { theme } = useTheme();
	const { config } = useConfig();

	const mapContainer = useRef<HTMLDivElement>(null);

	const [query, setQuery] = useState("");
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [coords, setCoords] = useState<[number, number] | null>(null); // [lng, lat]

	const apiKey = config.custom?.mapPointPluginOptions?.publicMapKey as
		| string
		| undefined;

	const mapStyleURL =
		theme === "dark"
			? "mapbox://styles/mapbox/dark-v11"
			: "mapbox://styles/mapbox/streets-v12";

	const ui =
		theme === "dark"
			? {
					border: "#374151",
					bg: "#111827",
					bgAlt: "#1f2937",
					text: "#e5e7eb",
					subtle: "#9ca3af",
					pin: "#ef4444",
					pinBorder: "#111827",
				}
			: {
					border: "#cccccc",
					bg: "#ffffff",
					bgAlt: "#fafafa",
					text: "#111111",
					subtle: "#555555",
					pin: "#ef4444",
					pinBorder: "#ffffff",
				};

	useEffect(() => {
		mapboxgl.accessToken = "CHANGE";

		if (mapContainer.current) {
			const map = new mapboxgl.Map({
				container: mapContainer.current,
				style: "mapbox://styles/mapbox/outdoors-v12",
				center: coords || [60.656576, 11.907293],
				zoom: 14,
				maxZoom: 16,
				minZoom: 10,
			});

			map.addControl(new mapboxgl.NavigationControl(), "top-left");
			if (coords) {
				new mapboxgl.Marker().setLngLat(coords).addTo(map);
			}

			return () => map.remove();
		}
	}, [coords]);

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
