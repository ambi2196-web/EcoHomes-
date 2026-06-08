"""
EcoHomes Backend API
FastAPI server — handles ENS scoring, LLM consultation, and climate data proxy.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="EcoHomes API",
    description="Backend for the EcoHomes climate-adaptive home planner",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "http://localhost:3000", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}


from .routers import ens
app.include_router(ens.router, prefix="/api/ens", tags=["ENS Scoring"])

# Phase 3+
# from .routers import consult, layout
# app.include_router(consult.router, prefix="/api/consult", tags=["AI Consultation"])
# app.include_router(layout.router,  prefix="/api/layout",  tags=["Layout Generator"])
