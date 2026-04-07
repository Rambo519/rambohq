/**
 * Resolve a short place label (city, region) from coordinates for display only.
 * Uses Photon (OpenStreetMap) — no API key; swap for another geocoder if needed.
 */
const PHOTON_REVERSE = 'https://photon.komoot.io/reverse'

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<string | null>}
 */
export async function reverseGeocodePlaceLabel(lat, lon) {
  try {
    const url = `${PHOTON_REVERSE}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&lang=en`
    const res = await fetch(url)
    if (!res.ok) return null
    const json = await res.json()
    const p = json?.features?.[0]?.properties
    if (!p) return null

    const city =
      p.city ||
      p.town ||
      p.village ||
      p.locality ||
      p.district ||
      (p.type === 'city' ? p.name : null) ||
      p.county

    if (!city) return null

    const region = p.state || p.region
    if (region && region !== city) {
      return `${city}, ${region}`
    }
    return city
  } catch {
    return null
  }
}
