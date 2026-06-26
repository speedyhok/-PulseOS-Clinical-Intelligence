# PulseOS: Your Personal Medical Intelligence & Care Coordination System

**Track:** Agents for Good

---

## The Core Problem

Patients face three major pain points in navigating their healthcare journey:
1. **Medical Jargon**: Diagnostic reports are highly complex and difficult for a layperson to interpret.
2. **Fragmentation**: Essential medical information is scattered across isolated files, including lab reports, prescriptions, scans, and handwritten clinical notes.
3. **No Clear Next Steps**: Patients often do not know what questions to ask their providers, or what tests and follow-ups are needed next.

> [!NOTE]
> The goal of PulseOS is **not** to diagnose patients. 
> The goal is to assist in **healthcare navigation and understanding** to empower patients.

---

## Multi-Agent Architecture

PulseOS coordinates **7 specialized agents** to manage patient health data:

### 1. Medical Document Agent
* **Input**: Blood tests, prescriptions, discharge summaries, MRI reports, CT scans, and doctor/clinical notes.
* **Responsibilities**: Optical Character Recognition (OCR), clinical entity extraction, and metric standardization.
* **Output**: Standardized Patient Digital Twin JSON record.

### 2. Medical Knowledge Agent
* **Responsibility**: Demystifies complex medical terminology and findings.
* **Example**: Converts `"Elevated ALT"` into:
  > *"ALT is a liver enzyme. Elevated levels can indicate liver inflammation. Discuss with your doctor."*

### 3. Longitudinal Health Agent
* **Responsibility**: Tracks health metrics over time. Instead of looking at a single report in isolation, it analyzes trends across historical reports.
* **Example**:
  * **2024**: `HbA1c = 5.9%`
  * **2025**: `HbA1c = 6.4%`
  * **2026**: `HbA1c = 7.1%`
  * **Output**: *"Blood sugar control has progressively worsened."*

### 4. Medication Intelligence Agent
* **Responsibility**: Tracks schedules, screens for therapeutic duplicates, detects missed dosages, and flags drug-drug interactions.
* **Example**:
  * **Input**: `Aspirin + Ibuprofen`
  * **Output**: *"Potential interaction detected (increased risk of gastrointestinal bleeding)."*

### 5. Doctor Preparation Agent
* **Responsibility**: Generates custom clinical questions to help patients prepare for upcoming specialist appointments.
* **Example**:
  * **Input**: *"Seeing cardiologist tomorrow."*
  * **Output**:
    * *"Why is my LDL cholesterol increasing?"*
    * *"Should my cardiovascular medication dosage change?"*
    * *"Are additional diagnostic tests needed?"*

### 6. Follow-Up Agent
* **Responsibility**: Generates recommendations for next clinical tests, timelines, and alert reminders after processing new reports.
* **Output**: Follow-up timelines, next lab targets to discuss with PCP, and automated scheduling reminders.

### 7. Medical Research Agent
* **Responsibility**: Clinical research assistant (grounded referencing only, no direct diagnosis).
* **Example**:
  * **Input**: Report mentioning `Hypertension` and `Fatty liver`.
  * **Output**: Latest guidelines, evidence-based lifestyle/dietary recommendations, and links to trusted medical sources (e.g. ACC/AHA, Mayo Clinic).

---

## Secret Weapon: Patient Digital Twin & Health Journey Timeline

Most generic solutions stop at generating a basic summary for a single PDF. PulseOS builds a dynamic **Patient Digital Twin** timeline that aggregates:
* Age / Demographics
* Historical Reports & Labs
* Medications
* Symptoms
* Clinical Visits

### Health Journey Timeline Example:
* **2024**: Normal glucose levels
* **2025**: Prediabetes markers detected
* **2026**: Elevated HbA1c (Type 2 Diabetes progression)

This creates a clear visual progression of the patient's health trajectory.

---

## Kaggle Requirement Mapping

| Requirement | PulseOS Implementation |
| :--- | :--- |
| **Multi-Agent** | 7 specialized clinical and coordinate agents |
| **ADK** | Advanced Agent Development Kit orchestrating agent communications |
| **MCP** | Model Context Protocol servers to securely query clinical databases/reference tools |
| **Security** | PII (Personally Identifiable Information) masking and data isolation |
| **Deployability** | Responsive Streamlit frontend app |
| **Agent Skills** | Medical document OCR parsing, longitudinal trends analysis, and grounded RAG retrieval |

---

## Demo Flow (5 Minutes)

1. **Scene 1**: User uploads a CBC (Complete Blood Count) report. PulseOS parses it and explains findings in patient-friendly terms.
2. **Scene 2**: User uploads a second historical lab report. PulseOS immediately detects and alerts the user to progressive trends over time.
3. **Scene 3**: User uploads a new prescription. The Medication Agent flags any potential interactions with existing therapies.
4. **Scene 4**: User requests a checklist to prepare for an upcoming specialist visit. PulseOS generates a custom doctor-preparation brief.
5. **Scene 5**: PulseOS displays the complete Health Journey Dashboard featuring the interactive Patient Digital Twin timeline.
