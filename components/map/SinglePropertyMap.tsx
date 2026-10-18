"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  Popup,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Navigation, ExternalLink, Compass, Loader2 } from "lucide-react";
import { calculateDistanceKm, formatDistance } from "@/lib/geo";

// Bulletproof OpenStreetMap raster style (Zero API keys, zero external font/sprite dependencies, 100% reliable)
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
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

interface SinglePropertyMapProps {
  propertyName: string;
  addressLine1: string;
  locality: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  className?: string;
}

export function SinglePropertyMap({
  propertyName,
  addressLine1,
  locality,
  city,
  latitude,
  longitude,
  className = "w-full h-80 sm:h-96",
}: SinglePropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const hasValidCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  useEffect(() => {
    if (!mapContainerRef.current || !hasValidCoordinates) return;
    if (mapRef.current) return;

    const lat = latitude!;
    const lng = longitude!;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: [lng, lat],
      zoom: 14.5,
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

    // Create custom pulsing pin marker
    const el = document.createElement("div");
    el.className = "relative flex items-center justify-center cursor-pointer";
    el.innerHTML = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; display: inline-flex; height: 32px; width: 32px; border-radius: 9999px; background-color: #818cf8; opacity: 0.75; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="position: relative; display: flex; align-items: center; justify-content: center; height: 38px; width: 38px; border-radius: 9999px; background-color: #4f46e5; color: white; box-shadow: 0 4px 14px rgba(0,0,0,0.3); border: 3px solid white;">
          <svg style="height: 20px; width: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
    `;

    // Add popup with property title & locality
    const popup = new Popup({ offset: 25, closeButton: false }).setHTML(`
      <div style="padding: 6px 8px; font-family: system-ui, -apple-system, sans-serif;">
        <p style="font-weight: 800; font-size: 13px; color: #09090b; margin: 0 0 2px 0;">${propertyName}</p>
        <p style="font-size: 11px; color: #71717a; margin: 0;">${locality}, ${city}</p>
      </div>
    `);

    new Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    map.on("load", () => {
      map.resize();
    });

    mapRef.current = map;

    const timer1 = setTimeout(() => map.resize(), 150);
    const timer2 = setTimeout(() => map.resize(), 500);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [hasValidCoordinates, latitude, longitude, propertyName, locality, city]);

  const [userDistance, setUserDistance] = useState<string | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const handleCheckDistance = () => {
    if (!navigator.geolocation || !hasValidCoordinates) return;
    setIsCalculatingDistance(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = calculateDistanceKm(
          pos.coords.latitude,
          pos.coords.longitude,
          latitude!,
          longitude!
        );
        setUserDistance(formatDistance(dist));
        setIsCalculatingDistance(false);
      },
      () => {
        setIsCalculatingDistance(false);
      },
      { timeout: 8000 }
    );
  };

  const googleMapsUrl = hasValidCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addressLine1}, ${locality}, ${city}`)}`;

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
      <div className="p-6 sm:p-8 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <MapPin className="h-4 w-4" />
            <span>Location & Neighborhood</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950">
            {locality}, {city}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            {addressLine1}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {hasValidCoordinates && (
            userDistance ? (
              <div className="flex items-center gap-1.5 rounded-xl bg-indigo-50 border border-indigo-200/80 px-3.5 py-2 text-xs font-bold text-indigo-700">
                <Navigation className="h-3.5 w-3.5 text-indigo-600" />
                <span>{userDistance} from you</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCheckDistance}
                disabled={isCalculatingDistance}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                {isCalculatingDistance ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                ) : (
                  <Compass className="h-3.5 w-3.5 text-indigo-600" />
                )}
                <span>Check Distance</span>
              </button>
            )
          )}

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <Navigation className="h-3.5 w-3.5 text-indigo-400" />
            <span>Get Directions</span>
            <ExternalLink className="h-3 w-3 text-zinc-400" />
          </a>
        </div>
      </div>

      <div
        className={`relative bg-zinc-100 ${className}`}
        style={{ minHeight: "350px", width: "100%" }}
      >
        {hasValidCoordinates ? (
          <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "100%", minHeight: "350px", position: "relative" }}
            className="w-full h-full min-h-[350px]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-zinc-400">
            <MapPin className="h-10 w-10 text-zinc-300 mb-2" />
            <p className="text-sm font-semibold text-zinc-700">Map coordinates pending verification</p>
            <p className="text-xs text-zinc-500 mt-1">{addressLine1}, {locality}, {city}</p>
          </div>
        )}
      </div>
    </div>
  );
}
