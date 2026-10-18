/**
 * Geolocation & Distance Utilities
 * Uses the Haversine formula for spherical distance calculation on Earth.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates Great-Circle distance between two coordinates in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number" ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return Infinity;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats a kilometer distance into a friendly human-readable label.
 * E.g., "450 m away", "1.2 km away", "24 km away"
 */
export function formatDistance(distanceKm: number): string {
  if (typeof distanceKm !== "number" || isNaN(distanceKm) || !isFinite(distanceKm)) {
    return "";
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return meters <= 50 ? "Right here (<50m)" : `${meters} m away`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km away`;
  }

  return `${Math.round(distanceKm)} km away`;
}
