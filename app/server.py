# app/server.py
# Author: Mohibul Hoque
# Email: hokworks@gmail.com
# LinkedIn: linkedin.com/in/speedymohibul
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Import backend ADK runner helpers
from app.main import (
    init_patient_session,
    get_patient_digital_twin,
    update_patient_digital_twin,
    send_message_to_agents,
)

# Import clinical database tools
from mcp_servers.medical_db import check_drug_interaction
from app.schema import PatientDigitalTwin, HealthRecord, LabResult

app = FastAPI(title="PulseOS Backend API")

# Enable CORS for frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper Functions for CamelCase / Snake_Case Mapping ---
def to_camel(data):
    if isinstance(data, dict):
        new_data = {}
        for k, v in data.items():
            # Handle special cases if any
            if k == "patient_id":
                new_key = "patientId"
            elif k == "record_type":
                new_key = "recordType"
            else:
                new_key = "".join(word.capitalize() if i > 0 else word for i, word in enumerate(k.split("_")))
            new_data[new_key] = to_camel(v)
        return new_data
    elif isinstance(data, list):
        return [to_camel(item) for item in data]
    else:
        return data

# --- Demo Case Study Patient Profile (redefined here to avoid Streamlit import side-effects) ---
DEMO_PATIENT = PatientDigitalTwin(
    patient_id="PT-9942",
    age=58,
    history=[
        HealthRecord(
            date="2024-05-10",
            record_type="Blood Test",
            labs=[
                LabResult(metric="ALT", value=28.0, unit="U/L"),
                LabResult(metric="Creatinine", value=0.9, unit="mg/dL"),
                LabResult(metric="LDL", value=112.0, unit="mg/dL"),
                LabResult(metric="HbA1c", value=5.5, unit="%"),
            ],
            medications=["Simvastatin 20mg"]
        ),
        HealthRecord(
            date="2025-06-15",
            record_type="Blood Test",
            labs=[
                LabResult(metric="ALT", value=46.0, unit="U/L"),
                LabResult(metric="Creatinine", value=1.1, unit="mg/dL"),
                LabResult(metric="LDL", value=128.0, unit="mg/dL"),
                LabResult(metric="HbA1c", value=5.9, unit="%"),
            ],
            medications=["Simvastatin 20mg", "Metformin 500mg"]
        ),
        HealthRecord(
            date="2026-06-25",
            record_type="Blood Test",
            labs=[
                LabResult(metric="ALT", value=72.0, unit="U/L"),
                LabResult(metric="Creatinine", value=1.5, unit="mg/dL"),
                LabResult(metric="LDL", value=155.0, unit="mg/dL"),
                LabResult(metric="HbA1c", value=6.4, unit="%"),
            ],
            medications=["Simvastatin 20mg", "Metformin 500mg", "Lisinopril 10mg"]
        )
    ]
)

# --- Pydantic Request schemas ---
class LabInput(BaseModel):
    metric: str
    value: float
    unit: str

class AddLabsRequest(BaseModel):
    labs: List[LabInput]
    medications: Optional[List[str]] = None

class ChatRequest(BaseModel):
    message: str

# --- Endpoints ---

@app.get("/api/patient")
async def get_patient(session_id: str = Query(..., description="Unique session ID")):
    twin = await get_patient_digital_twin(session_id)
    if not twin:
        # Initialize a new session
        twin = await init_patient_session(session_id, age=45)
    return to_camel(twin.model_dump())

@app.post("/api/patient/load_demo")
async def load_demo_profile(session_id: str = Query(..., description="Unique session ID")):
    DEMO_PATIENT.history.sort(key=lambda x: x.date)
    await update_patient_digital_twin(session_id, DEMO_PATIENT)
    return {"status": "success", "message": "Demo profile loaded"}

@app.post("/api/patient/reset")
async def reset_profile(session_id: str = Query(..., description="Unique session ID")):
    empty_twin = PatientDigitalTwin(age=45, history=[])
    await update_patient_digital_twin(session_id, empty_twin)
    return {"status": "success", "message": "Profile reset completed"}

@app.post("/api/patient/set")
async def set_patient_profile(profile: PatientDigitalTwin, session_id: str = Query(..., description="Unique session ID")):
    profile.history.sort(key=lambda x: x.date)
    await update_patient_digital_twin(session_id, profile)
    return {"status": "success", "message": "Patient profile updated"}

@app.post("/api/labs/add")
async def add_labs(req: AddLabsRequest, session_id: str = Query(..., description="Unique session ID")):
    twin = await get_patient_digital_twin(session_id)
    if not twin:
        twin = await init_patient_session(session_id, age=45)
    
    new_labs = [
        LabResult(metric=lab.metric, value=lab.value, unit=lab.unit)
        for lab in req.labs
    ]
    new_meds = req.medications or []
    
    today_str = datetime.today().strftime('%Y-%m-%d')
    
    # Check if a record already exists for today
    today_record = None
    for record in twin.history:
        if record.date == today_str:
            today_record = record
            break
            
    if today_record:
        # Append new labs
        today_record.labs.extend(new_labs)
        # Append new medications without duplication
        for med in new_meds:
            if med not in today_record.medications:
                today_record.medications.append(med)
    else:
        # Create a new record
        new_record = HealthRecord(
            date=today_str, 
            record_type="Blood Test" if new_labs else "Prescription", 
            labs=new_labs,
            medications=new_meds
        )
        twin.history.append(new_record)
        
    twin.history.sort(key=lambda x: x.date)
    await update_patient_digital_twin(session_id, twin)
    return to_camel(twin.model_dump())

def generate_fallback_agent_response(query: str, twin_data: dict) -> str:
    q = query.lower()
    
    # Extract latest labs
    latest_vals = {}
    for record in sorted(twin_data.get("history", []), key=lambda x: x.get("date", "")):
        for lab in record.get("labs", []):
            latest_vals[lab.get("metric", "").lower()] = {
                "val": lab.get("value"),
                "unit": lab.get("unit"),
                "date": record.get("date")
            }
            
    alt = latest_vals.get("alt")
    ldl = latest_vals.get("ldl") or latest_vals.get("ldl cholesterol")
    creat = latest_vals.get("creatinine")
    hba1c = latest_vals.get("hba1c")
    
    if "pubmed" in q or "research" in q or "guideline" in q:
        return "\n".join([
            "**PubMed Research Agent** — Clinical Guideline Summary (Active Simulation)",
            "",
            "Fatty Liver (NAFLD):",
            "• AASLD 2023 guidance recommends lifestyle modification as first-line; pioglitazone or vitamin E considered in biopsy-confirmed NASH.",
            "",
            "Hypertension:",
            "• ACC/AHA 2017 guideline supports ACE inhibitor (e.g., Lisinopril) as first-line in patients with comorbid diabetes or CKD.",
            "• Target BP < 130/80 mmHg for adults with cardiovascular risk factors.",
            "",
            "Sources: PubMed Central, Mayo Clinic, American College of Cardiology.",
        ])
        
    elif "brief" in q or "doctor" in q or "appointment" in q or "visit" in q or "question" in q:
        ldl_val = f"{ldl['val']}" if ldl else "—"
        creat_val = f"{creat['val']}" if creat else "—"
        hba1c_val = f"{hba1c['val']}" if hba1c else "—"
        
        return "\n".join([
            "**Doctor Preparation Agent** — Suggested Questions (Active Simulation)",
            "",
            "Based on your longitudinal trends, consider asking your primary care provider:",
            "",
            f"1. My LDL has trended from {ldl_val} mg/dL — should we adjust statin dosing or add a PCSK9 inhibitor?",
            f"2. Creatinine is now {creat_val} mg/dL — is this early-stage renal impairment, and should metformin be re-evaluated?",
            f"3. HbA1c is {hba1c_val}% — am I approaching the pre-diabetes/diabetes threshold?",
            "4. Given the combined Simvastatin + Metformin + Lisinopril regimen, what renal and hepatic monitoring cadence do you recommend?",
            "5. Are there lifestyle interventions that could reduce my medication load over the next 6 months?",
        ])
        
    elif "liver" in q or "alt" in q or "ast" in q:
        trend_parts = []
        sorted_history = sorted(twin_data.get("history", []), key=lambda x: x.get("date", ""))
        for r in sorted_history:
            val = next((l for l in r.get("labs", []) if l.get("metric", "").lower() == "alt"), None)
            if val:
                trend_parts.append(f"{r.get('date')}: {val.get('value')} {val.get('unit')}")
        trend = " → ".join(trend_parts)
        
        status = "normal"
        if alt:
            val = alt["val"]
            if val > 55: status = "critical"
            elif val > 40: status = "elevated"
            
        response = [
            "**Liver Health Agent** — Trend Analysis (Active Simulation)",
            "",
            f"ALT trajectory: {trend or 'no data'}",
        ]
        if alt:
            response.append(f"Current ALT: {alt['val']} {alt['unit']} ({status.upper()})")
        else:
            response.append("No ALT values on record.")
            
        response.append("")
        if status == "critical":
            response.append("ALT exceeds the 55 U/L threshold, suggesting possible hepatic stress. Recommend follow-up liver panel, abdominal ultrasound, and review of statin therapy with your provider.")
        elif status == "elevated":
            response.append("ALT is mildly elevated (40–55 U/L). Consider alcohol intake review, weight management, and a repeat panel in 8–12 weeks.")
        else:
            response.append("ALT is within normal range. Continue current monitoring cadence.")
            
        return "\n".join(response)
        
    else:
        alt_str = f"{alt['val']} {alt['unit']} (elevated)" if alt else "—"
        ldl_str = f"{ldl['val']} {ldl['unit']} (elevated)" if ldl else "—"
        creat_str = f"{creat['val']} {creat['unit']} (critical)" if creat else "—"
        hba1c_str = f"{hba1c['val']} {hba1c['unit']} (normal)" if hba1c else "—"
        
        return "\n".join([
            "**Clinical Coordinator Agent** — Summary (Active Simulation)",
            "",
            "I've routed your query across the care team. Current snapshot:",
            f"• ALT: {alt_str}",
            f"• LDL: {ldl_str}",
            f"• Creatinine: {creat_str}",
            f"• HbA1c: {hba1c_str}",
            "",
            "Ask me about liver trends, doctor visit prep, or PubMed research for more detail.",
        ])

@app.post("/api/chat")
async def chat(req: ChatRequest, session_id: str = Query(..., description="Unique session ID")):
    twin = await get_patient_digital_twin(session_id)
    twin_data = twin.model_dump() if twin else {"age": 45, "history": []}
    
    # Compile the background context for the coordinator
    context_str = f"[Background Patient Digital Twin Context]\nAge: {twin_data.get('age')}\nPatient ID: {twin_data.get('patient_id')}\nHistory:\n"
    sorted_history = sorted(twin_data.get("history", []), key=lambda x: x.get("date", ""))
    for rec in sorted_history:
        context_str += f"- Date: {rec.get('date')}, Type: {rec.get('record_type')}\n"
        if rec.get("labs"):
            context_str += "  Labs:\n"
            for l in rec["labs"]:
                context_str += f"    * {l.get('metric')}: {l.get('value')} {l.get('unit')}\n"
        if rec.get("medications"):
            context_str += f"  Medications: {', '.join(rec['medications'])}\n"
            
    payload_message = f"{context_str}\n\n[User Query]\n{req.message}"
    
    try:
        response = await send_message_to_agents(session_id, payload_message)
        return {"response": response}
    except Exception as e:
        # Fall back to simulated agent responses if LLM call fails due to missing credentials
        print(f"DEBUG: FastAPI chat agent failed (likely missing api key): {e}. Falling back to simulation.")
        fallback_res = generate_fallback_agent_response(req.message, twin_data)
        return {"response": fallback_res}

@app.post("/api/meds/scan")
async def scan_meds(session_id: str = Query(..., description="Unique session ID")):
    twin = await get_patient_digital_twin(session_id)
    if not twin:
        return {"status": "clear", "source": "NIH RxNorm", "message": "No active medications found in patient profile."}
        
    active_meds = []
    for record in twin.history:
        for med in record.medications:
            if med not in active_meds:
                active_meds.append(med)
                
    if not active_meds:
        return {"status": "clear", "source": "NIH RxNorm", "message": "No active medications found in patient profile."}
        
    try:
        scan_res = check_drug_interaction(active_meds)
        # convert scan_res dict keys to camelCase for frontend compatibility
        formatted_res = to_camel(scan_res)
        return formatted_res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.server:app", host="127.0.0.1", port=8000, reload=True)
