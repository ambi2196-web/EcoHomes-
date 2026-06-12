"""
AI Consultation Router
POST /api/consult/chat — ENS-aware AI home design advisor

Uses Groq API (llama-3.3-70b-versatile) when GROQ_API_KEY is set.
Falls back to deterministic rule-based answers when no key is present.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import os, json

router = APIRouter()

# ── Request / Response models ──────────────────────────────────────────────

class ProjectContext(BaseModel):
    climate_zone: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    plot_area_sqm: Optional[float] = None
    floors: Optional[int] = None
    bedrooms: Optional[int] = None
    building_type: Optional[str] = None
    ens_score: Optional[int] = None
    ens_grade: Optional[str] = None
    ens_compliant: Optional[bool] = None
    predicted_indoor_temp: Optional[float] = None
    peak_sun_hours: Optional[float] = None
    prevailing_wind: Optional[str] = None
    style: Optional[str] = None
    budget: Optional[str] = None
    material_recommendations: Optional[dict] = None
    layout_suggestions: Optional[List[str]] = None

class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class ConsultRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    context: Optional[ProjectContext] = None

class ConsultResponse(BaseModel):
    reply: str
    source: str   # "groq" | "gemini" | "fallback"

# ── System prompt builder ──────────────────────────────────────────────────

ENS_SYSTEM_PROMPT = """You are EcoConsult, an expert AI home design advisor for India.
You specialise in the Eco Niwas Samhita (ENS) guidelines published by the Bureau of Energy Efficiency (BEE), Government of India.

Your role:
- Help homeowners understand how to build climate-adaptive, energy-efficient homes
- Explain ENS compliance requirements in simple, practical language
- Suggest specific materials, design choices, and construction practices
- Reference ENS Part I (2018) and Part II (2021) clauses when relevant
- Give cost-effective advice suitable for the user's budget
- Recommend local Indian materials and construction techniques

ENS Key Rules (always apply):
- RETV (Residential Envelope Transmittance Value) ≤ 12 W/m² for all zones
- Roof U-value ≤ 1.2 W/m²K (≤ 0.8 recommended)
- Openable Window-to-Floor Ratio ≥ 5% per habitable room
- Window VLT (Visible Light Transmittance) ≥ 0.27
- 5 climate zones: Composite, Hot & Dry, Warm & Humid, Temperate, Cold

Tone: Friendly, practical, and confident. Use Indian context (rupees, local materials, contractors).
Keep answers concise — 3-5 sentences unless detailed technical advice is needed.
Always end with an actionable next step or question to keep the conversation going.
"""

def build_context_block(ctx: ProjectContext) -> str:
    if not ctx:
        return ""
    parts = ["USER'S PROJECT DETAILS:"]
    if ctx.location_city:
        parts.append(f"- Location: {ctx.location_city}, {ctx.location_state or ''}")
    if ctx.climate_zone:
        parts.append(f"- ENS Climate Zone: {ctx.climate_zone.replace('_', ' ').title()}")
    if ctx.plot_area_sqm:
        parts.append(f"- Plot Area: {ctx.plot_area_sqm} m²")
    if ctx.floors:
        parts.append(f"- Floors: {ctx.floors}")
    if ctx.bedrooms:
        parts.append(f"- Bedrooms: {ctx.bedrooms}")
    if ctx.building_type:
        parts.append(f"- Building Type: {ctx.building_type.replace('_', ' ').title()}")
    if ctx.ens_score is not None:
        parts.append(f"- ENS Score: {ctx.ens_score}/220 pts ({ctx.ens_grade or ''}) — {'Compliant ✓' if ctx.ens_compliant else 'Not Compliant ✗'}")
    if ctx.predicted_indoor_temp:
        parts.append(f"- Predicted Indoor Temp (with ENS): {ctx.predicted_indoor_temp}°C")
    if ctx.peak_sun_hours:
        parts.append(f"- Peak Sun Hours: {ctx.peak_sun_hours} hrs/day")
    if ctx.prevailing_wind:
        parts.append(f"- Prevailing Wind: {ctx.prevailing_wind}")
    if ctx.style:
        parts.append(f"- Architecture Style: {ctx.style.replace('_', ' ').title()}")
    if ctx.budget:
        parts.append(f"- Budget: {ctx.budget.replace('_', ' ').title()}")
    if ctx.material_recommendations:
        mats = ", ".join(f"{k}: {v}" for k, v in list(ctx.material_recommendations.items())[:4])
        parts.append(f"- Recommended Materials: {mats}")
    return "\n".join(parts)


# ── Rule-based fallback ────────────────────────────────────────────────────

FALLBACK_RULES = [
    (["retv", "envelope", "transmittance"],
     "RETV (Residential Envelope Transmittance Value) must be ≤ 12 W/m² under ENS. You can achieve this by using reflective roof coatings (cool roof tiles), 230mm thick brick walls with external plaster, and double-glazed or low-E glass windows. For a composite zone, prioritise roof insulation first — it gives you the biggest RETV reduction per rupee spent."),
    (["roof", "insulation", "terrace"],
     "For roof insulation in Indian climates, expanded polystyrene (EPS) boards (50mm thick) under a screed are cost-effective at ₹80–120/sqft. Alternatively, inverted roof systems with XPS boards work well. ENS requires a U-value ≤ 1.2 W/m²K; EPS at 50mm gets you to ~0.65 W/m²K — well above compliance."),
    (["window", "glass", "glazing", "vlt"],
     "ENS requires Visible Light Transmittance (VLT) ≥ 0.27 and openable area ≥ 5% of floor area per room. Use clear or lightly tinted glass (avoid dark tints below 0.27 VLT). For warm/humid zones, cross-ventilation matters more than glazing area — orient windows on opposite walls to catch the prevailing breeze."),
    (["solar", "pv", "panel", "renewable"],
     "A 1 kWp rooftop solar PV system in India costs ₹50,000–70,000 after subsidies (MNRE PM Surya Ghar scheme gives up to ₹18,000 subsidy). For a 3BHK home, a 3–5 kWp system covers 70–80% of electricity needs and adds 20 ENS points to your score. South-facing panels at 15–25° tilt are optimal for most Indian locations."),
    (["vastu", "direction", "orientation", "north", "south", "east", "west"],
     "ENS and Vastu often align: north or east-facing main entrances maximise morning light and reduce west-wall heat gain. The ENS recommends living rooms face north/east (cooler, indirect light) and kitchens face east (morning sun for cooking). South-facing rooms should have deep overhangs of 0.6–1.2m to block high summer sun."),
    (["material", "brick", "wall", "concrete"],
     "For the composite zone, burnt clay bricks (230mm thick) with cement-lime plaster give a U-value of ~1.8 W/m²K — above ENS limits alone. Add 25mm AAC block or thermocol insulation on the outer face to bring it to ~0.9 W/m²K and full ENS compliance. AAC blocks (Autoclaved Aerated Concrete) cost ₹45–65/brick and are 3× lighter than clay bricks."),
    (["ventilation", "air", "cross"],
     "Cross-ventilation is your best free cooling tool. Place openings on opposite walls — ideally north and south — and size them so inlet area equals outlet area. ENS requires ≥5% openable WFR per room, but 8–10% significantly improves air changes per hour. Jalis (perforated screens) on west facades reduce heat but maintain airflow."),
    (["budget", "cost", "cheap", "affordable", "rupee"],
     "ENS compliance doesn't require expensive materials. Priority investments by ROI: (1) Cool roof tiles/coating — ₹15–25/sqft, cuts cooling load by 30%; (2) Cross-ventilation layout — free, saves AC costs; (3) AAC block walls — 10% costlier than brick but reduces structural load; (4) LED lighting throughout — ₹8,000–15,000 for a 3BHK, saves ₹3,000/year."),
    (["score", "ens", "compliance", "points"],
     "Your ENS score reflects 8 categories: Building Envelope (87 pts max), Lighting, Pumps, Electrical, Comfort Systems, and Renewable Energy. The minimum for a low-rise home is 47 points. Quick wins: install 5-star ceiling fans (15 pts), use LED lighting throughout (7 pts), add roof insulation to bring U-value ≤ 0.8 (10 pts). These three alone give you 32 pts."),
]

def rule_based_reply(message: str, ctx: Optional[ProjectContext]) -> str:
    msg_lower = message.lower()
    for keywords, reply in FALLBACK_RULES:
        if any(kw in msg_lower for kw in keywords):
            zone_note = ""
            if ctx and ctx.climate_zone:
                zone_note = f" (specific to your {ctx.climate_zone.replace('_', ' ')} zone)"
            return reply + zone_note
    # Generic fallback
    zone = ctx.climate_zone.replace("_", " ").title() if ctx and ctx.climate_zone else "your"
    score = f"Your current ENS score is {ctx.ens_score}/220 pts. " if ctx and ctx.ens_score else ""
    return (
        f"{score}For a {zone} climate home, the key ENS priorities are: "
        "roof insulation (biggest thermal impact), cross-ventilation layout, and cool roof coating. "
        "What specific aspect would you like advice on — materials, layout orientation, window sizing, or energy systems?"
    )


# ── Groq LLM call ──────────────────────────────────────────────────────────

async def call_groq(messages: list) -> str:
    try:
        from groq import Groq
        client = Groq(api_key=os.environ["GROQ_API_KEY"])
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=512,
        )
        return completion.choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"Groq error: {e}")


async def call_gemini(messages: list) -> str:
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel("gemini-1.5-flash")
        # Flatten to a single prompt for simplicity
        prompt = "\n\n".join(f"{m['role'].upper()}: {m['content']}" for m in messages)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise RuntimeError(f"Gemini error: {e}")


# ── Main endpoint ──────────────────────────────────────────────────────────

@router.post("/chat", response_model=ConsultResponse)
async def chat(req: ConsultRequest):
    groq_key = os.environ.get("GROQ_API_KEY", "")
    gemini_key = os.environ.get("GEMINI_API_KEY", "")

    context_block = build_context_block(req.context) if req.context else ""
    system_content = ENS_SYSTEM_PROMPT
    if context_block:
        system_content += f"\n\n{context_block}"

    # Build message history for the LLM
    messages = [{"role": "system", "content": system_content}]
    for msg in req.history[-10:]:   # last 10 turns to stay within context
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": req.message})

    # Try Groq first, then Gemini, then fallback
    if groq_key:
        try:
            reply = await call_groq(messages)
            return ConsultResponse(reply=reply, source="groq")
        except Exception:
            pass

    if gemini_key:
        try:
            reply = await call_gemini(messages)
            return ConsultResponse(reply=reply, source="gemini")
        except Exception:
            pass

    # Rule-based fallback (no API key needed)
    reply = rule_based_reply(req.message, req.context)
    return ConsultResponse(reply=reply, source="fallback")
