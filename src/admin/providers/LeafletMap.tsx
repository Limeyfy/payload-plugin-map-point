import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type LngLat = [number, number]; // [lng, lat]
type LatLng = [number, number]; // [lat, lng]

function toLatLng([lng, lat]: LngLat): LatLng {
  return [lat, lng];
}

export const LeafletMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  center: LatLng; // keep this as [lat, lng] since it's your "display" center
  zoom: number;
  value: LngLat | null; // external value stays [lng, lat]
  onPick: (coords: LngLat) => void; // emits [lng, lat]
}> = ({ containerRef, center, zoom, value, onPick }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Create map once
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      value ? toLatLng(value) : center,
      zoom
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      const coords: LngLat = [e.latlng.lng, e.latlng.lat]; // emit [lng,lat]
      onPick(coords);
      const ll = toLatLng(coords);
      if (!markerRef.current) {
        markerRef.current = L.marker(ll).addTo(map);
      } else {
        markerRef.current.setLatLng(ll);
      }
    });

    mapRef.current = map;

    if (value) {
      markerRef.current = L.marker(toLatLng(value)).addTo(map);
    }

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [containerRef]); // create once when the container exists

  // Keep marker in sync with external value
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (value) {
      const ll = toLatLng(value);
      if (!markerRef.current) {
        markerRef.current = L.marker(ll).addTo(map);
      } else {
        markerRef.current.setLatLng(ll);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [value]);

  // Respond to center / zoom changes (optional)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Prefer value if present; otherwise use provided center
    const target = value ? toLatLng(value) : center;
    map.setView(target, zoom);
  }, [center, zoom, value]);

  return null;
};

export default LeafletMap;