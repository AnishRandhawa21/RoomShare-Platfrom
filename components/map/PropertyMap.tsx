"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  Marker,
  Popup,
  LngLatBounds,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import {
  Building2,
  MapPin,
  ExternalLink,
  RefreshCw,
  Navigation,
  Compass,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import type { PropertyListingSummary } from "@/lib/discovery";
import {
  calculateDistanceKm,
  formatDistance,
  type Coordinates,
} from "@/lib/geo";

// City default coordinates [longitude, latitude]
export const CITY_COORDINATES: Record<string, [number, number]> = {
  Bengaluru: [77.6245, 12.9352],
  Jalandhar: [75.5762, 31.3260],
  Phagwara: [75.7725, 31.2240],
  Chandigarh: [76.7794, 30.7333],
  Ludhiana: [75.8573, 30.9010],
  Amritsar: [74.8723, 31.6340],
  Delhi: [77.1025, 28.7041],
  "Delhi NCR": [77.1025, 28.7041],
  Noida: [77.3910, 28.5355],
  Gurugram: [77.0266, 28.4595],
  Pune: [73.8567, 18.5204],
  Mumbai: [72.8777, 19.0760],
  Hyderabad: [78.3850, 17.4450],
  Chennai: [80.2707, 13.0827],
  Kolkata: [88.3639, 22.5726],
};

// Bulletproof OpenStreetMap raster style (Zero API keys, zero external font/sprite dependencies, 100% reliable)
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

interface PropertyMapProps {
  properties: PropertyListingSummary[];
  selectedCity?: string;
  selectedPropertyId?: string | null;
  userLocation?: Coordinates | null;
  onSelectProperty?: (id: string | null) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  onLocateMe?: () => void;
  isLocating?: boolean;
  className?: string;
}

export function PropertyMap({
  properties,
  selectedCity = "Jalandhar",
  selectedPropertyId,
  userLocation,
  onSelectProperty,
  onBoundsChange,
  onLocateMe,
  isLocating,
  className = "w-full h-full min-h-[450px]",
}: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<{ [key: string]: Marker }>({});
  const userMarkerRef = useRef<Marker | null>(null);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [activePopupProperty, setActivePopupProperty] = useState<PropertyListingSummary | null>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const initialCenter: [number, number] =
      userLocation
        ? [userLocation.longitude, userLocation.latitude]
        : CITY_COORDINATES[selectedCity] || [77.6245, 12.9352];

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: initialCenter,
      zoom: userLocation ? 13.5 : 12.5,
      pitchWithRotate: false,
      dragRotate: false,
    });

    // Navigation controls
    map.addControl(
      new NavigationControl({
        showCompass: false,
        visualizePitch: false,
      }),
      "bottom-right"
    );

    // Track user drag/zoom for "Search this area"
    map.on("dragend", () => {
      setShowSearchThisArea(true);
    });

    map.on("zoomend", () => {
      setShowSearchThisArea(true);
    });

    // Ensure proper sizing when canvas mounts
    map.on("load", () => {
      map.resize();
    });

    mapRef.current = map;

    // Delayed resize fallback for smooth transitions
    const timer1 = setTimeout(() => map.resize(), 150);
    const timer2 = setTimeout(() => map.resize(), 500);

    // ResizeObserver on container to prevent 0x0 canvas collapse
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Intelligent flyTo / fitBounds when selectedCity or properties or userLocation change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userLocation && !selectedPropertyId) {
      map.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 13.5,
        essential: true,
        speed: 1.2,
      });
      setTimeout(() => setShowSearchThisArea(false), 0);
      return;
    }

    const validProps = properties.filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    );

    // Filter properties for the currently selected city (case-insensitive)
    const cityProps =
      selectedCity === "All"
        ? validProps
        : validProps.filter(
            (p) => p.city.trim().toLowerCase() === selectedCity.trim().toLowerCase()
          );

    if (cityProps.length === 1 && !selectedPropertyId) {
      map.flyTo({
        center: [cityProps[0].longitude, cityProps[0].latitude],
        zoom: 14,
        essential: true,
        speed: 1.2,
      });
      setTimeout(() => setShowSearchThisArea(false), 0);
    } else if (cityProps.length > 1 && !selectedPropertyId) {
      const bounds = new LngLatBounds();
      cityProps.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }
      setTimeout(() => setShowSearchThisArea(false), 0);
    } else {
      // Find fallback coordinates in CITY_COORDINATES
      let targetCenter = CITY_COORDINATES[selectedCity];
      if (!targetCenter) {
        for (const [key, coords] of Object.entries(CITY_COORDINATES)) {
          if (key.toLowerCase() === selectedCity.toLowerCase()) {
            targetCenter = coords;
            break;
          }
        }
      }

      if (targetCenter) {
        map.flyTo({
          center: targetCenter,
          zoom: 12.5,
          essential: true,
          speed: 1.2,
        });
        setTimeout(() => setShowSearchThisArea(false), 0);
      } else if (validProps.length > 0 && !selectedPropertyId) {
        const bounds = new LngLatBounds();
        validProps.forEach((p) => bounds.extend([p.longitude, p.latitude]));
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
        }
      }
    }
  }, [selectedCity, properties.length, userLocation]);

  // 3. User Location Marker Sync
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const el = document.createElement("div");
      el.className = "user-location-marker cursor-pointer";
      el.style.cssText =
        "position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; z-index: 50;";
      el.innerHTML = `
        <div class="gps-pulse-circle" style="position: absolute; inset: 0; border-radius: 9999px; background-color: rgba(150, 191, 138, 0.45);"></div>
        <div style="position: relative; width: 14px; height: 14px; border-radius: 9999px; background-color: #00412E; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
      `;

      const popup = new Popup({ offset: 16, closeButton: false }).setHTML(
        `<div style="font-size: 11px; font-weight: 700; color: #00412E; padding: 2px 4px; font-family: sans-serif;">📍 You are here</div>`
      );

      const marker = new Marker({ element: el })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .setPopup(popup)
        .addTo(map);

      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  // 4. Sync Property Markers with properties (including distance badges)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    const validProps = properties.filter(
      (p) =>
        typeof p.latitude === "number" &&
        typeof p.longitude === "number" &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude)
    );

    if (validProps.length === 0) return;

    validProps.forEach((prop) => {
      const priceFormatted =
        prop.startingPrice >= 1000
          ? `₹${(prop.startingPrice / 1000).toFixed(prop.startingPrice % 1000 === 0 ? 0 : 1)}k`
          : `₹${prop.startingPrice}`;

      const isSelected = selectedPropertyId === prop.id;

      // Distance calculation if userLocation is active
      const distanceKm =
        userLocation &&
        typeof prop.latitude === "number" &&
        typeof prop.longitude === "number"
          ? calculateDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              prop.latitude,
              prop.longitude
            )
          : Infinity;
      const distanceText = distanceKm < Infinity ? formatDistance(distanceKm) : "";

      const badgeColor =
        prop.genderPolicy === "BOYS"
          ? "#2563eb"
          : prop.genderPolicy === "GIRLS"
          ? "#e11d48"
          : "#00412E";

      // Create custom interactive price pill marker DOM element
      const el = document.createElement("div");
      el.style.cssText = `cursor: pointer; z-index: ${isSelected ? "35" : "20"};`;
      el.className = "price-marker-pin group";

      const distancePillSnippet = distanceText
        ? `<span style="opacity: 0.9; font-size: 10px; font-weight: 600; border-left: 1px solid rgba(255,255,255,0.3); padding-left: 5px;">${distanceText}</span>`
        : "";

      const inner = document.createElement("div");
      inner.className = "price-pill-inner";
      inner.style.cssText = `
        background-color: ${badgeColor};
        color: white;
        padding: 5px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 800;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        border: 2px solid white;
        display: flex;
        align-items: center;
        gap: 5px;
        white-space: nowrap;
        transform-origin: center center;
        transition: transform 0.15s cubic-bezier(0.2, 0, 0, 1), box-shadow 0.15s ease;
        ${
          isSelected
            ? "transform: scale(1.15); box-shadow: 0 0 0 4px rgba(0, 65, 46, 0.5), 0 6px 20px rgba(0,0,0,0.4);"
            : "transform: scale(1);"
        }
      `;

      inner.innerHTML = `
        <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background-color: ${
          prop.genderPolicy === "BOYS"
            ? "#93c5fd"
            : prop.genderPolicy === "GIRLS"
            ? "#fda4af"
            : "#a1a1aa"
        };"></span>
        <span>${priceFormatted}</span>
        ${distancePillSnippet}
      `;

      el.appendChild(inner);

      // Safe hover animation: Only scale the inner element, NEVER touch el.style.transform!
      // MapLibre uses el.style.transform for GPS positioning. Modifying el.style.transform wipes coordinates.
      el.addEventListener("mouseenter", () => {
        el.style.zIndex = "40";
        inner.style.transform = isSelected ? "scale(1.2)" : "scale(1.1)";
        inner.style.boxShadow = "0 6px 22px rgba(0,0,0,0.4)";
      });

      el.addEventListener("mouseleave", () => {
        el.style.zIndex = isSelected ? "35" : "20";
        inner.style.transform = isSelected ? "scale(1.15)" : "scale(1)";
        inner.style.boxShadow = isSelected
          ? "0 0 0 4px rgba(99, 102, 241, 0.6), 0 6px 20px rgba(0,0,0,0.4)"
          : "0 4px 14px rgba(0,0,0,0.3)";
      });

      el.addEventListener("click", () => {
        if (onSelectProperty) {
          onSelectProperty(prop.id);
        }
        setActivePopupProperty(prop);

        map.flyTo({
          center: [prop.longitude, prop.latitude],
          zoom: Math.max(map.getZoom(), 13.5),
          speed: 0.8,
        });
      });

      const marker = new Marker({ element: el })
        .setLngLat([prop.longitude, prop.latitude])
        .addTo(map);

      markersRef.current[prop.id] = marker;
    });
  }, [properties, selectedPropertyId, userLocation]);

  // 5. Handle selected property highlight
  useEffect(() => {
    if (!selectedPropertyId || !mapRef.current) return;
    const prop = properties.find((p) => p.id === selectedPropertyId);
    if (
      prop &&
      typeof prop.latitude === "number" &&
      typeof prop.longitude === "number"
    ) {
      mapRef.current.flyTo({
        center: [prop.longitude, prop.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 13.5),
        speed: 1.0,
      });
      setTimeout(() => setActivePopupProperty(prop), 0);
    }
  }, [selectedPropertyId, properties]);

  const handleSearchViewport = () => {
    if (!mapRef.current || !onBoundsChange) return;
    const bounds = mapRef.current.getBounds();
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
    setShowSearchThisArea(false);
  };

  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 14,
        essential: true,
        speed: 1.2,
      });
    } else if (onLocateMe) {
      onLocateMe();
    }
  };

  // Distance for active popup property
  const activePopupDistance =
    activePopupProperty &&
    userLocation &&
    typeof activePopupProperty.latitude === "number" &&
    typeof activePopupProperty.longitude === "number"
      ? formatDistance(
          calculateDistanceKm(
            userLocation.latitude,
            userLocation.longitude,
            activePopupProperty.latitude,
            activePopupProperty.longitude
          )
        )
      : null;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 ${className}`}
      style={{ minHeight: "450px", height: "100%", width: "100%" }}
    >
      {/* Map Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%", minHeight: "450px", position: "relative" }}
        className="w-full h-full min-h-[450px]"
      />

      {/* Floating Map Controls (Top Right: Locate Me) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleCenterOnUser}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold shadow-lg border transition-all cursor-pointer active:scale-95 ${
            userLocation
              ? "bg-[#00412E] text-white border-[#00412E] hover:bg-[#002d20] shadow-[#00412E]/20"
              : "bg-white text-zinc-800 border-[#E8EAE5] hover:bg-[#eff4ec] hover:text-[#00412E]"
          }`}
          title={userLocation ? "Center map on my location" : "Find properties near my location"}
        >
          {isLocating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00412E]" />
          ) : (
            <Navigation className={`h-3.5 w-3.5 ${userLocation ? "text-white" : "text-[#00412E]"}`} />
          )}
          <span>{userLocation ? "My Location" : "Near Me"}</span>
        </button>
      </div>

      {/* Floating "Search this area" button */}
      {showSearchThisArea && onBoundsChange && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <button
            type="button"
            onClick={handleSearchViewport}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-zinc-900 shadow-lg border border-[#E8EAE5] hover:bg-[#eff4ec] transition-all cursor-pointer hover:shadow-xl active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#00412E]" />
            <span>Search this area</span>
          </button>
        </div>
      )}

      {/* Interactive Property Preview Card Popup (Optimized for Split View & Mobile) */}
      {activePopupProperty && (
        <div className="absolute bottom-3 left-3 right-14 sm:bottom-4 sm:left-4 sm:right-auto sm:w-[360px] z-20 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="group relative flex items-center gap-3 rounded-2xl border border-zinc-200/90 bg-white/95 p-2.5 shadow-xl backdrop-blur-md hover:shadow-2xl transition-all">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActivePopupProperty(null)}
              className="absolute -top-2 -right-2 z-30 flex h-6 w-6 items-center justify-center rounded-full bg-white text-zinc-500 shadow-md border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950 transition-all cursor-pointer"
              aria-label="Close preview"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Thumbnail Image */}
            <Link
              href={`/property/${activePopupProperty.slug}`}
              className="relative h-20 w-22 sm:h-22 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 block group-hover:opacity-95 transition-opacity"
            >
              {activePopupProperty.coverImageUrl ? (
                <img
                  src={activePopupProperty.coverImageUrl}
                  alt={activePopupProperty.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400">
                  <Building2 className="h-6 w-6" />
                </div>
              )}
              {/* Badge overlay on thumbnail */}
              <div className="absolute bottom-1 left-1 flex items-center gap-1">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-white shadow-xs ${
                    activePopupProperty.genderPolicy === "BOYS"
                      ? "bg-blue-600/90"
                      : activePopupProperty.genderPolicy === "GIRLS"
                      ? "bg-rose-600/90"
                      : "bg-[#00412E]/90"
                  }`}
                >
                  {activePopupProperty.genderPolicy === "BOYS"
                    ? "Boys"
                    : activePopupProperty.genderPolicy === "GIRLS"
                    ? "Girls"
                    : "Coliving"}
                </span>
              </div>
            </Link>

            {/* Property Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-0.5">
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                  <span className="truncate font-medium">
                    {activePopupProperty.locality}
                  </span>
                </div>
                {activePopupDistance && (
                  <span className="shrink-0 flex items-center gap-0.5 font-bold text-[#00412E] bg-[#eff4ec] px-1.5 py-0.5 rounded-full text-[9.5px]">
                    <Navigation className="h-2 w-2" /> {activePopupDistance}
                  </span>
                )}
              </div>

              <Link
                href={`/property/${activePopupProperty.slug}`}
                className="block text-xs sm:text-sm font-bold text-zinc-950 truncate hover:text-[#00412E] transition-colors leading-snug"
                title={activePopupProperty.name}
              >
                {activePopupProperty.name}
              </Link>

              {/* Price & View CTA */}
              <div className="mt-1.5 flex items-center justify-between gap-2 pt-1 border-t border-zinc-100">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-400 block leading-none">
                    Starts at
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#00412E]">
                    ₹{activePopupProperty.startingPrice.toLocaleString("en-IN")}
                    <span className="text-[10px] font-normal text-zinc-500">/mo</span>
                  </span>
                </div>

                <Link
                  href={`/property/${activePopupProperty.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#00412E] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#002d20] transition-colors shadow-2xs shrink-0"
                >
                  <span>View</span>
                  <ArrowRight className="h-3 w-3 text-[#96BF8A]" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

