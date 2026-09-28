#!/usr/bin/env python3
import json
import math
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

VEHICLES = Path("data/vehicles.json")
CACHE = Path("data/battery-cache.json")
API = "https://co2cars.apps.eea.europa.eu/tools/api"
MAX_NEW = 700
WORKERS = 4

def tidy(v):
    return re.sub(r"\s+", " ", str(v or "").strip())

def norm(v):
    return re.sub(r"[^A-Z0-9]+", "", tidy(v).upper())

def finite(v):
    try:
        x = float(v)
        return x if math.isfinite(x) else None
    except (TypeError, ValueError):
        return None

def key(v):
    return "|".join([
        tidy(v.get("make")).upper(),
        tidy(v.get("model")).upper(),
        tidy(v.get("fuel")).lower(),
        tidy(v.get("fuel_mode")).upper(),
    ])

def query_spec(v):
    make = tidy(v.get("make")).upper()
    model = tidy(v.get("model")).upper()
    fuel = tidy(v.get("fuel")).lower()
    mode = tidy(v.get("fuel_mode")).upper()
    q = {
        "size": 300,
        "_source": ["Mk","Cn","Ft","Fm","z__Wh_km_","Zr","r"],
        "query": {
            "bool": {
                "must": [
                    {"term": {"year": 2025}},
                    {"term": {"Mk": make}},
                    {"match_phrase": {"Cn": model}},
                    {"term": {"Ft": fuel}},
                    {"term": {"Fm": mode}},
                    {"exists": {"field": "z__Wh_km_"}},
                    {"exists": {"field": "Zr"}},
                ]
            }
        }
    }
    url = API + "?source=" + urllib.parse.quote(json.dumps(q, separators=(",", ":")))
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "RouteSaver/1.6 (+https://github.com/baiez82-stack/routesaver)",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        data = json.load(r)

    rows = []
    for hit in ((data.get("hits") or {}).get("hits") or []):
        s = hit.get("_source") or {}
        if norm(s.get("Mk")) != norm(make):
            continue
        if norm(s.get("Cn")) != norm(model):
            continue
        if tidy(s.get("Ft")).lower() != fuel:
            continue
        if tidy(s.get("Fm")).upper() != mode:
            continue
        wh = finite(s.get("z__Wh_km_"))
        rng = finite(s.get("Zr"))
        reg = finite(s.get("r")) or 1
        if wh is None or rng is None or not (40 <= wh <= 600) or not (5 <= rng <= 1000):
            continue
        rows.append((wh, rng, max(1, reg)))

    if not rows:
        return None

    total = sum(w for _,_,w in rows)
    wh = sum(a*w for a,_,w in rows) / total
    rng = sum(b*w for _,b,w in rows) / total
    equivalent_kwh = wh * rng / 1000.0

    is_plugin = mode == "P" or "electric" in fuel and fuel != "electric"
    if is_plugin:
        if not (2 <= equivalent_kwh <= 80):
            return None
    else:
        if not (8 <= equivalent_kwh <= 200):
            return None

    return {
        "electric_range_km": round(rng, 0),
        "electric_wh_km": round(wh, 0),
        "battery_kwh_est": round(equivalent_kwh, 1),
        "samples": len(rows),
        "year": 2025,
        "method": "EEA electric range x electric energy consumption",
        "source": "European Environment Agency (EEA)",
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    }

payload = json.loads(VEHICLES.read_text(encoding="utf-8"))
vehicles = payload.get("vehicles") or []

if CACHE.exists():
    try:
        cache_payload = json.loads(CACHE.read_text(encoding="utf-8"))
        cache = cache_payload.get("specs") or {}
    except Exception:
        cache = {}
else:
    cache = {}

eligible = [
    v for v in vehicles
    if (tidy(v.get("fuel_mode")).upper() in {"E","P"} or "electric" in tidy(v.get("fuel")).lower())
    and finite(v.get("electric_wh_km")) is not None
]
eligible.sort(key=lambda v: -(finite(v.get("registrations")) or 0))

missing = [v for v in eligible if key(v) not in cache][:MAX_NEW]
print(f"Electrified groups: {len(eligible)}; cached: {len(eligible)-len([v for v in eligible if key(v) not in cache])}; querying: {len(missing)}")

def task(v):
    try:
        spec = query_spec(v)
        time.sleep(0.05)
        return key(v), spec, None
    except Exception as e:
        return key(v), None, str(e)

with ThreadPoolExecutor(max_workers=WORKERS) as ex:
    futures = [ex.submit(task, v) for v in missing]
    done = 0
    for fut in as_completed(futures):
        k, spec, err = fut.result()
        done += 1
        if spec:
            cache[k] = spec
        if done % 50 == 0:
            print(f"Processed {done}/{len(missing)}")

enriched = 0
for v in vehicles:
    spec = cache.get(key(v))
    if not spec:
        v.pop("electric_range_km", None)
        v.pop("battery_kwh_est", None)
        v.pop("battery_method", None)
        continue
    v["electric_range_km"] = spec["electric_range_km"]
    v["battery_kwh_est"] = spec["battery_kwh_est"]
    v["battery_method"] = spec["method"]
    enriched += 1

payload["battery_source"] = "European Environment Agency (EEA)"
payload["battery_note"] = "Battery kWh is an effective trip-energy estimate derived from EEA electric range and electric energy consumption. It is not the manufacturer's certified gross/net battery capacity."
payload["vehicles"] = vehicles
VEHICLES.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

CACHE.write_text(json.dumps({
    "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    "source": "European Environment Agency (EEA)",
    "source_api": API,
    "note": "Cached EEA electric range/consumption-derived battery estimates.",
    "specs": cache,
}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

print(f"Battery estimate available for {enriched} vehicle groups; cache size {len(cache)}")
