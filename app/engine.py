# Author: Mohibul Hoque
# Email: hokworks@gmail.com
# LinkedIn: linkedin.com/in/speedymohibul
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from typing import List
from google.adk.agents import Agent
from google.genai import types as genai_types

# Import the core data models
from app.schema import PatientDigitalTwin, HealthRecord, LabResult

# Import tools from the MCP server
from mcp_servers.medical_db import (
    get_lab_reference,
    check_drug_interaction,
    get_clinical_guidelines
)

# ==========================================
# --- 1. SPECIALIST CLINICAL AGENTS ---
# ==========================================

medical_document_agent = Agent(
    name="medical_document_agent",
    model="gemini-flash-lite-latest",
    description="Parses unstructured medical reports (blood tests, notes, prescriptions) into structured digital records.",
    instruction="""
    You are the Medical Document Agent. Your job is to extract clinical information from unstructured patient documents (e.g. PDFs, notes, scans, blood tests).
    Extract the following details:
    - Date of the record (e.g., '2025-06-25')
    - Record type (e.g., 'Blood Test', 'Prescription', 'Discharge Summary')
    - Labs (a list containing metric name, value, and unit)
    - Medications (a list of active medication names)

    If you are unsure of lab names or need to verify units, use the `get_lab_reference` tool to check metric properties.
    Return a structured summary of the extracted clinical records.
    """,
    tools=[get_lab_reference]
)

medical_knowledge_agent = Agent(
    name="medical_knowledge_agent",
    model="gemini-flash-lite-latest",
    description="Translates complex clinical terminology and lab results into clear, patient-friendly explanations.",
    instruction="""
    You are the Medical Knowledge Agent. Your job is to take complex clinical jargon, lab test names, or elevated/low metric findings (e.g., 'Elevated ALT') and explain them in clear, supportive, layperson-understandable terms.
    Always translate technical abbreviations and provide actionable explanations. You can use the `get_lab_reference` tool to lookup normal reference ranges, units, and descriptions for lab tests.
    """,
    tools=[get_lab_reference]
)

longitudinal_health_agent = Agent(
    name="longitudinal_health_agent",
    model="gemini-flash-lite-latest",
    description="Analyzes the patient's historical lab records and identifies progressive trends over months or years.",
    instruction="""
    You are the Longitudinal Health Agent. Your job is to track clinical metrics over time. Instead of looking at a single report in isolation, you must review the patient's complete history of health records.
    
    IMPORTANT: Always parse the dates of all records. Sort the patient history chronologically by date (from oldest date to newest date) before performing any comparison or trend analysis. Compare the oldest values to the newest values to determine the progression (e.g., whether a value is improving, stable, or worsening). Do not rely on the order in which records are listed or uploaded.
    
    Identify progressive trends (e.g., progressive worsening of blood sugar control or increasing cholesterol over multiple years) and present a structured summary of the patient's health trajectory.
    """
)

medication_intelligence_agent = Agent(
    name="medication_intelligence_agent",
    model="gemini-flash-lite-latest",
    description="Screens the patient's medication list for safety, duplicate therapies, and drug-drug interactions.",
    instruction="""
    You are the Medication Intelligence Agent. Your job is to analyze the patient's medication list for safety and compliance.
    Check for:
    - Drug-drug interactions (use the `check_drug_interaction` tool).
    - Therapeutic duplicates.
    - Missing dosages or scheduling safety concerns.
    Report any warning flags clearly to the patient.
    """,
    tools=[check_drug_interaction]
)

doctor_preparation_agent = Agent(
    name="doctor_preparation_agent",
    model="gemini-flash-lite-latest",
    description="Prepares a personalized brief with clinical questions for the patient's upcoming doctor visit.",
    instruction="""
    You are the Doctor Preparation Agent. Your job is to prepare the patient before their clinical appointments, helping them have highly valuable discussions with their healthcare providers.
    Generate a list of clinical questions targeted to the type of specialist they are seeing (e.g., seeing a cardiologist) and relevant to their historical laboratory trends (e.g., increasing LDL cholesterol).
    """
)

follow_up_agent = Agent(
    name="follow_up_agent",
    model="gemini-flash-lite-latest",
    description="Generates recommended follow-up schedules, timelines, and checklist of next tests.",
    instruction="""
    You are the Follow-Up Agent. Your job is to coordinate subsequent steps after new clinical findings are processed.
    Provide:
    - A recommended timeline for follow-up checks.
    - A checklist of next diagnostic tests to discuss with their primary care provider.
    - Actionable reminder prompts.
    """
)

medical_research_agent = Agent(
    name="medical_research_agent",
    model="gemini-flash-lite-latest",
    description="Gathers clinical guidelines and live PubMed research papers for specific medical conditions.",
    instruction="""
    You are the Medical Research Agent. You act as an advanced biomedical research assistant.
    Use the `get_clinical_guidelines` tool to lookup evidence-based clinical guidelines, diet/lifestyle recommendations, and live PubMed articles for patient conditions (e.g., Hypertension, Fatty Liver).
    Note: Do not diagnose. Frame your response as educational reference materials.
    """,
    tools=[get_clinical_guidelines]
)

# ==========================================
# --- 2. CENTRAL COORDINATOR AGENT ---
# ==========================================

pulseos_coordinator = Agent(
    name="pulseos_coordinator",
    model="gemini-flash-lite-latest",
    description="Central coordination agent that routes user queries to the appropriate clinical specialist agent.",
    instruction="""
    You are the PulseOS Coordinator, a multi-agent clinical decision support and patient engagement manager.
    Your job is to act as the primary interface for patients. When a user asks a question, uploads a report, or requests help:
    - Delegate the query to the correct specialized sub-agent (e.g., Document Agent for parsing, Knowledge Agent for explaining lab metrics, Medication Agent for interactions, etc.).
    - You have access to a suite of 7 specialist sub-agents.
    - Guide the user smoothly through their health journey dashboard.
    """,
    sub_agents=[
        medical_document_agent,
        medical_knowledge_agent,
        longitudinal_health_agent,
        medication_intelligence_agent,
        doctor_preparation_agent,
        follow_up_agent,
        medical_research_agent
    ]
)
