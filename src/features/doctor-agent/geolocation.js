// Resolves to { lat, lng } from the browser's geolocation API, or null if
// unsupported, denied, or timed out — callers fall back to a destination-only
// itinerary rather than failing outright.
export function getUserPosition() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    )
  })
}

// Builds an OpenStreetMap directions URL. With the user's real position it's
// a full route (origin -> destination); without it, a destination-only link
// that still lets the visited site/app ask for location itself.
export function buildDirectionsUrl(userPosition, destLat, destLng) {
  const base = 'https://www.openstreetmap.org/directions?engine=fossgis_osrm_car'
  if (userPosition) {
    return `${base}&route=${userPosition.lat}%2C${userPosition.lng}%3B${destLat}%2C${destLng}`
  }
  return `${base}&to=${destLat}%2C${destLng}`
}

// Opens directions to (destLat, destLng) in a new tab, using the user's real
// position as the route's origin when available. Opens the tab synchronously
// (before the async geolocation lookup resolves) and redirects it once the
// final URL is known — browsers block window.open() calls made outside a
// direct click handler, so awaiting first and opening after would get popup-
// blocked in most of them.
// When GPS coordinates are unavailable, falls back to a Google Maps text search
// on the provided fallbackAddress so the button always works for med.tn doctors
// whose detail page had no Google Maps link during scraping.
export async function openDirections(destLat, destLng, fallbackAddress = null) {
  const tab = window.open('', '_blank')
  let url
  if (destLat != null && destLng != null) {
    const userPosition = await getUserPosition()
    url = buildDirectionsUrl(userPosition, destLat, destLng)
  } else if (fallbackAddress) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackAddress)}`
  }
  if (url) {
    if (tab) tab.location.href = url
    else window.open(url, '_blank')
  } else if (tab) {
    tab.close()
  }
}
