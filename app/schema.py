from pydantic import BaseModel, Field
from typing import List, Optional

class LabResult(BaseModel):
    metric: str           # e.g., "HbA1c", "ALT"
    value: float          # e.g., 6.4
    unit: str             # e.g., "%", "U/L"

class HealthRecord(BaseModel):
    date: str             # e.g., "2025-06-25"
    record_type: str      # e.g., "Blood Test", "Prescription"
    labs: List[LabResult] = []
    medications: List[str] = []

class PatientDigitalTwin(BaseModel):
    patient_id: str = "PT-9942"
    age: int
    history: List[HealthRecord] = []
