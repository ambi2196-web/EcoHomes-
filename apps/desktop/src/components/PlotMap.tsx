/**
 * PlotMap — Interactive Leaflet map for plot location selection.
 * Click anywhere to drop a pin. Supports address search + manual pin.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon path issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  lat: number | null;
  lng: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
}

export default function PlotMap({ lat, lng, onLocationSelect, height = "380px" }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Init map centered on India
    const map = L.map(containerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
    });

    // OpenStreetMap tiles (completely free, no key)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Click to place pin
    map.on("click", (e: L.LeafletMouseEvent) => {
      placeMarker(map, e.latlng.lat, e.latlng.lng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    // If we already have a location, centre and pin it
    if (lat && lng) {
      map.setView([lat, lng], 14);
      placeMarker(map, lat, lng);
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // When lat/lng prop changes externally (from address search), update map
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;
    mapRef.current.setView([lat, lng], 15);
    placeMarker(mapRef.current, lat, lng);
  }, [lat, lng]);

  function placeMarker(map: L.Map, lat: number, lng: number) {
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true })
        .addTo(map)
        .bindPopup("📍 Your plot location<br/><small>Drag to adjust</small>")
        .openPopup();

      // Allow dragging the marker
      markerRef.current.on("dragend", (e: any) => {
        const pos = e.target.getLatLng();
        onLocationSelect(pos.lat, pos.lng);
      });
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: "12px", overflow: "hidden" }}
      className="border border-earth-200"
    />
  );
}
