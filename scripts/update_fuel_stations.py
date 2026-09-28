#!/usr/bin/env python3
import csv, io, json, urllib.request
from datetime import datetime, timezone
from pathlib import Path

REGISTRY="https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv"
PRICES="https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv"
OUT=Path("data/fuel-stations.json")

def fetch_text(url):
    req=urllib.request.Request(url,headers={"User-Agent":"RouteSaver/0.6 (+https://github.com/baiez82-stack/routesaver)"})
    with urllib.request.urlopen(req,timeout=120) as r: raw=r.read()
    for enc in ("utf-8-sig","utf-8","cp1252","latin-1"):
        try: return raw.decode(enc)
        except UnicodeDecodeError: pass
    raise RuntimeError("Cannot decode "+url)

def rows(text):
    lines=[x for x in text.splitlines() if x.strip()]
    if len(lines)<3: return [],None
    extraction=lines[0].strip()
    return csv.DictReader(io.StringIO("\n".join(lines[1:])),delimiter="|"),extraction

reg_reader,reg_date=rows(fetch_text(REGISTRY))
price_reader,price_date=rows(fetch_text(PRICES))

stations={}
for r in reg_reader:
    try:
        sid=str(int(r.get("idImpianto") or 0))
        lat=float((r.get("Latitudine") or "").replace(",","."))
        lon=float((r.get("Longitudine") or "").replace(",","."))
    except: continue
    if not (35<=lat<=48 and 5<=lon<=20): continue
    stations[sid]={
        "id":sid,
        "lat":round(lat,6),
        "lon":round(lon,6),
        "brand":(r.get("Bandiera") or "").strip(),
        "name":(r.get("Nome Impianto") or "").strip(),
        "type":(r.get("Tipo Impianto") or "").strip(),
        "address":(r.get("Indirizzo") or "").strip(),
        "city":(r.get("Comune") or "").strip(),
        "province":(r.get("Provincia") or "").strip(),
        "p":{}
    }

fuel_map={"benzina":"b","gasolio":"d"}
for r in price_reader:
    sid=(r.get("idImpianto") or "").strip()
    st=stations.get(sid)
    if not st: continue
    fuel=fuel_map.get((r.get("descCarburante") or "").strip().lower())
    if not fuel: continue
    try: price=float((r.get("prezzo") or "").replace(",","."))
    except: continue
    if not (0.5<price<5): continue
    self_flag=(r.get("isSelf") or "").strip()=="1"
    key=fuel+("s" if self_flag else "v")
    st["p"][key]=round(price,3)
    dt=(r.get("dtComu") or "").strip()
    if dt: st["p"][key+"d"]=dt

compact=[]
for st in stations.values():
    if not st["p"]: continue
    compact.append(st)
compact.sort(key=lambda x:(x["province"],x["city"],x["id"]))

payload={
    "updated_at":datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    "registry_extraction":reg_date,
    "prices_extraction":price_date,
    "source":"Ministero delle Imprese e del Made in Italy (MIMIT)",
    "registry_url":REGISTRY,
    "prices_url":PRICES,
    "license":"IODL 2.0",
    "note":"Impianti attivi e prezzi comunicati al MIMIT. bs=benzina self, bv=benzina servito, ds=gasolio self, dv=gasolio servito.",
    "stations":compact
}
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print(f"Wrote {len(compact)} MIMIT fuel stations")
