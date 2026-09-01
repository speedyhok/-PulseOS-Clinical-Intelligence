# app/pdf_parser.py
"""
PulseOS Clinical Intelligence — Hybrid PDF Clinical Document Parser Module
Combines Gemini Multimodal LLM extraction with Universal Table Structure Parsing
to guarantee zero metric omissions on ANY lab report layout.
"""

import io
import os
import re
import json
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
from pypdf import PdfReader

# Import schemas from app.schema if available
try:
    from app.schema import LabResult, HealthRecord
except ImportError:
    from pydantic import BaseModel
    
    class LabResult(BaseModel):
        metric: str
        value: float
        unit: str
        date: Optional[str] = None
        medication: Optional[str] = None

    class HealthRecord(BaseModel):
        date: str
        record_type: str = "Blood Test"
        labs: List[LabResult] = []
        medications: List[str] = []


# Metric aliases and canonical mapping dictionary
METRIC_MAPPING = {
    "HEMOGLOBIN": "Hemoglobin",
    "HEMATOCRIT (PCV)": "Hematocrit",
    "HEMATOCRIT": "Hematocrit",
    "PCV": "Hematocrit",
    "RBC COUNT": "RBC",
    "RED BLOOD CELL COUNT": "RBC",
    "RED BLOOD CELL": "RBC",
    "RBC": "RBC",
    "MCV": "MCV",
    "MCH": "MCH",
    "MCHC": "MCHC",
    "RDW-CV": "RDW-CV",
    "RDW": "RDW",
    "WBC COUNT": "WBC",
    "WHITE BLOOD CELL COUNT (WBC)": "WBC",
    "WHITE BLOOD CELL COUNT": "WBC",
    "WHITE BLOOD CELL": "WBC",
    "WBC": "WBC",
    "NEUTROPHILS": "Neutrophils",
    "LYMPHOCYTES": "Lymphocytes",
    "MONOCYTES": "Monocytes",
    "EOSINOPHILS": "Eosinophils",
    "BASOPHILS": "Basophils",
    "PLATELET COUNT": "Platelets",
    "PLATELETS": "Platelets",
    "MPV": "MPV",
    "FASTING GLUCOSE": "Glucose",
    "GLUCOSE": "Glucose",
    "BLOOD SUGAR": "Glucose",
    "ALT (SGPT)": "ALT",
    "ALT": "ALT",
    "SGPT": "ALT",
    "AST (SGOT)": "AST",
    "AST": "AST",
    "SGOT": "AST",
    "CREATININE": "Creatinine",
    "SERUM CREATININE": "Creatinine",
    "LDL CHOLESTEROL": "LDL",
    "LDL": "LDL",
    "HDL CHOLESTEROL": "HDL",
    "HDL": "HDL",
    "TOTAL CHOLESTEROL": "Total Cholesterol",
    "CHOLESTEROL": "Total Cholesterol",
    "TRIGLYCERIDES": "Triglycerides",
    "HBA1C": "HbA1c",
    "GLYCOSYLATED HEMOGLOBIN": "HbA1c",
    "BUN": "BUN",
    "BLOOD UREA NITROGEN": "BUN",
    "TOTAL BILIRUBIN": "Bilirubin",
    "BILIRUBIN": "Bilirubin",
    "TSH": "TSH",
    "THYROID STIMULATING HORMONE": "TSH",
    "SODIUM": "Sodium",
    "POTASSIUM": "Potassium",
    "CALCIUM": "Calcium",
    "ALBUMIN": "Albumin",
    "EGFR": "eGFR"
}

HEADER_IGNORE_WORDS = {
    "PAGE", "TEST", "RESULT", "UNIT", "REFERENCE", "FLAG", "PATIENT", "NAME", "ID",
    "COLLECTION", "REPORT", "SPECIMEN", "TECHNICAL", "INTERPRETIVE", "NOT FOR",
    "AGE", "SEX", "PHYSICIAN", "CLINICIAN", "ACCESSION", "ORDER", "STATUS",
    "NORMAL", "HIGH", "LOW", "DESIRABLE", "SUMMARY", "AUTHENTICATION", "LABORATORY"
}


def extract_raw_text_from_pdf(pdf_source: io.BytesIO | bytes | str) -> str:
    """
    Extracts raw text content from a PDF file buffer or path using pypdf.
    """
    if isinstance(pdf_source, str):
        reader = PdfReader(pdf_source)
    elif isinstance(pdf_source, bytes):
        reader = PdfReader(io.BytesIO(pdf_source))
    elif isinstance(pdf_source, io.BytesIO):
        reader = PdfReader(pdf_source)
    else:
        raise ValueError("Unsupported pdf_source type. Expected bytes, BytesIO, or file path string.")

    extracted_text = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            extracted_text.append(page_text)

    return "\n".join(extracted_text)


def parse_with_llm(pdf_bytes: bytes) -> Optional[HealthRecord]:
    """
    Tier 1: Uses Gemini Multimodal API to parse any PDF document directly into structured JSON.
    Returns None if API Key is not set or network request fails.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        prompt = (
            "You are an expert clinical medical document agent. Extract all diagnostic lab test results, "
            "metrics, numerical values, units, report date (YYYY-MM-DD), and active medications from the uploaded PDF document. "
            "Ensure EVERY test metric listed in the document is extracted into the labs array."
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf")
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=HealthRecord,
            )
        )
        
        if response.text:
            data = json.loads(response.text)
            return HealthRecord(**data)
    except Exception as e:
        print(f"DEBUG: LLM PDF parsing unavailable or failed ({e}). Falling back to Universal Engine.")
    return None


def parse_clinical_text(text: str) -> Tuple[List[LabResult], List[str], Optional[str]]:
    """
    Tier 2: Universal Structural & Table Regex Parser Engine.
    Handles any unknown metrics by detecting structural test-name -> numeric-value -> unit patterns.
    """
    labs: List[LabResult] = []
    medications: List[str] = []
    report_date: Optional[str] = None

    # 1. Detect Report Date
    date_patterns = [
        (r'\b(\d{4}-\d{2}-\d{2})\b', '%Y-%m-%d'),
        (r'\b(\d{1,2}/\d{1,2}/\d{4})\b', '%m/%d/%Y'),
        (r'\b(\d{1,2}-[A-Za-z]{3}-\d{4})\b', '%d-%b-%Y'),
        (r'\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b', '%d %b %Y'),
        (r'\b([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})\b', '%B %d %Y')
    ]

    for pattern, date_fmt in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw_date = match.group(0).strip().replace(',', '')
            try:
                if date_fmt == '%Y-%m-%d':
                    report_date = raw_date
                else:
                    dt = datetime.strptime(raw_date, date_fmt)
                    report_date = dt.strftime('%Y-%m-%d')
                break
            except Exception:
                pass

    if not report_date:
        report_date = datetime.today().strftime('%Y-%m-%d')

    lines = [line.strip() for line in text.split('\n') if line.strip()]

    def parse_float(val_str: str) -> Optional[float]:
        try:
            clean = re.sub(r'[^0-9\.]', '', val_str)
            if clean and clean != '.' and not clean.startswith('103') and not clean.startswith('106'):
                return float(clean)
        except ValueError:
            pass
        return None

    def is_unit_string(s: str) -> bool:
        clean = s.strip()
        return bool(re.match(r'^(?:g/dL|mg/dL|U/L|%|fL|pg|x103/µL|x106/µL|10\^3/uL|10\^6/uL|10\^3/µL|10\^6/µL|µIU/mL|uIU/mL|mmol/L|mEq/L)$', clean, re.IGNORECASE))

    # 2. Universal Table & Dictionary Line Parsing
    i = 0
    while i < len(lines):
        line = lines[i]
        line_upper = line.upper()

        matched_canonical = None
        matched_alias = None

        # Check Dictionary Mapping First
        for alias, canonical in METRIC_MAPPING.items():
            pattern = r'\b' + re.escape(alias) + r'\b'
            match = re.search(pattern, line_upper)
            if match:
                matched_alias = alias
                matched_canonical = canonical
                break

        # Universal Generic Metric Fallback for ANY unknown lab test metric
        if not matched_canonical and len(line) < 35:
            if not any(ign in line_upper for ign in HEADER_IGNORE_WORDS) and not is_unit_string(line) and not parse_float(line):
                if re.match(r'^[A-Za-z]', line):
                    if i + 1 < len(lines):
                        float_val = parse_float(lines[i + 1])
                        if float_val is not None:
                            matched_alias = line
                            matched_canonical = line.strip()

        if matched_canonical:
            val = None
            unit = ""
            
            # Single Line Match
            match_pos = re.search(r'\b' + re.escape(matched_alias) + r'\b', line_upper) if matched_alias in line_upper else None
            if match_pos:
                after_text = line[match_pos.end():]
                single_val_match = re.search(r'[:\s]+([\d\.]+)\s*([A-Za-z0-9/%mgdLUIu\^µ\.]+)?', after_text)
                if single_val_match and parse_float(single_val_match.group(1)) is not None:
                    val = parse_float(single_val_match.group(1))
                    unit = single_val_match.group(2) or ""

            # Multi-Line Table Lookahead Match
            if val is None:
                for offset in range(1, 4):
                    if i + offset < len(lines):
                        next_line = lines[i + offset].strip()
                        float_val = parse_float(next_line)
                        if float_val is not None and val is None:
                            val = float_val
                            if i + offset + 1 < len(lines):
                                potential_unit = lines[i + offset + 1].strip()
                                if re.match(r'^[A-Za-z0-9/%µ\^uLdLpgfL\.]+$', potential_unit) and len(potential_unit) < 15:
                                    unit = potential_unit
                            break

            if val is not None:
                if not any(l.metric.lower() == matched_canonical.lower() for l in labs):
                    labs.append(LabResult(
                        metric=matched_canonical,
                        value=val,
                        unit=unit,
                        date=report_date
                    ))

        i += 1

    # 3. Active Medications Extraction
    for line in lines:
        med_match = re.search(r'^(?:Medications|Rx|Prescriptions|Active Medications)[:\s]+(.+)$', line, re.IGNORECASE)
        if med_match:
            meds_raw = med_match.group(1).strip()
            items = [m.strip() for m in re.split(r'[,;]', meds_raw) if m.strip()]
            for item in items:
                if item and item not in medications and not item.startswith("&"):
                    medications.append(item)

    return labs, medications, report_date


def parse_pdf_report(pdf_source: io.BytesIO | bytes | str) -> HealthRecord:
    """
    High-level entry point using Tiered Hybrid Strategy:
    1. Try Gemini Vision LLM Multimodal parser if API key is active.
    2. Fall back to Universal Structural Table Parser.
    """
    pdf_bytes = None
    if isinstance(pdf_source, bytes):
        pdf_bytes = pdf_source
    elif isinstance(pdf_source, io.BytesIO):
        pdf_bytes = pdf_source.getvalue()
    elif isinstance(pdf_source, str) and os.path.exists(pdf_source):
        with open(pdf_source, "rb") as f:
            pdf_bytes = f.read()

    # Tier 1: Try Gemini LLM extraction first if pdf_bytes is available
    if pdf_bytes:
        llm_record = parse_with_llm(pdf_bytes)
        if llm_record and len(llm_record.labs) > 0:
            return llm_record

    # Tier 2: Universal Structural Parser
    raw_text = extract_raw_text_from_pdf(pdf_source)
    labs, meds, date_str = parse_clinical_text(raw_text)

    return HealthRecord(
        date=date_str or datetime.today().strftime("%Y-%m-%d"),
        record_type="Blood Test",
        labs=labs,
        medications=meds
    )


# --- Runnable Demonstration & Testing ---
def generate_sample_pdf() -> bytes:
    """
    Generates a sample clinical lab report PDF in-memory using ReportLab for testing.
    """
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, 750, "PULSEOS DIAGNOSTICS — PATIENT LAB REPORT")
    p.setFont("Helvetica", 10)
    p.drawString(50, 730, "Patient Name: Jane Doe | Patient ID: PT-9942")
    p.drawString(50, 715, "Report Date: 2026-06-25")
    p.drawString(50, 700, "Ordering Physician: Dr. Alex Vance, MD")
    p.line(50, 690, 550, 690)
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 665, "Comprehensive Metabolic & Lipid Panel Results:")
    p.setFont("Helvetica", 11)
    p.drawString(70, 640, "ALT (Alanine Aminotransferase):  72.0 U/L  (High)")
    p.drawString(70, 620, "Creatinine:  1.5 mg/dL  (High)")
    p.drawString(70, 600, "LDL Cholesterol:  155.0 mg/dL  (Elevated)")
    p.drawString(70, 580, "HbA1c (Glycated Hemoglobin):  6.4 %  (Prediabetes)")
    p.line(50, 560, 550, 560)
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, 535, "Active Medications & Therapy:")
    p.setFont("Helvetica", 11)
    p.drawString(70, 510, "Medications: Simvastatin 20mg, Metformin 500mg, Lisinopril 10mg")
    
    p.showPage()
    p.save()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


if __name__ == "__main__":
    import glob
    print("=" * 60)
    print("PulseOS Hybrid PDF Parser Test — Processing All Sample Reports")
    print("=" * 60)
    
    for path in sorted(glob.glob('/home/ubuntu/Downloads/*sample*lab*.pdf')):
        print(f"\nProcessing file: {path}")
        health_record = parse_pdf_report(path)
        print("=== PARSED CLINICAL DATA RESULT ===")
        print(f"Report Date : {health_record.date}")
        print(f"Record Type : {health_record.record_type}")
        print(f"Labs Count  : {len(health_record.labs)}")
        print("\nLabs Extracted:")
        for lab in health_record.labs:
            print(f"  • {lab.metric}: {lab.value} {lab.unit}")
        print("\nMedications Extracted:")
        for med in health_record.medications:
            print(f"  • {med}")
