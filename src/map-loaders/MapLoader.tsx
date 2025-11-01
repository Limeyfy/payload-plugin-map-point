"use client";
import { lazy, Suspense, useRef } from "react";
import type { MapProvider } from "../types";
import { useUI } from "../admin/shared";

const MapboxMap = lazy(() => import("../admin/providers/MapboxMap"));
const LeafletMap = lazy(() => import("../admin/providers/LeafletMap"));
const GoogleMap = lazy(() => import("../admin/providers/GoogleMap"));

export type MapLoaderProps = {
  provider: MapProvider;
  apiKey?: string;
  defaultCenter: [number, number];
  defaultZoom: number;
  value: [number, number] | null;
  onPick: (coords: [number, number]) => void;
};

export function MapLoader({
  provider,
  apiKey,
  defaultCenter,
  defaultZoom,
  value,
  onPick,
}: MapLoaderProps) {
  const ui = useUI();
  const mapContainer = useRef<HTMLDivElement>(null);

  const needsKey = provider === "mapbox" || provider === "google";
  const hasKey = !needsKey || !!apiKey;

  if (!hasKey) {
    return (
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
        {provider === "google"
          ? "Google Maps API key required to render map."
          : "Mapbox access token required to render map."}
      </div>
    );
  }

  return (
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
      <Suspense>
        {provider === "mapbox" && (
          <MapboxMap
            containerRef={mapContainer}
            accessToken={apiKey as string}
            center={defaultCenter}
            zoom={defaultZoom}
            theme={ui.theme === "dark" ? "dark" : "light"}
            value={value}
            onPick={onPick}
          />
        )}
        {provider === "leaflet" && (
          <LeafletMap
            containerRef={mapContainer}
            center={defaultCenter}
            zoom={defaultZoom}
            value={value}
            onPick={onPick}
          />
        )}
        {provider === "google" && (
          <GoogleMap
            containerRef={mapContainer}
            apiKey={apiKey as string}
            center={defaultCenter}
            zoom={defaultZoom}
            value={value}
            onPick={onPick}
          />
      )}
      </Suspense>
    </div>
  );
}
