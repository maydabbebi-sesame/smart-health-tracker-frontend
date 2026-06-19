"""Offline scraper for med.tn's doctor directory.

Run manually/periodically (NOT during a patient's chat) to populate the
`external_doctors` table that backs the "Annuaire med.tn" section of the
Doctor Agent's nearby search. See doctors.py's /api/doctors/nearby route.

How it works: med.tn renders the doctor list via an AJAX call
(`POST /pagesmd_load.php`) whose parameters (`spe`, `gov`, `speciality`, the
page size...) are embedded in a <script> block on the listing page
(`/medecin/{specialty_slug}/{city_slug}`), and the call requires the session
cookie set by loading that page first. There is no public API — this was
reverse-engineered from the page source. robots.txt allows crawling
`/medecin/...` and `pagesmd_load.php` (it only disallows `/recherche/`,
`/rendez-vous/`, `/auth/` and a few other paths, which this script never
touches).

Usage:
    python medtn_scraper.py --specialty generaliste --city tunis
    python medtn_scraper.py --matrix
"""
import argparse
import re
import time
from datetime import datetime, timezone
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from database import get_db_connection
from logger import get_logger

logger = get_logger(__name__)

BASE_URL = "https://www.med.tn"
LISTING_URL = BASE_URL + "/medecin/{specialty}/{city}"
AJAX_URL = BASE_URL + "/pagesmd_load.php"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
REQUEST_DELAY_SECONDS = 1.5
MAX_PAGES_PER_PAIR = 10

# Curated specialty/city slugs to scrape with --matrix. Slugs follow med.tn's
# own URL scheme (French, accent-free, hyphenated) — verify against the site
# if a pair logs "no ajax params found" (the slug likely doesn't exist there).
SPECIALTIES = [
    "generaliste", "cardiologue", "dermatologue", "gynecologue", "pediatre",
    "orl", "neurologue", "psychiatre", "endocrinologue", "gastro-enterologue",
    "pneumologue", "rhumatologue", "urologue", "ophtalmologue",
]
CITIES = [
    "tunis", "ariana", "ben-arous", "sousse", "sfax", "bizerte", "nabeul", "monastir",
]

# Matches the literal object passed to $.ajax(...) inside load_country_data(),
# e.g. data:{start:start,spe:'36',gov:'23',...,speciality:'Généraliste',...}
AJAX_DATA_RE = re.compile(r"data:\{start:start,(.*?)\}", re.DOTALL)
KV_RE = re.compile(r"(\w+):'([^']*)'")

# On a doctor's detail page, the GPS coordinates are embedded in plain HTML
# in the Google Maps "Itinéraire" link, e.g.
# href="https://www.google.com/maps/dir/?api=1&destination=36.8641839,10.2829518"
GPS_RE = re.compile(r"maps/dir/\?api=1&destination=(-?\d+\.\d+),(-?\d+\.\d+)")
# The phone number(s) are likewise already in the page HTML (revealed by JS on
# click, but present beforehand) inside a `<div id="phone-{internal_id}">`
# modal — scope the tel: search to that block to avoid picking up an unrelated
# generic "garde 24/7" emergency hotline number shown elsewhere on the page.
PHONE_BLOCK_RE = re.compile(r'id="phone-(\d+)"')
TEL_RE = re.compile(r'href="tel:([+0-9.]+)"')


def _extract_ajax_params(html: str):
    match = AJAX_DATA_RE.search(html)
    if not match:
        return None
    params = dict(KV_RE.findall(match.group(1)))
    if "spe" not in params or "gov" not in params:
        return None
    return params


def _parse_cards(html: str):
    soup = BeautifulSoup(html, "html.parser")
    cards = []
    for card in soup.select(".card-doctor-block"):
        name_el = card.select_one(".list__label--name")
        spe_el = card.select_one(".list__label--spee")
        addr_el = card.select_one(".list__label--adr")
        link_el = card.select_one("a[href]")
        if not name_el or not link_el:
            continue
        cards.append({
            "name": name_el.get_text(strip=True),
            "specialization": spe_el.get_text(strip=True) if spe_el else "",
            "location": addr_el.get_text(strip=True) if addr_el else "",
            "source_url": urljoin(BASE_URL, link_el["href"]),
        })
    return cards


def _extract_gps(html: str):
    match = GPS_RE.search(html)
    if not match:
        return None, None
    return float(match.group(1)), float(match.group(2))


def _extract_phone(html: str, internal_id: str):
    """Scope the tel: search to the doctor's own `#phone-{id}` modal so we
    don't pick up the page's generic 24/7 emergency hotline number, which
    isn't the doctor's personal line."""
    marker = f'id="phone-{internal_id}"'
    start = html.find(marker)
    if start == -1:
        return None
    end = html.find('id="phonemodal"', start)
    block = html[start:end if end != -1 else start + 5000]
    numbers = []
    for match in TEL_RE.finditer(block):
        if match.group(1) not in numbers:
            numbers.append(match.group(1))
    return ";".join(numbers) if numbers else None


def fetch_doctor_details(session: requests.Session, source_url: str):
    """Fetch a doctor's profile page for GPS coordinates + phone number(s).

    Both are already present in the static HTML — no extra AJAX call needed:
    GPS lives in the "Itinéraire" Google Maps link, phone in a hidden modal
    revealed by JS on click. Returns (lat, lng, phone), None for anything
    not found or if the request fails.
    """
    id_match = re.search(r"-(\d+)\.html$", source_url)
    try:
        response = session.get(source_url, timeout=10)
    except requests.RequestException:
        logger.exception("Failed to load doctor detail page %s", source_url)
        return None, None, None

    if response.status_code != 200:
        return None, None, None

    html = response.text
    lat, lng = _extract_gps(html)
    phone = _extract_phone(html, id_match.group(1)) if id_match else None
    return lat, lng, phone


def scrape_pair(specialty_slug: str, city_slug: str):
    """Scrape one (specialty, city) pair. Returns a list of doctor dicts."""
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})

    listing_url = LISTING_URL.format(specialty=specialty_slug, city=city_slug)
    try:
        page = session.get(listing_url, timeout=10)
    except requests.RequestException:
        logger.exception("Failed to load listing page %s", listing_url)
        return []

    if page.status_code != 200:
        logger.warning("Listing page %s returned status %s", listing_url, page.status_code)
        return []

    ajax_params = _extract_ajax_params(page.text)
    if not ajax_params:
        logger.warning("No AJAX params found on %s — slug pair may not exist, skipping", listing_url)
        return []

    limit = int(ajax_params.get("nbMainList", "54") or 54)
    doctors = []
    start = 0
    for _ in range(MAX_PAGES_PER_PAIR):
        payload = dict(ajax_params, start=start)
        try:
            response = session.post(
                AJAX_URL,
                data=payload,
                headers={
                    "Referer": listing_url,
                    "X-Requested-With": "XMLHttpRequest",
                },
                timeout=10,
            )
        except requests.RequestException:
            logger.exception("AJAX request failed for %s start=%s", listing_url, start)
            break

        if not response.text.strip():
            break

        cards = _parse_cards(response.text)
        if not cards:
            break

        doctors.extend(cards)
        start += limit
        time.sleep(REQUEST_DELAY_SECONDS)

    logger.info("Scraped %d doctor cards for %s/%s, fetching detail pages for GPS/phone...", len(doctors), specialty_slug, city_slug)
    for doc in doctors:
        lat, lng, phone = fetch_doctor_details(session, doc["source_url"])
        doc["lat"] = lat
        doc["lng"] = lng
        doc["phone"] = phone
        time.sleep(REQUEST_DELAY_SECONDS)

    logger.info("Scraped %d doctors for %s/%s", len(doctors), specialty_slug, city_slug)
    return doctors


def upsert_doctors(doctors):
    if not doctors:
        return 0

    conn = get_db_connection()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc)
    upserted = 0
    for doc in doctors:
        # One malformed record (e.g. unexpectedly long scraped field) must not
        # sink the whole batch — log and move on, commit what succeeded.
        try:
            cursor.execute(
                """
                INSERT INTO external_doctors (source, source_url, name, specialization, location, phone, lat, lng, scraped_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    specialization = VALUES(specialization),
                    location = VALUES(location),
                    phone = VALUES(phone),
                    lat = VALUES(lat),
                    lng = VALUES(lng),
                    scraped_at = VALUES(scraped_at)
                """,
                (
                    "med.tn", doc["source_url"], doc["name"], doc["specialization"], doc["location"],
                    doc.get("phone"), doc.get("lat"), doc.get("lng"), now,
                ),
            )
            upserted += 1
        except Exception:
            logger.exception("Failed to upsert doctor %s, skipping", doc.get("source_url"))
    conn.commit()
    cursor.close()
    conn.close()
    return upserted


def main():
    parser = argparse.ArgumentParser(description="Scrape med.tn's doctor directory into external_doctors.")
    parser.add_argument("--specialty", help="med.tn specialty slug, e.g. 'cardiologue'")
    parser.add_argument("--city", help="med.tn city slug, e.g. 'tunis'")
    parser.add_argument("--matrix", action="store_true", help="Scrape the curated SPECIALTIES x CITIES matrix")
    args = parser.parse_args()

    if args.matrix:
        pairs = [(s, c) for s in SPECIALTIES for c in CITIES]
    elif args.specialty and args.city:
        pairs = [(args.specialty, args.city)]
    else:
        parser.error("Provide --specialty and --city, or --matrix")
        return

    total = 0
    for specialty, city in pairs:
        try:
            doctors = scrape_pair(specialty, city)
            total += upsert_doctors(doctors)
        except Exception:
            logger.exception("Failed scraping pair specialty=%s city=%s, continuing", specialty, city)
        time.sleep(REQUEST_DELAY_SECONDS)

    logger.info("Done. Upserted %d doctor records total.", total)


if __name__ == "__main__":
    main()
