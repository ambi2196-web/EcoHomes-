# EcoHomes — Architecture & Phase Plan

> Construction consultation app for climate-adaptive homes based on Eco Niwas Samhita (ENS) guidelines by Bureau of Energy Efficiency, Government of India.

---

## 1. Tech Stack Decision — Why NOT Electron

Electron bundles a full Chromium browser (~150MB) and doesn't run on mobile. For a scalable product targeting both desktop and mobile from one codebase, the better stack is:

| Layer | Choice | Why |
|---|---|---|
| Frontend | **React + TypeScript + Vite** | Universal, huge ecosystem, works everywhere |
| Desktop wrapper | **Tauri** | Rust-based, uses system webview — app is ~5MB vs Electron's 150MB |
| Mobile wrapper | **Capacitor** | Wraps the same React build for iOS & Android |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, accessible, consistent |
| State management | **Zustand** | Lightweight, no boilerplate |
| Maps | **Leaflet + OpenStreetMap** | 100% free, no API key needed |
| Routing | **React Router v6** | Standard for React SPAs |
| Backend (Phase 3+) | **FastAPI (Python)** | Ideal for ML/LLM calls, ENS calculation engine |
| Database | **SQLite (local) → PostgreSQL (cloud)** | SQLite for offline desktop; migrate when you add cloud sync |
| 3D/visualization | **Three.js** | Free, browser-native 3D for prototype views |

### Folder Structure (Monorepo)
```
ecohomes/
├── apps/
│   ├── desktop/          # Tauri wrapper
│   ├── mobile/           # Capacitor config
│   └── web/              # Next.js (future public web version)
├── packages/
│   ├── ui/               # Shared React components
│   ├── ens-engine/       # ENS compliance calculator (pure TS)
│   └── types/            # Shared TypeScript types
├── backend/
│   ├── api/              # FastAPI server
│   ├── ens/              # ENS rules engine (Python)
│   └── llm/              # LLM prompt templates & calls
└── docs/
    └── ens/              # ENS PDF extracts, zone maps, tables
```

---

## 2. Free APIs Reference

### Maps & Location
| API | Free Tier | Use Case |
|---|---|---|
| **OpenStreetMap + Leaflet.js** | Unlimited (open) | Interactive map, plot selection |
| **Nominatim** (OSM geocoding) | Unlimited (fair use) | Address → lat/long |
| **Mapbox** | 50,000 loads/month | Satellite imagery of plot |
| **Overpass API** | Free | Nearby features (roads, trees, water) |

### Climate & Solar Data
| API | Free Tier | Use Case |
|---|---|---|
| **Open-Meteo** | Unlimited, no key | Temperature, humidity, wind speed by location |
| **NASA POWER API** | Unlimited, no key | Solar irradiance, wind rose data |
| **PVGIS** (EU Joint Research Centre) | Unlimited, no key | Solar panel yield estimation |
| **OpenWeatherMap** | 1,000 calls/day | Current weather + forecast |

### LLM (AI Consultation)
| API | Free Tier | Use Case |
|---|---|---|
| **Groq** | 14,400 req/day (Llama 3.3 70B) | Fast AI suggestions, very generous free tier |
| **Google Gemini** | 15 req/min, 1M tokens/day | Multimodal (can read floor plan images) |
| **Ollama** | Fully local, free forever | Offline mode — runs Llama/Mistral on user's machine |
| **OpenRouter** | Pay-per-use + some free models | Fallback, model flexibility |

> **Recommended LLM strategy:** Default to Groq (fast, free). Offer Ollama as "offline mode" for privacy-conscious users. Use Gemini for image understanding of floor plans.

### Building & Material Data
| Source | Type | Use Case |
|---|---|---|
| **BEE Star Rating DB** | Government open data | Appliance efficiency lookups |
| **ENS PDFs (embedded)** | Local JSON extracted from PDFs | Climate zones, RETV values, U-values |
| **IndiaMART / TradeIndia scraper** | Web | Material cost estimates (Phase 4+) |

---

## 3. ENS Knowledge Base (Core Data to Embed)

Extract these from the PDFs into structured JSON files in `docs/ens/`:

### Climate Zones (ENS Part I)
India has 5 ENS climate zones:
- `composite` — Delhi, Lucknow, Nagpur
- `hot_dry` — Jaipur, Ahmedabad, Hyderabad
- `warm_humid` — Mumbai, Chennai, Kochi
- `temperate` — Pune, Bengaluru, Shimla (mild)
- `cold` — Srinagar, Leh, Dehradun (hills)

### Key ENS Rules to Encode
- **RETV ≤ 12 W/m²** for composite, hot-dry, warm-humid, temperate climates
- **Roof U-value ≤ 1.2 W/m²·K** for all zones
- **Cold climate wall U-value ≤ 1.3 W/m²·K**
- **Openable window-to-floor area ratio**: ≥ 5% (for natural ventilation)
- **Visible Light Transmittance (VLT)**: ≥ 0.27 for windows
- **ENS Score minimums**: Low-rise=47, Affordable=70, High-rise=100

---

## 4. Phase-Wise Build Plan

---

### PHASE 0 — Foundation (Week 1–2)
> Goal: Monorepo running, base app shell on desktop

**Tasks:**
- [ ] Init monorepo with Turborepo + pnpm workspaces
- [ ] Set up `apps/desktop` with Tauri + React + TypeScript + Vite
- [ ] Set up Tailwind CSS + shadcn/ui component library
- [ ] Set up Zustand store skeleton
- [ ] Set up FastAPI backend with basic `/health` endpoint
- [ ] Configure SQLite with Prisma (ORM)
- [ ] Set up basic multi-step wizard shell (Step 1 → 2 → 3)
- [ ] Configure Capacitor for mobile packaging

**Deliverable:** Empty wizard app that opens on desktop, navigates steps, has a working API connection.

---

### PHASE 1 — Location & Climate Intelligence (Week 3–5)
> Goal: User picks plot location → app knows climate zone, sun path, wind, temperature ranges

**Features:**
- Interactive map (Leaflet) — user clicks to place plot pin
- Address search via Nominatim geocoder
- Auto-detect ENS climate zone from lat/long (using a bundled GeoJSON zone map)
- Fetch climate data: temperature range, humidity, wind direction (Open-Meteo)
- Fetch solar data: peak sun hours, best facade orientation (NASA POWER)
- User inputs: plot size (m²), plot shape (rectangular/irregular), facing direction

**Output shown to user:**
- Climate zone badge (e.g., "Warm-Humid Zone")
- Annual temperature range (min/max)
- Prevailing wind direction
- Best orientation for the building (N-S axis recommendation)
- Hours of sunlight per season

**Key Files:**
```
packages/ens-engine/src/
├── climateZone.ts       # lat/long → ENS zone lookup
├── solarAnalysis.ts     # NASA POWER API integration
└── windAnalysis.ts      # Open-Meteo wind data
```

---

### PHASE 2 — ENS Compliance Engine (Week 6–8)
> Goal: Given plot + requirements, generate a rule-compliant basic layout recommendation

**Features:**
- Input: number of rooms, parking bays, open space %, building type (low-rise/high-rise)
- Calculate ENS score target (47 / 70 / 100 based on building type)
- Generate layout principles:
  - Room orientation (which rooms face which direction for light/heat)
  - Window-to-floor area ratio per room (minimum 5% for natural ventilation)
  - Roof design (flat vs. sloped based on rainfall in zone)
  - Shade overhangs (based on sun angle in that climate zone)
- Material recommendations table:
  - Wall: thermal conductivity, thickness to meet RETV ≤ 12 W/m²
  - Roof: U-value ≤ 1.2 W/m²·K — fly ash bricks, clay tiles, insulated concrete
  - Windows: VLT ≥ 0.27, recommended glass type per zone
- Predicted ambient temperature range (if ENS suggestions followed vs. not)
- ENS compliance score estimate

**Output shown to user:**
- Schematic layout diagram (SVG, generated in-browser)
- Material recommendations card per element (wall, roof, window, floor)
- "If you follow these → your home stays X°C cooler without AC" estimate
- ENS Score dashboard

**Key Files:**
```
packages/ens-engine/src/
├── layoutEngine.ts       # Room placement logic
├── materialEngine.ts     # RETV/U-value calculations
├── ensScoring.ts         # Points calculator
└── thermalComfort.ts     # Predicted indoor temperature model
```

---

### PHASE 3 — AI Consultation Layer (Week 9–11)
> Goal: LLM-powered conversation that personalizes suggestions to user style + budget

**Features:**
- Style preference quiz: Modern / Traditional / Vernacular / Minimalist
- Budget input (₹ range: under 30L / 30–60L / 60–1Cr / 1Cr+)
- Number of floors
- Special needs (elderly in family, home office, vastu preference toggle)
- AI chat: "Ask anything about your home design"
- LLM generates: personalized material upgrades, design suggestions within budget

**LLM Prompt Strategy:**
```
System: You are an expert architect and ENS consultant. The user's home is in [zone], 
plot [size]m², [N/S/E/W] facing. ENS target score: [X]. Current compliance: [Y points].
Budget: [₹ range]. Style: [Modern/Traditional]. 
Always give suggestions aligned with ENS Part I & II guidelines.

User: [question]
```

**Backend API endpoints:**
```
POST /api/consult          # LLM consultation
POST /api/ens/score        # Calculate ENS score
GET  /api/climate/:lat/:lng # Climate data for location
POST /api/layout/generate  # Generate layout suggestions
```

---

### PHASE 4 — Prototype Generator (Week 12–15)
> Goal: Visual floor plan prototype + 3D preview

**Features:**
- Auto-generate 2D floor plan SVG based on room count + layout rules
- Room labeling, door/window placement
- 3D preview with Three.js (simple box model with textures)
- Sun shadow simulation (time-of-day slider)
- Export: PDF report, PNG floor plan

**Floor Plan Generator Logic:**
- Grid-based placement: rooms placed on optimal N/S/E/W axis
- Fixed rules: Kitchen → East (morning sun), Bedroom → quiet side, Living → South for light
- Auto-calculate room sizes from total carpet area and room count

**Report Contents:**
- Plot summary
- Climate zone analysis
- ENS compliance score + breakdown
- Material specifications
- Layout diagram
- Estimated energy savings vs. non-ENS home
- Estimated cost range

---

### PHASE 5 — Polish & Scale (Week 16+)
> Goal: Product-ready, monetizable, scalable

**Features:**
- User accounts + cloud sync (Supabase — generous free tier)
- Save/load multiple projects
- Share project link (read-only URL)
- Architect/contractor directory integration
- Multilingual support (Hindi, regional languages)
- Mobile app build (Capacitor → iOS/Android)
- Web version (Next.js) for browser access
- Premium tier: detailed 3D renders, structural engineer consultation booking

---

## 5. Data Flow Overview

```
User Input (Location, Requirements)
        ↓
[Phase 1] Climate Engine
  → ENS Zone, Solar Data, Wind Data, Temperature
        ↓
[Phase 2] ENS Compliance Engine
  → Layout Rules, Material Specs, ENS Score
        ↓
[Phase 3] LLM Consultation
  → Personalized suggestions (style + budget filtered)
        ↓
[Phase 4] Prototype Generator
  → 2D Floor Plan SVG + 3D Preview + PDF Report
```

---

## 6. Development Priorities

1. **Start with Phase 0 + Phase 1** — the location/climate engine is the unique core of this product and everything downstream depends on it.
2. **Embed ENS rules as structured JSON** — don't rely on the PDFs at runtime; extract and encode all tables and values.
3. **Keep the LLM optional** — the app must work without an internet connection (offline mode via Ollama). LLM enhances but doesn't replace the rules engine.
4. **Design mobile-first** — even though Tauri is the primary desktop target, designing for 375px width first ensures the Capacitor mobile build works without rework.
5. **No vendor lock-in on LLM** — use an abstraction layer (`llm/provider.ts`) that can swap Groq ↔ Gemini ↔ Ollama with a config change.

---

## 7. Immediate Next Steps (Start Here)

```bash
# 1. Init project
npm create tauri-app@latest ecohomes -- --template react-ts
cd ecohomes

# 2. Add dependencies
pnpm add leaflet react-leaflet zustand @tanstack/react-query
pnpm add -D tailwindcss postcss autoprefixer @shadcn/ui

# 3. Backend
cd backend && python -m venv venv
pip install fastapi uvicorn httpx python-dotenv

# 4. Create .env
GROQ_API_KEY=           # get free at console.groq.com
GEMINI_API_KEY=         # get free at aistudio.google.com
# No key needed for OpenStreetMap, Open-Meteo, NASA POWER
```

---

*Document version: 1.0 | Based on ENS Part I (2018) + ENS Part II (2021) by Bureau of Energy Efficiency, Ministry of Power, Government of India*
