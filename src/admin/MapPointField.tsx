import { useField } from "@payloadcms/ui";
import { useCallback, useMemo, useRef, useState } from "react";
import { envGoogleKey, envMapboxKey } from "../token";
import { CustomPointFieldClientProps } from "./config";
import { Footer, SearchBar, useUI } from "./shared";
import MapboxMap from "./providers/MapboxMap";
import LeafletMap from "./providers/LeafletMap";
import GoogleMap from "./providers/GoogleMap";

export default function MapPointField(props: CustomPointFieldClientProps) {
  const options = props.field?.admin?.mapPoint || {};
  const ui = useUI();

  const mapContainer = useRef<HTMLDivElement>(null);
  const { value, setValue } = useField({ path: props.path });

  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(
    Array.isArray(value) ? (value as [number, number]) : null,
  );

  const defaultCenter: [number, number] = useMemo(
    () => options.defaultCenter ?? [60.6, 11.9],
    [options.defaultCenter],
  );
  const defaultZoom = useMemo(() => options.defaultZoom ?? 12, [options.defaultZoom]);

  const mapProvider = options.map?.provider ?? "mapbox";
  const mapApiKey =
    options.map?.apiKey || options.geocoder?.apiKey ||
    (mapProvider === "google" ? envGoogleKey : envMapboxKey) ||
    props.apiKey; // backward-compat

  const geocode = useCallback(async (): Promise<void> => {
    const provider = options?.geocoder?.provider || (mapProvider === "leaflet" ? "nominatim" : mapProvider);
    const apiKey = options?.geocoder?.apiKey || mapApiKey;
    const q = query.trim();
    if (!q) return;

    try {
      let lng: number | null = null;
      let lat: number | null = null;
      if (provider === "mapbox") {
        if (!apiKey) return;
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${apiKey}`;
        const res = await fetch(url);
        const data: { features?: Array<{ center?: [number, number] }> } = await res.json();
        const center = data?.features?.[0]?.center;
        if (Array.isArray(center) && center.length >= 2) {
          lng = Number(center[0]);
          lat = Number(center[1]);
        }
      } else if (provider === "google") {
        if (!apiKey) return;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${apiKey}`;
        const res = await fetch(url);
        const data: any = await res.json();
        const loc = data?.results?.[0]?.geometry?.location;
        if (loc?.lng != null && loc?.lat != null) {
          lng = Number(loc.lng);
          lat = Number(loc.lat);
        }
      } else {
        // nominatim by default
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;
        const res = await fetch(url, { headers: { "Accept-Language": "en" } });
        const data: Array<{ lon?: string | number; lat?: string | number }> = await res.json();
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
  }, [options?.geocoder?.provider, options?.geocoder?.apiKey, mapApiKey, query, mapProvider, setValue]);

  const onPick = useCallback(
    (pt: [number, number]) => {
      setCoords(pt);
      setValue(pt);
    },
    [setValue],
  );

  const needsKey = mapProvider === "mapbox" || mapProvider === "google";
  const hasKey = !needsKey || !!mapApiKey;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {(options?.geocoder?.provider || options?.geocoder?.apiKey) && (
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={geocode}
          placeholder={options?.geocoder?.placeholder}
        />
      )}

      {!hasKey ? (
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
          {mapProvider === "google"
            ? "Google Maps API key required to render map."
            : "Mapbox access token required to render map."}
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
        >
          {mapProvider === "mapbox" && (
            <MapboxMap
              containerRef={mapContainer}
              accessToken={mapApiKey as string}
              center={defaultCenter}
              zoom={defaultZoom}
              theme={ui.theme === "dark" ? "dark" : "light"}
              value={coords}
              onPick={onPick}
            />
          )}
          {mapProvider === "leaflet" && (
            <LeafletMap
              containerRef={mapContainer}
              center={defaultCenter}
              zoom={defaultZoom}
              value={coords}
              onPick={onPick}
            />
          )}
          {mapProvider === "google" && (
            <GoogleMap
              containerRef={mapContainer}
              apiKey={mapApiKey as string}
              center={defaultCenter}
              zoom={defaultZoom}
              value={coords}
              onPick={onPick}
            />
          )}
        </div>
      )}

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
