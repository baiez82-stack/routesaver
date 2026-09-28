#!/usr/bin/env python3
import csv
import io
import json
import re
import statistics
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SOURCE_URL = "https://www.mimit.gov.it/images/stories/carburanti/MediaRegionaleStradale.csv"
OUT = Path("data/fuel.json")

def clean(s):
    return re.sub(r"\s+", " ", (s or "").strip())

def key(s):
    return re.sub(r"[^A-Z0-9]+", "", clean(s).upper())

req = urllib.request.Request(
    SOURCE_URL,
    headers={
        "User-Agent": "RouteSaver/0.1 (+https://github.com/baiez82-stack/routesaver)",
        "Accept": "text/csv,text/plain,*/*",
    },
)
with urllib.request.urlopen(req, timeout=30) as response:
    raw = response.read()

text = None
for enc in ("utf-8-sig", "utf-8", "cp1252", "latin-1"):
    try:
        text = raw.decode(enc)
        break
    except UnicodeDecodeError:
        pass
if text is None:
    raise RuntimeError("Impossibile decodificare il CSV MIMIT")

lines = [line for line in text.splitlines() if line.strip()]
header_idx = None
for i, line in enumerate(lines[:15]):
    u = line.upper()
    if "REGIONE" in u and ("TIPOLOGIA" in u or "CARBUR" in u):
        header_idx = i
        break
if header_idx is None:
    raise RuntimeError("Header MIMIT non riconosciuto")

sample = "\n".join(lines[header_idx:header_idx + 12])
try:
    dialect = csv.Sniffer().sniff(sample, delimiters=";|,\t")
    delimiter = dialect.delimiter
except csv.Error:
    delimiter = ";"

reader = csv.DictReader(io.StringIO("\n".join(lines[header_idx:])), delimiter=delimiter)
headers = {key(h): h for h in (reader.fieldnames or [])}

def find_header(*needles):
    for normalized, original in headers.items():
        if any(n in normalized for n in needles):
            return original
    return None

h_region = find_header("REGIONE", "PROVINCIA")
h_fuel = find_header("TIPOLOGIA", "CARBURANTE")
h_service = find_header("EROGAZIONE", "SERVIZIO")
h_price = find_header("PREZZOMEDIO", "PREZZO")

if not all((h_region, h_fuel, h_service, h_price)):
    raise RuntimeError(f"Colonne MIMIT non riconosciute: {reader.fieldnames}")

regions = {}
values = {"benzina": [], "gasolio": []}

for row in reader:
    region = clean(row.get(h_region))
    fuel = clean(row.get(h_fuel)).lower()
    service = clean(row.get(h_service)).upper()
    price_raw = clean(row.get(h_price)).replace(",", ".")
    if not region or service != "SELF":
        continue
    if fuel not in ("benzina", "gasolio"):
        continue
    try:
        price = float(price_raw)
    except ValueError:
        continue
    if not (0.5 < price < 5):
        continue
    rkey = region.upper()
    regions.setdefault(rkey, {})[fuel] = round(price, 3)
    values[fuel].append(price)

national = {
    fuel: round(statistics.fmean(vals), 3)
    for fuel, vals in values.items()
    if vals
}

date_match = re.search(r"(\d{2}[-/]\d{2}[-/]\d{4}|\d{4}[-/]\d{2}[-/]\d{2})", "\n".join(lines[:5]))
extraction = date_match.group(1) if date_match else None

payload = {
    "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    "dataset_date": extraction,
    "source": "Ministero delle Imprese e del Made in Italy (MIMIT)",
    "source_url": SOURCE_URL,
    "license": "IODL 2.0",
    "note": "Prezzi medi regionali stradali MIMIT. Benzina e gasolio in modalita SELF.",
    "regions": regions,
    "national": national,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Aggiornate {len(regions)} aree regionali/provinciali")
