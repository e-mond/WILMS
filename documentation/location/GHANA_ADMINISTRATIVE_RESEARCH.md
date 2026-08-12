# Ghana Administrative Research

**Product version:** 1.8.0  
**Language:** British English  
**Research date:** 12 August 2026

This note records only claims that can be traced to a named public source. Where a national dataset is incomplete, the gap is stated. No community, electoral area, or sub-district unit was invented to fill a blank.

---

## Constitutional and local-government stack

Ghana’s decentralised local government is organised as:

1. **Country**
2. **Region** (16)
3. **Metropolitan / Municipal / District Assembly (MMDA)** (261)
4. **Sub-district structures** — Sub-Metropolitan District Councils in metropolitan assemblies; Area, Zonal, Town, and Urban Councils in municipal and district assemblies
5. **Electoral areas** — the elected Assembly Member constituency inside an MMDA
6. **Communities / suburbs / neighbourhoods** — localities used for service delivery; not always coterminous with electoral areas
7. **Street / landmark** — free text (Ghana Post GPS, house description)

Primary references:

| Source | What it confirms |
|--------|------------------|
| [IMCCOD MMDA register](https://imccod.gov.gh/mmdas/) | 261 named MMDAs with region and capital |
| [Ghana Districts / Local Government Service compilation](https://www.ghanadistricts.com/Content/Pdf_Files/6c01d1bd-8f2f-4ed9-aac6-99e87b2edf7c.pdf) | 16 regions; 261 MMDAs; metropolitan / municipal / district split |
| Local Government Act framework (Act 936 and LI sub-structures) | Sub-metro, area, zonal, town, and urban councils exist as subordinate bodies of assemblies |
| Ghana Statistical Service | Census and administrative geography; preferred future master for communities |
| geoBoundaries / GADM / OSM | Boundary polygons and ADM1/ADM2 codes; **not** used as community name authorities in this sprint |

---

## Sixteen regions

WILMS already stores these region names. They match the 2018–2019 regional reorganisation:

| Code | Region |
|------|--------|
| GAR | Greater Accra |
| ASH | Ashanti |
| WES | Western |
| CEN | Central |
| EAS | Eastern |
| NOR | Northern |
| VOL | Volta |
| UPE | Upper East |
| UPW | Upper West |
| BON | Bono |
| BEA | Bono East |
| AHA | Ahafo |
| WNO | Western North |
| OTI | Oti |
| NEE | North East |
| SAV | Savannah |

---

## 261 MMDAs

The import dataset is transcribed from the IMCCOD table (serial 1–261). Category is derived from the official name:

- name contains `Metropolitan` → **Metropolitan**
- name contains `Municipal` → **Municipal**
- otherwise → **District**

Known source-text corrections applied during normalisation (documented, not silent):

| IMCCOD text | Normalisation |
|-------------|---------------|
| `MUNICPAL` (Mampong) | Treated as Municipal |
| Hyphen / space variants (`Sekondi Takoradi` vs `Sekondi-Takoradi`) | Matched by normalised name so existing WILMS rows are not duplicated |

Capitals are stored as metadata on the import record where IMCCOD published them. They are not a separate hierarchy level.

A full machine-readable copy lives in `scripts/location-sync/datasets/imccod-mmdas.ts`.

---

## Sub-district structures

National, complete lists of Area Councils, Zonal Councils, Town Councils, and Urban Councils were **not** published as a single open dataset that could be verified for this sprint. WILMS therefore imports sub-district units only where an official assembly source names them.

### Sekondi-Takoradi Metropolitan Assembly (verified)

STMA is a metropolitan assembly in the Western Region. Independent sources agree there are **three** Sub-Metropolitan District Councils and **36** electoral areas:

| Sub-metro | Source |
|-----------|--------|
| Sekondi Sub-Metropolitan District Council | [STMA Sekondi Sub-Metro](https://www.stma.gov.gh/sekondi-sub-metro.php), [GNA inauguration report](https://gna.org.gh/2024/06/stma-inaugurates-ninth-sub-metropolitan-district-councils-unit-committees/) |
| Takoradi Sub-Metropolitan District Council | [STMA Takoradi Sub-Metro](https://stma.gov.gh/takoradi-sub-metro.php) |
| Essikado-Ketan Sub-Metropolitan District Council | [STMA Essikado Ketan Sub-Metro](https://stma.gov.gh/essikado-sub-metro.php) |

MoFEP composite budget and the STMA profile also state 36 electoral areas.

---

## Electoral areas (STMA)

The 36 electoral areas are taken from the [STMA Assembly Members register](https://stma.gov.gh/assembly-members.php). Names are stored as published, with aliases for spelling variants (for example `RAILWAY & HABOUR` → alias `Railway & Harbour`; `BAKAEKYIR` / `Bakaeyile`).

Sub-metro pages list a mixture of electoral areas and neighbourhoods. Those neighbourhoods that are **not** in the 36-member register are imported as **communities**, not as extra electoral areas.

---

## Communities / suburbs (STMA)

Verified locality names used in this sprint:

**Sekondi Sub-Metro page:** Sekondi Ridge, Fijai, Kweikuma, Bakaeyile / Bakaekyir, Adiembra, Bakado, Essaman, Ekuase.

**Takoradi Sub-Metro page:** Beach Road, Chapel Hill, Takoradi, New Takoradi.

**Essikado-Ketan Sub-Metro page:** Essikado, Ketan Estate, Butumagyebu, Ahinkofikrom, Kojokrom, Essipong, Twabewu, Anoe, Mpintsin, Eshiem, Sofokrom, Mempeasem, Nkenya, Nkroful, Ngyiresia.

**Assembly Member electoral-area names** that are also used as community labels (Asamansudu, Zongo/Estate, Nkontompo, Railway & Harbour, European Town is **not** on the STMA pages reviewed — it is **not** imported as an official community until a source is attached).

User-requested names that **are** evidenced: Fijai, Kweikuma, Adiembra, Bakado, Bakaekyir, Essaman, Ekuase, Nkontompo, Ngyiresia, Asamansudo / Asamansudu, Zongo, Estate, Mempeasem, Railway & Harbour, Old Sekondi is not separately listed on the STMA pages above and is therefore **not** fabricated.

---

## Adapter sources (future)

| Adapter | Intended use | Status |
|---------|--------------|--------|
| `gss.ts` | Official community and MMDA names | Stub — awaits licensed GSS extract |
| `geoboundaries.ts` | ADM1/ADM2 polygons and codes | Adapter present; not hardcoded in app logic |
| `gadm.ts` | Alternate ADM boundaries | Stub |
| `osm.ts` | Administrative relations and locality nodes | Stub — must be reviewed before name import |

---

## Remaining gaps

- National Area / Zonal / Town / Urban Council gazetteer
- National electoral-area list from the Electoral Commission
- GSS locality file for all 261 MMDAs
- Geometry / PostGIS polygons (documented in GIS preparation; not loaded here)
