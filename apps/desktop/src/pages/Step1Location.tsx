import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search, ArrowRight, Loader2, Navigation } from "lucide-react";
import { useProjectStore } from "../store/projectStore";
import PlotMap from "../components/PlotMap";

// Nominatim geocoding — free, no key
async function geocodeAddress(query: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=in`,
    { headers: { "Accept-Language": "en" } }
  );
  return res.json();
}

// Reverse geocode lat/lng → address
async function reverseGeocode(lat: number, lng: number) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  return res.json();
}

export default function Step1Location() {
  const navigate = useNavigate();
  const { location, setLocation } = useProjectStore();

  const [search, setSearch] = useState(location?.address?.split(",")[0] ?? "");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [pinLat, setPinLat] = useState<number | null>(location?.lat ?? null);
  const [pinLng, setPinLng] = useState<number | null>(location?.lng ?? null);
  const [selected, setSelected] = useState(location);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const data = await geocodeAddress(search);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const handleResultSelect = (result: any) => {
    const loc = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village || "",
      state: result.address?.state || "",
    };
    setSelected(loc);
    setPinLat(loc.lat);
    setPinLng(loc.lng);
    setResults([]);
    setSearch(loc.city || result.display_name.split(",")[0]);
  };

  // Called when user clicks on map or drags marker
  const handleMapPin = useCallback(async (lat: number, lng: number) => {
    setPinLat(lat);
    setPinLng(lng);
    setReverseLoading(true);
    try {
      const data = await reverseGeocode(lat, lng);
      const loc = {
        lat,
        lng,
        address: data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || "",
        state: data.address?.state || "",
      };
      setSelected(loc);
      setSearch(loc.city || loc.address.split(",")[0]);
    } catch {
      setSelected({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, city: "", state: "" });
    } finally {
      setReverseLoading(false);
    }
  }, []);

  const handleNext = () => {
    if (!selected) return;
    setLocation(selected);
    navigate("/wizard/step2");
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Where is your plot?</h2>
        <p className="text-gray-500 mt-1">
          Search for your location or click anywhere on the map to drop a pin on your plot.
        </p>
      </div>

      {/* Search */}
      <div className="card space-y-3 pb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setResults([]); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search city, area or address in India…"
            className="flex-1 border border-earth-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-400"
          />
          <button onClick={handleSearch} disabled={loading}
            className="btn-primary flex items-center gap-2 py-2.5 px-4">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            Search
          </button>
        </div>

        {/* Autocomplete results */}
        {results.length > 0 && (
          <ul className="border border-earth-200 rounded-lg divide-y divide-earth-100 max-h-48 overflow-y-auto shadow-sm">
            {results.map((r) => (
              <li key={r.place_id}>
                <button onClick={() => handleResultSelect(r)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-earth-50 flex items-start gap-2">
                  <MapPin size={13} className="text-forest-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">{r.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Navigation size={14} className="text-forest-500" />
          <span>Click on the map to place a pin exactly on your plot. You can drag the pin to fine-tune.</span>
        </div>
        <PlotMap lat={pinLat} lng={pinLng} onLocationSelect={handleMapPin} height="360px" />
      </div>

      {/* Selected location card */}
      {selected && (
        <div className="bg-forest-50 border border-forest-200 rounded-xl px-4 py-3 flex items-start gap-3">
          {reverseLoading
            ? <Loader2 size={16} className="text-forest-500 mt-0.5 animate-spin shrink-0" />
            : <MapPin size={16} className="text-forest-600 mt-0.5 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-forest-800">Selected Location</p>
            <p className="text-sm text-forest-700 mt-0.5 truncate">{selected.address}</p>
            <div className="flex gap-4 mt-1">
              <span className="text-xs text-forest-600">Lat: {selected.lat.toFixed(5)}</span>
              <span className="text-xs text-forest-600">Lng: {selected.lng.toFixed(5)}</span>
              {selected.state && <span className="text-xs text-forest-600">{selected.state}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button onClick={handleNext} disabled={!selected}
          className="btn-primary flex items-center gap-2">
          Next: Requirements <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
