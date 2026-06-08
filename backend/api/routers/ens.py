"""
ENS Scoring API Router
POST /api/ens/score — calculate full ENS score from building inputs
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Literal, Optional

router = APIRouter()

# ── Input model ────────────────────────────────────────────────────────────

class ENSScoringRequest(BaseModel):
    building_type: Literal["low_rise", "affordable", "high_rise"] = "low_rise"
    plot_area_sqm: float = Field(150, gt=0)
    floors: int = Field(1, ge=1, le=50)
    climate_zone: Literal["composite", "hot_dry", "warm_humid", "temperate", "cold"] = "composite"

    wall_u_value: float = Field(1.5, description="W/m²K")
    roof_u_value: float = Field(0.5, description="W/m²K")
    retv: float = Field(11.0, description="W/m² — Residential Envelope Transmittance Value")
    window_vlt: float = Field(0.30, description="Visible Light Transmittance 0–1")
    openable_wfr: float = Field(6.0, description="% Openable Window-to-Floor Ratio")
    has_overhangs: bool = True

    has_high_efficacy_lighting: bool = True
    has_auto_light_controls: bool = True
    has_elevator: bool = False
    has_regenerative_lift: bool = False
    has_bee5_star_pumps: bool = True
    has_vfd_pumps: bool = False
    power_factor: float = Field(0.97, ge=0, le=1)
    distribution_loss_percent: float = Field(2.5, ge=0)

    has_led_lighting: bool = True
    ceiling_fan_star_rating: int = Field(5, ge=1, le=5)
    ac_star_rating: int = Field(0, ge=0, le=5)
    has_solar_hot_water: bool = False
    has_solar_pv: bool = False

# ── Score calculation (mirrors TypeScript ENS engine) ─────────────────────

ENS_TARGETS = {"low_rise": 47, "affordable": 70, "high_rise": 100}
GRADE_MAP = [(160, "Excellent"), (100, "Good"), (47, "Compliant"), (0, "Non-Compliant")]

def calc_score(r: ENSScoringRequest) -> dict:
    categories = []

    # 1. Building Envelope
    env_mandatory = (
        (25 if (r.climate_zone == "cold" and r.wall_u_value <= 1.3) or (r.climate_zone != "cold" and r.retv <= 12) else 0) +
        (12 if r.roof_u_value <= 1.2 else 0) +
        (5  if r.openable_wfr >= 5 else 0) +
        (5  if r.window_vlt >= 0.27 else 0)
    )
    env_additional = (
        (15 if r.retv <= 8 else 0) +
        (10 if r.roof_u_value <= 0.8 else 0) +
        (8  if r.has_overhangs else 0) +
        (7  if r.openable_wfr >= 10 else 0)
    )
    categories.append({"name": "Building Envelope", "mandatory": env_mandatory, "additional": env_additional, "max": 87})

    # 2. Common Area Lighting
    categories.append({
        "name": "Common Area Lighting",
        "mandatory": 3 if r.has_high_efficacy_lighting else 0,
        "additional": (3 if r.has_auto_light_controls else 0) + (3 if r.has_high_efficacy_lighting and r.has_auto_light_controls else 0),
        "max": 9,
    })

    # 3. Elevators
    if r.has_elevator:
        elev_mand = (3 if r.has_high_efficacy_lighting else 0) + (3 if r.has_auto_light_controls else 0) + (4 if r.floors > 2 else 0) + (3 if r.floors > 3 else 0)
        elev_add  = (5 if r.has_regenerative_lift else 0) + (4 if r.floors > 5 else 0)
        categories.append({"name": "Elevators", "mandatory": elev_mand, "additional": elev_add, "max": 22})

    # 4. Pumps
    categories.append({
        "name": "Pumps",
        "mandatory": 6 if r.has_bee5_star_pumps else 0,
        "additional": (5 if r.has_vfd_pumps else 0) + (3 if r.has_vfd_pumps and r.has_bee5_star_pumps else 0),
        "max": 14,
    })

    # 5. Electrical
    categories.append({
        "name": "Electrical Systems",
        "mandatory": 1 if r.power_factor >= 0.97 else 0,
        "additional": (2 if r.distribution_loss_percent <= 3 else 0) + (2 if r.plot_area_sqm >= 500 else 0) + (1 if r.floors > 2 else 0),
        "max": 6,
    })

    # 6. Indoor Lighting
    categories.append({
        "name": "Indoor Lighting",
        "mandatory": (7 if r.has_led_lighting else 0) + (5 if r.has_auto_light_controls else 0),
        "additional": 0,
        "max": 12,
    })

    # 7. Comfort Systems
    fan_pts = 15 if r.ceiling_fan_star_rating >= 5 else 10 if r.ceiling_fan_star_rating >= 4 else 0
    ac_pts  = 25 if r.ac_star_rating >= 5 else 10 if r.ac_star_rating >= 3 else 0
    categories.append({"name": "Comfort Systems", "mandatory": min(50, fan_pts + ac_pts), "additional": 0, "max": 50})

    # 8. Renewable energy
    if r.has_solar_hot_water or r.has_solar_pv:
        categories.append({
            "name": "Renewable Energy",
            "mandatory": (10 if r.has_solar_hot_water else 0) + (10 if r.has_solar_pv else 0),
            "additional": 0,
            "max": 20,
        })

    total = sum(c["mandatory"] + c["additional"] for c in categories)
    target = ENS_TARGETS[r.building_type]
    compliant = total >= target
    grade = next(g for threshold, g in GRADE_MAP if total >= threshold)

    return {
        "total": total,
        "target": target,
        "compliant": compliant,
        "grade": grade,
        "energy_saving_percent": min(60, round((total / 220) * 65)),
        "categories": categories,
    }

@router.post("/score")
def ens_score(request: ENSScoringRequest):
    return calc_score(request)
