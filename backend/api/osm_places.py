"""OpenStreetMap integration for the Doctor Agent nearby search.

Free alternative to Google Places — no API key, no billing account needed.
Uses Nominatim for geocoding and the Overpass API for the nearby doctors/
clinics/hospitals lookup. Both are public services with fair-use limits
(roughly 1 request/second), which is well within what a single patient
search needs (one geocode call + one Overpass query).
"""
import math
import re
import time

import requests

from logger import get_logger

logger = get_logger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
# Nominatim/Overpass usage policy requires a descriptive User-Agent identifying
# the application (anonymous/browser-like UAs can get rate-limited or blocked).
USER_AGENT = "SmartHealthTracker-PFA2026/1.0 (school project doctor finder)"
# Both are free public instances that occasionally return an empty result for
# a perfectly valid query (observed in testing) — one retry after a short
# pause absorbs most of that flakiness without making failures take forever.
_RETRY_DELAY_SECONDS = 1.2

# Components Nominatim may return, most to least specific — used to resolve
# whatever the patient typed ("Ben Arous Centre") down to the plain city/
# governorate name ("Ben Arous") that actually appears in our scraped/stored
# doctor addresses, instead of LIKE-matching the raw free-text input.
_CITY_ADDRESS_KEYS = ("city", "town", "municipality", "village", "county", "state")


def _haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


_GOVERNORATE_PREFIX_RE = re.compile(r"^(Gouvernorat|Governorate)\s+", re.IGNORECASE)


def _resolve_city(address_components: dict):
    # Tunisia's `state` component is consistently "Gouvernorat <Name>", and
    # <Name> is exactly the governorate name med.tn's own addresses end with
    # (scraped as "... Ben arous Tunisie") — prefer it over `city`/`county`,
    # which are often a finer-grained delegation/sub-area ("Ben Arous Ouest")
    # that won't substring-match our stored addresses either.
    state = address_components.get("state")
    if state:
        return _GOVERNORATE_PREFIX_RE.sub("", state).strip()
    for key in _CITY_ADDRESS_KEYS:
        if address_components.get(key):
            return address_components[key]
    return None


def _nominatim_search(address):
    response = requests.get(
        NOMINATIM_URL,
        params={
            "q": address, "format": "json", "countrycodes": "tn", "limit": 1,
            "addressdetails": 1, "accept-language": "fr",
        },
        headers={"User-Agent": USER_AGENT},
        timeout=8,
    )
    return response.json()


def geocode_address(address: str):
    """Resolve a free-text address/city to (lat, lng, city_name), biased to Tunisia.

    `city_name` is the canonical city/governorate Nominatim resolved the input
    to (e.g. "Ben Arous" for "Ben Arous Centre") — use it instead of the raw
    input for any further text matching against stored addresses, since those
    rarely contain whatever extra words the patient typed.

    Returns None if the request fails (after one retry) or no match is found.
    """
    if not address:
        return None

    for attempt in range(2):
        try:
            results = _nominatim_search(address)
        except (requests.RequestException, ValueError):
            logger.exception("Nominatim geocoding failed for address=%s (attempt %d)", address, attempt)
            results = None

        if results:
            break
        if attempt == 0:
            time.sleep(_RETRY_DELAY_SECONDS)

    if not results:
        logger.warning("Nominatim found no match for address=%s", address)
        return None

    match = results[0]
    city = _resolve_city(match.get("address", {})) or address
    return float(match["lat"]), float(match["lon"]), city


def search_nearby_doctors(lat, lng, keyword=None, radius=12000, max_results=8):
    """Overpass query for doctors/clinics/hospitals around (lat, lng).

    OSM rarely tags a precise medical specialty, so `keyword` isn't used to
    filter results (it would mostly return nothing) — it's accepted for
    symmetry with the rest of the nearby-search flow but currently unused.
    """
    query = (
        f"[out:json][timeout:15];"
        f"("
        f'node["amenity"~"^(doctors|clinic|hospital)$"](around:{radius},{lat},{lng});'
        f'way["amenity"~"^(doctors|clinic|hospital)$"](around:{radius},{lat},{lng});'
        f");"
        f"out center tags {max_results * 4};"
    )

    data = None
    for attempt in range(2):
        try:
            response = requests.post(
                OVERPASS_URL,
                data={"data": query},
                headers={"User-Agent": USER_AGENT},
                timeout=20,
            )
            data = response.json()
        except (requests.RequestException, ValueError):
            logger.exception("Overpass nearby search failed (attempt %d)", attempt)
            data = None

        if data and data.get("elements"):
            break
        if attempt == 0:
            time.sleep(_RETRY_DELAY_SECONDS)

    if not data:
        return []

    results = []
    for element in data.get("elements", []):
        tags = element.get("tags", {})
        name = tags.get("name:fr") or tags.get("name") or tags.get("name:en")
        if not name:
            continue

        el_lat = element.get("lat") or element.get("center", {}).get("lat")
        el_lng = element.get("lon") or element.get("center", {}).get("lon")
        distance_km = (
            round(_haversine_km(lat, lng, el_lat, el_lng), 1)
            if el_lat is not None and el_lng is not None
            else None
        )

        address_parts = [tags.get("addr:housenumber"), tags.get("addr:street"), tags.get("addr:city")]
        address = ", ".join(part for part in address_parts if part) or None

        results.append({
            "id": f"{element['type']}/{element['id']}",
            "name": name,
            "category": tags.get("amenity"),
            "address": address,
            "phone": tags.get("phone") or tags.get("contact:phone"),
            "email": tags.get("email") or tags.get("contact:email"),
            "website": tags.get("website") or tags.get("contact:website"),
            "lat": el_lat,
            "lng": el_lng,
            "distanceKm": distance_km,
        })

    results.sort(key=lambda d: (d["distanceKm"] is None, d["distanceKm"]))
    return results[:max_results]
