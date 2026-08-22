import type { AddressPoint } from "@assertquest/shared";

// Mock geocoding dataset (FR-703) — a fixed set of freight hubs, so address
// autocomplete is deterministic for tests instead of hitting a real geocoder.
export const MOCK_LOCATIONS: AddressPoint[] = [
  { label: "Port of Los Angeles, CA, USA", lat: 33.7395, lng: -118.2597 },
  { label: "Port of Long Beach, CA, USA", lat: 33.7542, lng: -118.2165 },
  { label: "Port of New York and New Jersey, NY, USA", lat: 40.6692, lng: -74.0445 },
  { label: "Port of Savannah, GA, USA", lat: 32.1263, lng: -81.1465 },
  { label: "Port of Houston, TX, USA", lat: 29.7355, lng: -95.0567 },
  { label: "Port of Seattle, WA, USA", lat: 47.5843, lng: -122.3452 },
  { label: "Port of Rotterdam, Netherlands", lat: 51.9496, lng: 4.1453 },
  { label: "Port of Hamburg, Germany", lat: 53.5459, lng: 9.9678 },
  { label: "Port of Antwerp, Belgium", lat: 51.2385, lng: 4.4198 },
  { label: "Port of Felixstowe, United Kingdom", lat: 51.9539, lng: 1.3517 },
  { label: "Port of Singapore", lat: 1.2644, lng: 103.822 },
  { label: "Port of Shanghai, China", lat: 31.3416, lng: 121.5049 },
  { label: "Port of Busan, South Korea", lat: 35.0951, lng: 129.0756 },
  { label: "Port of Tokyo, Japan", lat: 35.6284, lng: 139.7943 },
  { label: "Port of Sydney, Australia", lat: -33.8688, lng: 151.2093 },
  { label: "Port of Santos, Brazil", lat: -23.9608, lng: -46.3336 },
  { label: "Port of Mumbai (JNPT), India", lat: 18.9493, lng: 72.9497 },
  { label: "Port of Dubai (Jebel Ali), UAE", lat: 25.0118, lng: 55.0618 },
];

export function searchLocations(query: string): AddressPoint[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MOCK_LOCATIONS.filter((loc) => loc.label.toLowerCase().includes(q)).slice(0, 8);
}
