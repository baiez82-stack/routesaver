#!/usr/bin/env python3
import csv, io, json, re, urllib.parse, urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

PAGE="https://climate-energy.eea.europa.eu/topics/transport/real-world-emissions/additional_information"
OUT=Path("data/realworld.json")

class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.href=None; self.buf=[]
    def handle_starttag(self, tag, attrs):
        if tag=="a":
            self.href=dict(attrs).get("href"); self.buf=[]
    def handle_data(self, data):
        if self.href: self.buf.append(data)
    def handle_endtag(self, tag):
        if tag=="a" and self.href:
            self.links.append(("".join(self.buf).strip(), self.href))
            self.href=None; self.buf=[]

def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"RouteSaver/0.6 (+https://github.com/baiez82-stack/routesaver)"})
    with urllib.request.urlopen(req,timeout=120) as r: return r.read()

def norm_make(s):
    s=re.sub(r"[^A-Z0-9]+"," ",(s or "").upper()).strip()
    aliases={
        "VOLKSWAGEN VW":"VOLKSWAGEN",
        "HYUNDAI MOTOR EUROPE":"HYUNDAI",
        "HYUNDAI":"HYUNDAI",
        "KIA CORPORATION":"KIA",
        "MERCEDES BENZ AG":"MERCEDES-BENZ",
        "BMW AG":"BMW",
        "TOYOTA MOTOR EUROPE":"TOYOTA",
        "STELLANTIS AUTO":"STELLANTIS",
    }
    return aliases.get(s,s)

def norm_fuel(s):
    s=(s or "").upper().replace(" ","")
    if "PETROL/ELECTRIC" in s or "GASOLINE/ELECTRIC" in s: return "plugin_petrol"
    if "DIESEL/ELECTRIC" in s: return "plugin_diesel"
    if s in ("PETROL","GASOLINE"): return "petrol"
    if s=="DIESEL": return "diesel"
    return s.lower()

html=fetch(PAGE).decode("utf-8","replace")
p=LinkParser(); p.feed(html)
links=[]
for text,href in p.links:
    if "Cars" in text and "Aggregate" in text and "Real-world" in text:
        m=re.search(r"\[(20\d{2})\]",text)
        if m: links.append((int(m.group(1)),text,urllib.parse.urljoin(PAGE,href)))
if not links: raise RuntimeError("EEA aggregate real-world cars dataset not found")
links.sort(reverse=True)
dataset_year,_,url=links[0]
raw=fetch(url)
decoded=None
for enc in ("utf-8-sig","utf-8","cp1252","latin-1"):
    try: decoded=raw.decode(enc); break
    except UnicodeDecodeError: pass
if decoded is None: raise RuntimeError("Cannot decode EEA CSV")
reader=csv.DictReader(io.StringIO(decoded))
records={}
fuel_pool={}

def fnum(row,*names):
    for n in names:
        v=row.get(n)
        if v not in (None,""):
            try: return float(str(v).replace(",","."))
            except: pass
    return None

for row in reader:
    make=norm_make(row.get("Manufacturer"))
    fuel=norm_fuel(row.get("Fuel Type"))
    if not make or fuel not in {"petrol","diesel","plugin_petrol","plugin_diesel"}: continue
    try: year=int(row.get("Year") or 0)
    except: year=0
    try: n=int(float(row.get("Number of vehicles") or 0))
    except: n=0
    ob=fnum(row,"OBFCM Fuel consumption weighted (l/100 km)","OBFCM Fuel consumption (l/100 km)")
    wl=fnum(row,"WLTP Fuel consumption weighted (l/100 km)","WLTP Fuel consumption (l/100 km)")
    if not ob or not wl or ob<=0 or wl<=0 or n<20: continue
    ratio=max(0.7,min(6.0,ob/wl))
    rec={"year":year,"vehicles":n,"obfcm_l_100km":round(ob,2),"wltp_l_100km":round(wl,2),"ratio":round(ratio,3)}
    key=f"{make}|{fuel}"
    prev=records.get(key)
    if prev is None or (year,n)>(prev["year"],prev["vehicles"]):
        records[key]=rec
    fuel_pool.setdefault(fuel,[]).append((ratio,n))

fallback={}
for fuel,vals in fuel_pool.items():
    total=sum(n for _,n in vals)
    if total:
        fallback[fuel]=round(sum(r*n for r,n in vals)/total,3)

payload={
    "updated_at":datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    "dataset_year":dataset_year,
    "source":"European Environment Agency (EEA) real-world OBFCM aggregate cars dataset",
    "source_url":url,
    "note":"Manufacturer/fuel calibration from aggregated real-world OBFCM fuel consumption. Applied to model-level EEA WLTP baseline; not a model-specific OBFCM measurement.",
    "calibration":records,
    "fallback_ratio":fallback
}
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
print(f"Wrote {len(records)} EEA real-world calibrations from dataset {dataset_year}")
