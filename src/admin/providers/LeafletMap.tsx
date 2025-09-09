import React, { useEffect, useRef } from "react";
// Importing CSS ensures consistent visuals when host app bundles CSS
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export const LeafletMap: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  center: [number, number];
  zoom: number;
  value: [number, number] | null;
  onPick: (coords: [number, number]) => void;
}> = ({ containerRef, center, zoom, value, onPick }) => {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Dynamically import leaflet to avoid requiring it server-side
    let Lmod: any;
    let mapInst: any;
    (async () => {
      Lmod = L;
      mapInst = L.map(containerRef.current!).setView(value ?? center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInst);
      mapInst.on("click", (e: any) => {
        const coords: [number, number] = [e.latlng.lng, e.latlng.lat];
        onPick(coords);
        if (!markerRef.current) {
          markerRef.current = L.marker([coords[1], coords[0]]).addTo(mapInst);
        } else {
          markerRef.current.setLatLng([coords[1], coords[0]]);
        }
      });
      mapRef.current = mapInst;
      if (value) {
        markerRef.current = L.marker([value[1], value[0]]).addTo(mapInst);
      }
    })();

    return () => {
      try {
        if (markerRef.current) {
          markerRef.current.remove();
          markerRef.current = null;
        }
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch {}
    };
  }, [containerRef]);

  useEffect(() => {
    const map = mapRef.current;
    const L = (globalThis as any).L || undefined; // not guaranteed
    if (!map) return;
    if (value) {
      if (!markerRef.current && L) {
        markerRef.current = L.marker([value[1], value[0]]).addTo(map);
      } else if (markerRef.current) {
        markerRef.current.setLatLng([value[1], value[0]]);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [value]);

  return null;
};

export default LeafletMap;
