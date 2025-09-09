import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useRef } from "react";

export const MapboxMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  accessToken: string;
  center: [number, number];
  zoom: number;
  theme: "light" | "dark";
  value: [number, number] | null;
  onPick: (coords: [number, number]) => void;
}> = ({ containerRef, accessToken, center, zoom, theme, value, onPick }) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const styleURL =
    theme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/outdoors-v12";

  useEffect(() => {
    if (!containerRef.current) return;
    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleURL,
      center: value ?? center,
      zoom,
      maxZoom: 16,
      minZoom: 1,
    });
    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    map.on("click", (e) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      onPick(coords);
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker().setLngLat(coords).addTo(map);
      } else {
        markerRef.current.setLngLat(coords);
      }
    });
    mapRef.current = map;
    if (value) {
      markerRef.current = new mapboxgl.Marker().setLngLat(value).addTo(map);
    }
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [containerRef, accessToken, styleURL]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (value) {
      if (!markerRef.current) {
        markerRef.current = new mapboxgl.Marker().setLngLat(value).addTo(map);
      } else {
        markerRef.current.setLngLat(value);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [value]);

  return null;
};

export default MapboxMap;
