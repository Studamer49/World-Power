// Geographic positions for map markers (equirectangular projection).
// viewBox: 0 0 1000 x H  =>  x: 0-W (lon -180..180), y: 0-H (lat 90..-90)

export type LatLon = { lat: number; lon: number };

// Approximate capital / centroid for each country (lat, lon).
export const COUNTRY_GEO: Record<string, LatLon> = {
  'Sweden': { lat: 60.1, lon: 15.2 },
  'Mongolia': { lat: 46.9, lon: 103.8 },
  'USA': { lat: 39.8, lon: -98.6 },
  'China': { lat: 35.0, lon: 104.0 },
  'Russia': { lat: 61.5, lon: 90.0 },
  'Argentina': { lat: -35.0, lon: -63.6 },
  'Israel': { lat: 31.0, lon: 34.8 },
  'North Korea': { lat: 40.3, lon: 127.5 },
  'Australia': { lat: -25.0, lon: 133.0 },
  'Nigeria': { lat: 9.1, lon: 8.7 },
};

// Equirectangular projection: lon->x, lat->y across the map (w x h).
export function project(lat: number, lon: number, w = 1000, h = 507): { x: number; y: number } {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
}
