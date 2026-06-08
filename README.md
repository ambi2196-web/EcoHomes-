# EcoHomes 🌿

**Climate-adaptive home planning app** based on Eco Niwas Samhita (ENS) guidelines by the Bureau of Energy Efficiency, Government of India.

Enter your plot location → get layout suggestions, material recommendations, ENS compliance score, and a basic floor plan prototype.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Desktop | Tauri 2 (lightweight, ~5MB) |
| Mobile | Capacitor (same codebase) |
| Styling | Tailwind CSS |
| State | Zustand (persisted) |
| Maps | Leaflet + OpenStreetMap (free) |
| Climate Data | Open-Meteo + NASA POWER (free, no key) |
| LLM | Groq / Gemini / Ollama (free tiers) |
| Backend | FastAPI (Python) |

## Quick Start

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- [pnpm](https://pnpm.io) — `npm i -g pnpm`
- [Rust](https://rustup.rs) — for Tauri desktop
- [Python 3.11+](https://python.org) — for backend

### Run the desktop app (dev mode)

```bash
# 1. Install dependencies
pnpm install

# 2. Start the frontend dev server
pnpm desktop
# Opens at http://localhost:1420
```

### Run the backend (optional for Phase 0)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Fill in your API keys
uvicorn api.main:app --reload --port 8000
```

## Project Structure

```
ecohomes/
├── apps/
│   └── desktop/          # Tauri + React desktop app
│       ├── src/
│       │   ├── pages/    # Wizard steps (Step1–Step5)
│       │   ├── components/
│       │   ├── store/    # Zustand state
│       │   └── main.tsx
│       └── src-tauri/    # Tauri Rust config (init separately)
├── backend/
│   ├── api/main.py       # FastAPI entry point
│   └── requirements.txt
├── packages/             # Shared packages (Phase 2+)
├── ARCHITECTURE.md       # Full architecture & phase plan
└── README.md
```

## Build Phases

| Phase | What gets built |
|---|---|
| 0 ✅ | Foundation — React wizard shell, Tauri setup, state management |
| 1 | Location & Climate — map picker, climate zone, solar/wind data |
| 2 | ENS Compliance Engine — layout rules, materials, RETV/U-values |
| 3 | AI Consultation — LLM (Groq/Gemini/Ollama), style + budget |
| 4 | Prototype Generator — 2D/3D floor plan, PDF export |
| 5 | Polish & Scale — auth, cloud sync, mobile app |

## Free APIs Used

- **OpenStreetMap + Nominatim** — map tiles & geocoding (no key)
- **Open-Meteo** — climate data (no key)
- **NASA POWER API** — solar irradiance (no key)
- **Groq** — LLM inference (free 14,400 req/day)
- **Google Gemini** — LLM + image understanding (free tier)

## ENS Guidelines

This app implements [Eco Niwas Samhita 2018 (Part I)](https://beeindia.gov.in) and [ENS 2021 (Part II)](https://beeindia.gov.in) published by the Bureau of Energy Efficiency, Ministry of Power, Government of India.

---

*Built for climate-resilient, energy-efficient housing in India.*
