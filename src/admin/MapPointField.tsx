import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type PointValue = [number, number] | null;

type MapPointAdminOptions = {
	defaultCenter?: [number, number];
	defaultZoom?: number;
	geocoder?: {
		provider?: "mapbox" | "nominatim";
		apiKey?: string;
		placeholder?: string;
	};
};

type FieldLike = {
	name: string;
	label?: string;
	admin?: {
		readOnly?: boolean;
		mapPoint?: MapPointAdminOptions;
	};
};

// Loose typing based on Payload custom field component props to avoid importing admin types
type Props = {
	path: string;
	field: FieldLike;
	value: PointValue;
	onChange: (val: PointValue) => void;
};

const defaultCenter: [number, number] = [0, 0];
const defaultZoom = 1;

export default function MapPointField(props: Props) {
	const { value, onChange, field } = props;
	const options: MapPointAdminOptions = field?.admin?.mapPoint || {};

	const containerRef = useRef<HTMLDivElement | null>(null);
	const mapRef = useRef<any>(null);
	const markerRef = useRef<any>(null);

	const [mapboxgl, setMapbox] = useState<any>(null);
	const [query, setQuery] = useState("");

	const center = useMemo(
		() => value ?? options.defaultCenter ?? defaultCenter,
		[value, options.defaultCenter],
	);
	const zoom = useMemo(
		() => (value ? 12 : (options.defaultZoom ?? defaultZoom)),
		[value, options.defaultZoom],
	);

	useEffect(() => {
		// Dynamically import mapbox-gl only in the browser
		let mounted = true;
		import("mapbox-gl").then((m) => {
			if (!mounted) return;
			setMapbox((m as any).default ?? (m as any));
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

		(mapboxgl as any).accessToken = accessToken;

		const map = new mapboxgl.Map({
			container: containerRef.current,
			style: "mapbox://styles/mapbox/streets-v12",
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

		map.on("click", (e: any) => {
			const { lng, lat } = e.lngLat;
			updateMarker(lng, lat);
			onChange([lng, lat]);
		});

		return () => {
			map.remove();
			mapRef.current = null;
			markerRef.current = null;
		};
	}, [mapboxgl, accessToken]);

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

	const geocode = useCallback(async () => {
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
				const data = await res.json();
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
				const data = await res.json();
				const item = data?.[0];
				if (item?.lon && item?.lat) {
					lng = Number(item.lon);
					lat = Number(item.lat);
				}
			}

			if (lng != null && lat != null && mapRef.current) {
				mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
				onChange([lng, lat]);
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
						style={{ flex: 1, padding: 8 }}
					/>
					<button
						type="button"
						onClick={geocode}
						style={{ padding: "8px 12px" }}
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
						border: "1px dashed #ccc",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "#666",
						background: "#fafafa",
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
						border: "1px solid #ccc",
					}}
				/>
			)}

			<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
				<small style={{ opacity: 0.8 }}>
					{value
						? `Lng, Lat: ${value[0].toFixed(6)}, ${value[1].toFixed(6)}`
						: "Click the map to set a point"}
				</small>
				{value && (
					<button
						type="button"
						onClick={() => onChange(null)}
						style={{ marginLeft: "auto", padding: "6px 10px" }}
					>
						Clear
					</button>
				)}
			</div>
		</div>
	);
}
