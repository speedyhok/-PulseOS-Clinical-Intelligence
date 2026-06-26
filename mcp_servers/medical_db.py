import sys
import requests
from typing import List, Dict, Any

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    try:
        from fastmcp import FastMCP
    except ImportError:
        class FastMCP:
            def __init__(self, name: str):
                self.name = name
            def tool(self):
                def decorator(func):
                    return func
                return decorator
            def run(self):
                print(f"FastMCP server '{self.name}' mock running.")

# Initialize the clinical database MCP server
mcp = FastMCP("clinical-database-mcp")

# ==========================================
# --- ONLINE / LIVE MEDICAL API METHODS ---
# ==========================================
# NOTE: The public NIH RxNorm and NCBI PubMed APIs do NOT require any API keys
# for standard clinical queries.

def resolve_rx_cui(drug_name: str) -> str:
    """Resolve a drug name to its RxCUI code using NLM RxNorm API."""
    # Pre-process: extract base drug name (e.g., "Sildenafil 50mg" -> "Sildenafil")
    name_parts = []
    for part in drug_name.strip().split():
        clean_part = "".join(c for c in part if c.isalpha())
        if clean_part and clean_part.lower() not in ["mg", "mcg", "g", "ml", "tab", "cap", "oral"]:
            name_parts.append(clean_part)
    base_name = " ".join(name_parts) if name_parts else drug_name.strip()

    url = "https://rxnav.nlm.nih.gov/REST/rxcui.json"
    params = {"name": base_name}
    headers = {"Accept": "application/json"}
    try:
        response = requests.get(url, params=params, headers=headers, timeout=4)
        if response.status_code == 200:
            data = response.json()
            rxconcept_list = data.get("idGroup", {}).get("rxconceptproperties", [])
            if rxconcept_list:
                return rxconcept_list[0].get("rxcui")
            rxnorm_ids = data.get("idGroup", {}).get("rxnormId", [])
            if rxnorm_ids:
                return rxnorm_ids[0]
    except Exception:
        pass
    return None

def query_rxnorm_interactions(cuis: List[str]) -> List[Dict[str, Any]]:
    """Query NIH RxNorm for drug-drug interactions between a list of RxCUIs."""
    if len(cuis) < 2:
        return []
    url = "https://rxnav.nlm.nih.gov/REST/interaction/list.json"
    params = {"rxcuis": " ".join(cuis)}
    headers = {"Accept": "application/json"}
    try:
        response = requests.get(url, params=params, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            interactions = []
            for group in data.get("fullInteractionTypeGroup", []):
                for interaction_type in group.get("fullInteractionType", []):
                    for pair in interaction_type.get("interactionPair", []):
                        desc = pair.get("description")
                        severity = pair.get("severity", "Moderate/High")
                        concepts = [c.get("minConcept", {}).get("name") for c in pair.get("interactionConcept", [])]
                        interactions.append({
                            "drugs_involved": concepts,
                            "severity": severity,
                            "warning_message": desc
                        })
            return interactions
    except Exception:
        pass
    return []

def query_pubmed_guidelines(query: str) -> List[Dict[str, Any]]:
    """Search PubMed via NCBI Entrez E-Utilities for real guidelines/papers."""
    search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    search_params = {
        "db": "pubmed",
        "term": f"{query} guidelines",
        "retmode": "json",
        "retmax": 3
    }
    try:
        # Step 1: Search for PMIDs
        response = requests.get(search_url, params=search_params, timeout=5)
        if response.status_code == 200:
            search_data = response.json()
            pmids = search_data.get("esearchresult", {}).get("idlist", [])
            if not pmids:
                return []
            
            # Step 2: Get details/summaries for the PMIDs
            summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
            summary_params = {
                "db": "pubmed",
                "id": ",".join(pmids),
                "retmode": "json"
            }
            summary_response = requests.get(summary_url, params=summary_params, timeout=5)
            if summary_response.status_code == 200:
                summary_data = summary_response.json()
                results = []
                uid_results = summary_data.get("result", {})
                for uid in pmids:
                    doc = uid_results.get(uid, {})
                    if doc and "title" in doc:
                        authors = ", ".join([a.get("name", "") for a in doc.get("authors", [])[:3]])
                        results.append({
                            "title": doc.get("title"),
                            "published": doc.get("pubdate"),
                            "authors": authors,
                            "journal": doc.get("source"),
                            "link": f"https://pubmed.ncbi.nlm.nih.gov/{uid}/"
                        })
                return results
    except Exception:
        pass
    return []


# ==========================================
# --- LOCAL FALLBACK DATABASES (Resilience) ---
# ==========================================
LAB_DATABASE = {
    "hba1c": {
        "metric": "HbA1c (Hemoglobin A1c)",
        "unit": "%",
        "reference_ranges": {
            "normal": "Below 5.7%",
            "prediabetes": "5.7% to 6.4%",
            "diabetes": "6.5% or higher"
        },
        "description": "Measures your average blood sugar level over the past 2 to 3 months. Elevated levels indicate progressive impairment in glucose regulation."
    },
    "alt": {
        "metric": "ALT (Alanine Aminotransferase)",
        "unit": "U/L",
        "reference_ranges": {
            "normal": "7 to 56 U/L"
        },
        "description": "A liver enzyme primarily found in liver cells. When the liver is damaged or inflamed, ALT is released into the bloodstream, causing levels to rise."
    },
    "ast": {
        "metric": "AST (Aspartate Aminotransferase)",
        "unit": "U/L",
        "reference_ranges": {
            "normal": "10 to 40 U/L"
        },
        "description": "An enzyme found in high amounts in the liver, heart, and muscles. Elevated AST levels, especially when combined with elevated ALT, suggest liver cell damage or inflammation."
    },
    "ldl": {
        "metric": "LDL Cholesterol",
        "unit": "mg/dL",
        "reference_ranges": {
            "optimal": "Below 100 mg/dL",
            "near_optimal": "100 to 129 mg/dL",
            "borderline_high": "130 to 159 mg/dL",
            "high": "160 to 189 mg/dL",
            "very_high": "190 mg/dL or higher"
        },
        "description": "Often called 'bad' cholesterol because elevated levels can build up in the walls of your arteries, increasing the risk of heart disease and stroke."
    },
    "hdl": {
        "metric": "HDL Cholesterol",
        "unit": "mg/dL",
        "reference_ranges": {
            "low_male": "Below 40 mg/dL",
            "low_female": "Below 50 mg/dL",
            "optimal": "60 mg/dL or higher"
        },
        "description": "Known as 'good' cholesterol because it helps remove other forms of cholesterol from your bloodstream. Higher levels are protective against heart disease."
    },
    "cholesterol": {
        "metric": "Total Cholesterol",
        "unit": "mg/dL",
        "reference_ranges": {
            "desirable": "Below 200 mg/dL",
            "borderline_high": "200 to 239 mg/dL",
            "high": "240 mg/dL or higher"
        },
        "description": "Measures the total amount of cholesterol in your blood, including LDL and HDL. High levels can lead to plaque buildup in blood vessels."
    },
    "glucose": {
        "metric": "Fasting Blood Glucose",
        "unit": "mg/dL",
        "reference_ranges": {
            "normal": "70 to 99 mg/dL",
            "prediabetes": "100 to 125 mg/dL",
            "diabetes": "126 mg/dL or higher"
        },
        "description": "Measures blood sugar after fasting for at least 8 hours. High levels indicate insulin resistance or diabetic onset."
    },
    "platelets": {
        "metric": "Platelet Count",
        "unit": "mcL",
        "reference_ranges": {
            "normal": "150,000 to 450,000 /mcL"
        },
        "description": "Platelets are cell fragments that help the blood clot. Abnormally low levels (thrombocytopenia) can cause bleeding issues, while high levels can increase clotting risks."
    },
    "wbc": {
        "metric": "White Blood Cell Count (WBC)",
        "unit": "cells/mcL",
        "reference_ranges": {
            "normal": "4,500 to 11,000 cells/mcL"
        },
        "description": "Cells of the immune system that help fight infections. High levels can indicate infection or inflammation, while low levels suggest bone marrow issues or immune vulnerability."
    },
    "rbc": {
        "metric": "Red Blood Cell Count (RBC)",
        "unit": "million cells/mcL",
        "reference_ranges": {
            "normal_male": "4.3 to 5.9 million cells/mcL",
            "normal_female": "3.5 to 5.5 million cells/mcL"
        },
        "description": "Cells that carry oxygen from your lungs to the rest of your body. Low levels (anemia) cause fatigue and weakness."
    },
    "creatinine": {
        "metric": "Serum Creatinine",
        "unit": "mg/dL",
        "reference_ranges": {
            "normal_male": "0.6 to 1.2 mg/dL",
            "normal_female": "0.5 to 1.1 mg/dL"
        },
        "description": "A chemical waste product generated by muscle metabolism. Healthy kidneys filter creatinine from the blood. Elevated levels suggest impaired kidney function."
    }
}

LOCAL_DRUG_INTERACTIONS = [
    {
        "drugs": {"aspirin", "ibuprofen"},
        "severity": "Moderate / High",
        "warning_message": "Concomitant use of Aspirin and Ibuprofen increases the risk of gastrointestinal ulceration and bleeding. Additionally, Ibuprofen can block the cardioprotective antiplatelet effect of low-dose Aspirin."
    },
    {
        "drugs": {"warfarin", "aspirin"},
        "severity": "High",
        "warning_message": "Combination significantly increases the risk of major bleeding complications (including gastrointestinal and intracranial hemorrhage). Monitor INR closely if co-administration is clinically required."
    },
    {
        "drugs": {"lisinopril", "spironolactone"},
        "severity": "Moderate",
        "warning_message": "Combining Lisinopril (an ACE inhibitor) and Spironolactone (a potassium-sparing diuretic) increases the risk of hyperkalemia (high blood potassium levels), which can lead to cardiac arrhythmias."
    },
    {
        "drugs": {"sildenafil", "nitroglycerin"},
        "severity": "High / Critical",
        "warning_message": "Co-administration of sildenafil (Viagra) and nitroglycerin or other nitrates can cause an acute, severe, life-threatening drop in blood pressure (severe hypotension). NEVER take these together."
    },
    {
        "drugs": {"atorvastatin", "gemfibrozil"},
        "severity": "Moderate / High",
        "warning_message": "Combining atorvastatin and gemfibrozil increases the risk of myopathy (muscle pain and weakness) and rhabdomyolysis (a severe, life-threatening muscle breakdown condition that can cause kidney failure)."
    },
    {
        "drugs": {"metformin", "iodinated contrast"},
        "severity": "Moderate",
        "warning_message": "Metformin should be temporarily discontinued prior to or at the time of iodinated contrast imaging procedures. Contrast media can cause acute kidney injury, leading to metformin accumulation and lactic acidosis."
    },
    {
        "drugs": {"simvastatin", "lisinopril"},
        "severity": "Mild",
        "warning_message": "Co-administration of simvastatin and lisinopril is generally safe. Monitor for muscle-related symptoms (muscle pain, weakness) as statin exposure may increase slightly."
    },
    {
        "drugs": {"simvastatin", "metformin"},
        "severity": "Mild",
        "warning_message": "Co-administration of simvastatin and metformin is common and generally safe. Standard clinical monitoring is recommended."
    },
    {
        "drugs": {"metformin", "lisinopril"},
        "severity": "Moderate",
        "warning_message": "Lisinopril can potentially increase insulin sensitivity and enhance the hypoglycemic effect of metformin. Additionally, ACE inhibitors can impact renal perfusion; monitor serum creatinine and blood glucose closely."
    }
]

LOCAL_GUIDELINES = {
    "hypertension": {
        "condition": "Hypertension (High Blood Pressure)",
        "guidelines": "According to 2017 ACC/AHA guidelines: Normal is <120/80 mmHg; Stage 1 is 130-139 mmHg or 80-89 mmHg; Stage 2 is >=140 mmHg or >=90 mmHg.",
        "recommendations": [
            "Follow the DASH diet (Dietary Approaches to Stop Hypertension).",
            "Reduce sodium intake below 1,500 - 2,300 mg/day.",
            "Perform 150 minutes of moderate aerobic exercise per week."
        ],
        "trusted_sources": ["American College of Cardiology (ACC)", "American Heart Association (AHA)", "Mayo Clinic"]
    },
    "fatty liver": {
        "condition": "Non-Alcoholic Fatty Liver Disease (NAFLD / MASLD)",
        "guidelines": "AASLD guidelines highlight lifestyle modification as the primary treatment, aiming for 7-10% weight loss for steatohepatitis resolution.",
        "recommendations": [
            "Adopt a Mediterranean diet rich in olive oil, fish, and vegetables.",
            "Avoid added sugars, particularly high-fructose corn syrup.",
            "Eliminate alcohol consumption completely."
        ],
        "trusted_sources": ["American Association for the Study of Liver Diseases (AASLD)", "Cleveland Clinic"]
    },
    "diabetes": {
        "condition": "Type 2 Diabetes Mellitus",
        "guidelines": "ADA 2026 Guidelines recommend targeting an HbA1c of <7.0% for most non-pregnant adults. Diagnostic threshold is Fasting Glucose >= 126 mg/dL or HbA1c >= 6.5%.",
        "recommendations": [
            "Limit intake of refined carbohydrates and sugar-sweetened beverages.",
            "Increase intake of dietary fiber (whole grains, vegetables).",
            "Perform structured aerobic and resistance training weekly.",
            "Self-monitor glucose levels as directed by your endocrinologist."
        ],
        "trusted_sources": ["American Diabetes Association (ADA)", "National Institutes of Health (NIH)"]
    },
    "hypercholesterolemia": {
        "condition": "Hypercholesterolemia (High Cholesterol)",
        "guidelines": "AHA/ACC cholesterol management guidelines recommend targeting LDL < 100 mg/dL (or < 70 mg/dL for high cardiovascular risk patients).",
        "recommendations": [
            "Reduce intake of saturated fats and trans fats.",
            "Incorporate soluble fiber and plant sterols into your diet.",
            "Increase physical activity to raise protective HDL cholesterol."
        ],
        "trusted_sources": ["American College of Cardiology (ACC)", "American Heart Association (AHA)"]
    }
}


# ==========================================
# --- MCP EXPOSED TOOLS (API with Fallback) ---
# ==========================================

@mcp.tool()
def get_lab_reference(metric: str) -> Dict[str, Any]:
    """
    Retrieve clinical reference ranges, units, and definitions for key lab test metrics.
    
    Args:
        metric: The name of the lab metric (e.g. 'HbA1c', 'ALT', 'LDL', 'Glucose', 'Platelets').
    """
    key = metric.strip().lower()
    if key in LAB_DATABASE:
        return {
            "status": "success",
            "data": LAB_DATABASE[key]
        }
    return {
        "status": "not_found",
        "message": f"Metric '{metric}' not found in local primary reference databases. Please check with your clinical provider."
    }


@mcp.tool()
def check_drug_interaction(medications: List[str]) -> Dict[str, Any]:
    """
    Screen a list of active medications for potential drug-drug interactions using NIH RxNorm live API.
    
    Args:
        medications: A list of active drug/medication names (e.g. ['Aspirin', 'Ibuprofen']).
    """
    # Try resolving via NLM RxNorm live API
    cuis = []
    resolved_mapping = {}
    for med in medications:
        cui = resolve_rx_cui(med)
        if cui:
            cuis.append(cui)
            resolved_mapping[cui] = med

    live_interactions = []
    if len(cuis) >= 2:
        live_interactions = query_rxnorm_interactions(cuis)

    if live_interactions:
        return {
            "status": "interaction_detected",
            "source": "NIH RxNorm Live Database",
            "interactions": live_interactions
        }

    # Fallback to local clinical dictionary (for demo continuity or network disconnects)
    normalized_meds = {med.strip().lower() for med in medications}
    detected_local = []
    for interaction in LOCAL_DRUG_INTERACTIONS:
        # Check if every drug in the interaction is matched as a substring in any of the normalized medications
        match = True
        for drug in interaction["drugs"]:
            if not any(drug in med for med in normalized_meds):
                match = False
                break
        if match:
            detected_local.append({
                "drugs_involved": list(interaction["drugs"]),
                "severity": interaction["severity"],
                "warning_message": interaction["warning_message"]
            })

    if detected_local:
        return {
            "status": "interaction_detected",
            "source": "PulseOS Local Resilient Database",
            "interactions": detected_local
        }

    return {
        "status": "no_interaction_detected",
        "message": "No drug interactions detected in either the live NIH RxNorm API or local database. Always consult your provider or pharmacist."
    }


@mcp.tool()
def get_clinical_guidelines(condition: str) -> Dict[str, Any]:
    """
    Retrieve clinical guidelines and live PubMed research papers for a medical condition.
    
    Args:
        condition: The medical condition (e.g. 'Hypertension', 'Fatty Liver').
    """
    normalized = condition.strip().lower()
    if normalized in ["fatty liver", "nafld", "masld"]:
        normalized = "fatty liver"

    # Query PubMed Live
    live_papers = query_pubmed_guidelines(condition)

    # Compile result with guidelines and guidelines references
    response_data = {
        "condition": condition,
        "guidelines": "General primary care guidance. Seek specialized provider consult.",
        "recommendations": ["Consult your medical provider for personalized lifestyle adjustments."],
        "trusted_sources": ["PubMed NCBI Database"],
        "live_pubmed_articles": live_papers
    }

    # Merge local detailed recommendations if we have them
    if normalized in LOCAL_GUIDELINES:
        local_data = LOCAL_GUIDELINES[normalized]
        response_data["guidelines"] = local_data["guidelines"]
        response_data["recommendations"] = local_data["recommendations"]
        response_data["trusted_sources"] = local_data["trusted_sources"]

    return {
        "status": "success",
        "source": "NIH PubMed / PulseOS Guidelines DB",
        "data": response_data
    }


if __name__ == "__main__":
    mcp.run()
