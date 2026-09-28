#!/usr/bin/env python3
import csv
import io
import json
import math
import re
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

TABLE = "[CO2Emission].[latest].[co2cars_2025Pv31]"
API = "https://discodata.eea.europa.eu/sql"
REALWORLD_PAGE = "https://climate-energy.eea.europa.eu/topics/transport/real-world-emissions/additional_information"
OUT = Path("data/vehicles.json")

QUERY = f"""
SELECT TOP 6000
  [Mk] AS make,
  [Cn] AS model,
  [Ft] AS fuel,
  [Fm] AS fuel_mode,
  MAX([Mh]) AS manufacturer,
  ROUND(AVG(CASE WHEN [Fc] > 0 AND [Fc] < 30 THEN CAST([Fc] AS float) END), 2) AS fc,
  ROUND(AVG(CASE WHEN [Z (Wh/km)] > 0 AND [Z (Wh/km)] < 1000 THEN CAST([Z (Wh/km)] AS float) END), 0) AS whkm,
  ROUND(AVG(CASE WHEN [Ep (KW)] > 0 AND [Ep (KW)] < 1500 THEN CAST([Ep (KW)] AS float) END), 0) AS kw,
  SUM(CASE WHEN [R] > 0 THEN [R] ELSE 1 END) AS registrations
FROM {TABLE}
WHERE [Mk] IS NOT NULL AND [Cn] IS NOT NULL
  AND LOWER([Ft]) IN ('petrol','diesel','electric','petrol/electric','diesel/electric')
GROUP BY [Mk], [Cn], [Ft], [Fm]
ORDER BY registrations DESC
"""

def tidy(value):
    return re.sub(r"\s+", " ", str(value or "").strip())

def number(value, digits=None):
    if value in (None, "", "NULL"):
        return None
    try:
        n = float(str(value).replace(",", "."))
    except (TypeError, ValueError):
        return None
    if not math.isfinite(n):
        return None
    return round(n, digits) if digits is not None else n

def norm(value):
    return re.sub(r"[^A-Z0-9]+", "", tidy(value).upper())

def tokens(value):
    stop = {
        "AG","GMBH","SPA","SAS","SA","NV","BV","LTD","LIMITED","PLC",
        "MOTOR","MOTORS","COMPANY","CORPORATION","CORP","AUTOMOBILES",
        "AUTO","EUROPE","EUROPEAN","MANUFACTURER","AUTOMOTIVE"
    }
    return {x for x in re.findall(r"[A-Z0-9]+", tidy(value).upper()) if len(x) > 2 and x not in stop}

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.current = None
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.current = dict(attrs).get("href")
    def handle_data(self, data):
        if self.current and data.strip():
            self.links.append((data.strip(), self.current))
    def handle_endtag(self, tag):
        if tag == "a":
            self.current = None

def latest_aggregate_url():
    req = urllib.request.Request(REALWORLD_PAGE, headers={"User-Agent":"RouteSaver/0.6"})
    with urllib.request.urlopen(req, timeout=60) as response:
        html = response.read().decode("utf-8", "replace")
    parser = LinkParser()
    parser.feed(html)
    found = []
    for label, href in parser.links:
        if "Cars" in label and "Aggregate" in label and "Real-world" in label:
            m = re.search(r"\[(20\d{2})\]", label)
            if m:
                found.append((int(m.group(1)), urllib.parse.urljoin(REALWORLD_PAGE, href)))
    if not found:
        raise RuntimeError("Official EEA aggregate real-world cars dataset not found")
    found.sort(reverse=True)
    return found[0]

def load_realworld():
    reporting_year, url = latest_aggregate_url()
    req = urllib.request.Request(url, headers={"User-Agent":"RouteSaver/0.6","Accept":"text/csv,*/*"})
    buckets = defaultdict(lambda: {"n":0, "ob":0.0, "wl":0.0, "years":[]})
    with urllib.request.urlopen(req, timeout=120) as response:
        text = io.TextIOWrapper(response, encoding="utf-8-sig", errors="replace", newline="")
        reader = csv.DictReader(text)
        for row in reader:
            manufacturer = tidy(row.get("Manufacturer")).upper()
            fuel = tidy(row.get("Fuel Type")).upper()
            n = int(number(row.get("Number of vehicles")) or 0)
            ob = number(row.get("OBFCM Fuel consumption weighted (l/100 km)"))
            wl = number(row.get("WLTP Fuel consumption weighted (l/100 km)"))
            if ob is None:
                ob = number(row.get("OBFCM Fuel consumption (l/100 km)"))
            if wl is None:
                wl = number(row.get("WLTP Fuel consumption (l/100 km)"))
            if not manufacturer or not fuel or n <= 0 or ob is None or wl is None or wl <= 0:
                continue
            if not (0.2 < ob < 30 and 0.2 < wl < 30):
                continue
            b = buckets[(manufacturer, fuel)]
            b["n"] += n
            b["ob"] += ob * n
            b["wl"] += wl * n
            yr = int(number(row.get("Year")) or 0)
            if yr:
                b["years"].append(yr)
    refs = []
    for (manufacturer, fuel), b in buckets.items():
        if b["n"] <= 0:
            continue
        ob = b["ob"] / b["n"]
        wl = b["wl"] / b["n"]
        factor = ob / wl if wl else None
        if factor is None or not (0.6 <= factor <= 8.0):
            continue
        refs.append({
            "manufacturer": manufacturer,
            "fuel": fuel,
            "vehicles": b["n"],
            "obfcm_l_100km": round(ob, 2),
            "wltp_l_100km": round(wl, 2),
            "factor": round(factor, 3),
            "registration_year_min": min(b["years"]) if b["years"] else None,
            "registration_year_max": max(b["years"]) if b["years"] else None,
        })
    return reporting_year, url, refs

def match_realworld(vehicle, refs):
    fuel = tidy(vehicle.get("fuel")).upper()
    if fuel == "ELECTRIC":
        return None
    manufacturer = tidy(vehicle.get("manufacturer")).upper()
    make = tidy(vehicle.get("make")).upper()
    exact = norm(manufacturer)
    candidates = [r for r in refs if r["fuel"] == fuel and r["vehicles"] >= 20]
    for r in candidates:
        if exact and norm(r["manufacturer"]) == exact:
            return r
    vt = tokens(manufacturer) | tokens(make)
    best = None
    best_score = 0.0
    for r in candidates:
        rt = tokens(r["manufacturer"])
        if not vt or not rt:
            continue
        overlap = len(vt & rt)
        if not overlap:
            continue
        score = overlap / max(1, min(len(vt), len(rt)))
        if score > best_score or (score == best_score and best and r["vehicles"] > best["vehicles"]):
            best = r
            best_score = score
    return best if best_score >= 0.5 else None

params = urllib.parse.urlencode({"query": QUERY, "p": 1, "nrOfHits": 6000})
req = urllib.request.Request(
    API + "?" + params,
    headers={
        "User-Agent": "RouteSaver/0.6 (+https://github.com/baiez82-stack/routesaver)",
        "Accept": "application/json",
    },
)
with urllib.request.urlopen(req, timeout=120) as response:
    payload = json.load(response)

if payload.get("errors"):
    raise RuntimeError(payload["errors"])

reporting_year, realworld_url, realworld_refs = load_realworld()

rows = []
seen = set()
for raw in payload.get("results", []):
    make = tidy(raw.get("make")).upper()
    model = tidy(raw.get("model")).upper()
    fuel = tidy(raw.get("fuel")).lower()
    fuel_mode = tidy(raw.get("fuel_mode")).upper()
    manufacturer = tidy(raw.get("manufacturer")).upper()
    if not make or not model:
        continue
    if model in {"N/A", "NA", "UNKNOWN", "NOT AVAILABLE"}:
        continue

    fc = number(raw.get("fc"), 2)
    whkm = number(raw.get("whkm"), 0)
    kw = number(raw.get("kw"), 0)
    regs = int(number(raw.get("registrations"), 0) or 0)
    if fc is None and whkm is None:
        continue

    key = (make, model, fuel, fuel_mode)
    if key in seen:
        continue
    seen.add(key)

    vehicle = {
        "make": make,
        "model": model,
        "fuel": fuel,
        "fuel_mode": fuel_mode,
        "manufacturer": manufacturer,
        "fc_l_100km": fc,
        "electric_wh_km": whkm,
        "power_kw": kw,
        "registrations": regs,
    }

    rw = match_realworld(vehicle, realworld_refs)
    if rw and fc is not None:
        corrected = fc * rw["factor"]
        # For PHEVs, avoid treating the very low charge-weighted WLTP value as
        # an engine-only baseline. The observed EEA aggregate is a safer floor.
        if fuel_mode == "P" or fuel in ("petrol/electric", "diesel/electric"):
            corrected = max(corrected, rw["obfcm_l_100km"])
        vehicle["real_world"] = {
            "l_100km": round(corrected, 2),
            "factor": rw["factor"],
            "reference_obfcm_l_100km": rw["obfcm_l_100km"],
            "reference_wltp_l_100km": rw["wltp_l_100km"],
            "vehicles": rw["vehicles"],
            "manufacturer": rw["manufacturer"],
            "reporting_year": reporting_year,
            "method": "EEA OBFCM manufacturer/powertrain correction applied to model WLTP",
        }
    else:
        vehicle["real_world"] = None

    rows.append(vehicle)

rows.sort(key=lambda x: (-x["registrations"], x["make"], x["model"], x["fuel_mode"]))

out = {
    "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    "year": 2025,
    "status": "provisional",
    "source": "European Environment Agency (EEA)",
    "source_table": "CO2Emission.latest.co2cars_2025Pv31",
    "source_api": "https://discodata.eea.europa.eu/",
    "real_world_reporting_year": reporting_year,
    "real_world_source_url": realworld_url,
    "note": "Model data use EEA 2025 registrations. Where available, RouteSaver corrects the model WLTP fuel consumption with EEA OBFCM real-world evidence for the matching manufacturer and powertrain. The OBFCM correction is not a model-specific measured average.",
    "vehicles": rows,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

matched = sum(1 for x in rows if x.get("real_world"))
print(f"Generated {len(rows)} vehicle groups from EEA 2025; OBFCM correction available for {matched}")
print(f"EEA real-world reporting year: {reporting_year}")
