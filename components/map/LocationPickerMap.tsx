"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Navigation, Crosshair, Check, AlertCircle } from "lucide-react";
import { CITY_COORDINATES } from "./PropertyMap";

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

interface LocationPickerMapProps {
  latitude: number;
  longitude: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
  city?: string;
  locality?: string;
  className?: string;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  city,
  locality,
  className = "w-full h-80 sm:h-96",
}: LocationPickerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLng = longitude || 77.5946;
    const initialLat = latitude || 12.9716;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: [initialLng, initialLat],
      zoom: 15,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.addControl(
      new NavigationControl({
        showCompass: false,
        visualizePitch: false,
      }),
      "bottom-right"
    );

    // Custom Draggable Pin Element
    const pinEl = document.createElement("div");
    pinEl.className = "relative flex items-center justify-center cursor-grab active:cursor-grabbing";
    pinEl.innerHTML = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(0, -50%);">
        <span style="position: absolute; display: inline-flex; height: 36px; width: 36px; border-radius: 9999px; background-color: #6366f1; opacity: 0.6; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 42px; width: 42px; border-radius: 9999px; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: white; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.45); border: 3px solid white;">
          <svg style="height: 22px; width: 22px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
    `;

    const marker = new Marker({
      element: pinEl,
      draggable: true,
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    // Marker drag end event
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onChange({
        latitude: Number(lngLat.lat.toFixed(6)),
        longitude: Number(lngLat.lng.toFixed(6)),
      });
    });

    // Click map to reposition marker
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onChange({
        latitude: Number(e.lngLat.lat.toFixed(6)),
        longitude: Number(e.lngLat.lng.toFixed(6)),
      });
    });

    map.on("load", () => {
      map.resize();
    });

    mapRef.current = map;
    markerRef.current = marker;

    const timer = setTimeout(() => map.resize(), 300);

    return () => {
      clearTimeout(timer);
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update marker position & map center when props change externally
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (typeof latitude !== "number" || typeof longitude !== "number") return;

    const currentPos = markerRef.current.getLngLat();
    const diffLat = Math.abs(currentPos.lat - latitude);
    const diffLng = Math.abs(currentPos.lng - longitude);

    // Only update if there is a noticeable difference (to prevent loops during drag)
    if (diffLat > 0.0001 || diffLng > 0.0001) {
      markerRef.current.setLngLat([longitude, latitude]);
      mapRef.current.flyTo({
        center: [longitude, latitude],
        essential: true,
        duration: 800,
      });
    }
  }, [latitude, longitude]);

  // Handle "Use My Current Location"
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));

        onChange({ latitude: lat, longitude: lng });

        if (mapRef.current && markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 16.5,
            duration: 1200,
          });
        }
      },
      (err) => {
        setIsLocating(false);
        setGeoError(
          err.code === 1
            ? "Location permission denied. Please allow location access or click the map manually."
            : "Could not retrieve your current location. Please click the map to place the pin."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onChange]);

  return (
    <div className="space-y-3">
      {/* Action Bar Above Map */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-900">
            Pin Property Location on Map
          </span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">
            (Click map or drag the pin)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition-colors disabled:opacity-50"
            title="Detect GPS location"
          >
            <Navigation className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
            <span>{isLocating ? "Locating..." : "Use My Current Location"}</span>
          </button>
        </div>
      </div>

      {geoError && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Map Container */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 shadow-inner bg-zinc-100">
        <div ref={mapContainerRef} className={className} />

        {/* Floating Coordinates Chip */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md px-3 py-1.5 text-xs font-medium text-zinc-800 shadow-md border border-zinc-200/80">
          <MapPin className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          <span className="font-mono text-[11px]">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
          <span className="rounded-md bg-emerald-50 text-emerald-700 font-semibold px-1.5 py-0.5 text-[10px] border border-emerald-200">
            Pinned
          </span>
        </div>
      </div>

      {/* Numeric Coordinates manual inputs for power users / fine tuning */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
            Latitude (e.g., from Google Maps)
          </label>
          <input
            type="number"
            step="0.000001"
            value={latitude}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChange({ latitude: val, longitude });
            }}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-mono text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-zinc-600 mb-1">
            Longitude (e.g., from Google Maps)
          </label>
          <input
            type="number"
            step="0.000001"
            value={longitude}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) onChange({ latitude, longitude: val });
            }}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-mono text-zinc-900 focus:bg-white focus:border-indigo-600 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
