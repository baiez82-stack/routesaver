#!/usr/bin/env python3
import json
import math
import re
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

TABLE = "[CO2Emission].[latest].[co2cars_2025Pv31]"
API = "https://discodata.eea.europa.eu/sql"
OUT = Path("data/vehicles.json")

QUERY = f"""
SELECT TOP 6000
  [Mk] AS make,
  [Cn] AS model,
  [Ft] AS fuel,
  [Fm] AS fuel_mode,
  ROUND(AVG(CASE WHEN [Fc] > 0 AND [Fc] < 30 THEN CAST([Fc] AS float) END), 2) AS fc,
  ROUND(AVG(CASE WHEN [Z (Wh/km)] > 0 AND [Z (Wh/km)] < 1000 THEN CAST([Z (Wh/km)] AS float) END), 0) AS whkm,
  ROUND(AVG(CASE WHEN [Ep (KW)] > 0 AND [Ep (KW)] < 1500 THEN CAST([Ep (KW)] AS float) END), 0) AS kw,
  SUM(CASE WHEN [R] > 0 THEN [R] ELSE 1 END) AS registrations
FROM {TABLE}
WHERE [Mk] IS NOT NULL AND [Cn] IS NOT NULL
GROUP BY [Mk], [Cn], [Ft], [Fm]
ORDER BY registrations DESC
"""

def tidy(value):
    return re.sub(r"\s+", " ", str(value or "").strip())

def number(value, digits=None):
    if value in (None, ""):
        return None
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(n):
        return None
    return round(n, digits) if digits is not None else n

params = urllib.parse.urlencode({"query": QUERY, "p": 1, "nrOfHits": 6000})
req = urllib.request.Request(
    API + "?" + params,
    headers={
        "User-Agent": "RouteSaver/0.2 (+https://github.com/baiez82-stack/routesaver)",
        "Accept": "application/json",
    },
)
with urllib.request.urlopen(req, timeout=120) as response:
    payload = json.load(response)

if payload.get("errors"):
    raise RuntimeError(payload["errors"])

rows = []
seen = set()
for raw in payload.get("results", []):
    make = tidy(raw.get("make")).upper()
    model = tidy(raw.get("model")).upper()
    fuel = tidy(raw.get("fuel")).lower()
    fuel_mode = tidy(raw.get("fuel_mode")).upper()
    if not make or not model:
        continue

    # Remove obvious non-model placeholders while retaining the official EEA naming.
    if model in {"N/A", "NA", "UNKNOWN", "NOT AVAILABLE"}:
        continue

    fc = number(raw.get("fc"), 2)
    whkm = number(raw.get("whkm"), 0)
    kw = number(raw.get("kw"), 0)
    regs = int(number(raw.get("registrations"), 0) or 0)

    # A usable RouteSaver estimate needs either liquid-fuel consumption or EV consumption.
    if fc is None and whkm is None:
        continue

    key = (make, model, fuel, fuel_mode)
    if key in seen:
        continue
    seen.add(key)

    rows.append({
        "make": make,
        "model": model,
        "fuel": fuel,
        "fuel_mode": fuel_mode,
        "fc_l_100km": fc,
        "electric_wh_km": whkm,
        "power_kw": kw,
        "registrations": regs,
    })

rows.sort(key=lambda x: (-x["registrations"], x["make"], x["model"], x["fuel_mode"]))

out = {
    "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    "year": 2025,
    "status": "provisional",
    "source": "European Environment Agency (EEA)",
    "source_table": "CO2Emission.latest.co2cars_2025Pv31",
    "source_api": "https://discodata.eea.europa.eu/",
    "note": "Catalogo aggregato dai dati ufficiali EEA sulle nuove autovetture registrate nel 2025. I consumi sono medie dei record disponibili per marca, nome commerciale, carburante e fuel mode; non identificano necessariamente il singolo allestimento.",
    "vehicles": rows,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
print(f"Generated {len(rows)} vehicle groups from EEA 2025")
