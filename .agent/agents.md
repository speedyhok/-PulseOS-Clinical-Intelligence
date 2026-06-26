# PulseOS Multi-Agent Architecture

PulseOS is built on a highly modular, multi-agent clinical decision support and patient engagement architecture. Each agent has dedicated responsibilities, inputs, outputs, and clinical tasks.

---

## Agent Overview

```mermaid
graph TD
    A[Patient Data / Documents] --> Ag1[1. Medical Document Agent]
    Ag1 -->|Structured Patient Record| DB[(Digital Twin DB)]
    
    DB --> Ag2[2. Medical Knowledge Agent]
    DB --> Ag3[3. Longitudinal Health Agent]
    DB --> Ag4[4. Medication Intelligence Agent]
    DB --> Ag5[5. Doctor Preparation Agent]
    DB --> Ag6[6. Follow-Up Agent]
    DB --> Ag7[7. Medical Research Agent]

    style Ag1 fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    style Ag2 fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    style Ag3 fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style Ag4 fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style Ag5 fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style Ag6 fill:#efebe9,stroke:#5d4037,stroke-width:2px
    style Ag7 fill:#e0f2f1,stroke:#00796b,stroke-width:2px
```

---

## 1. Medical Document Agent
Converts unstructured clinical artifacts into a standardized digital twin format.

* **Input:**
  * Blood tests (lab results)
  * Prescriptions
  * Discharge summaries
  * MRI reports & CT scans
  * Doctor/clinical notes
* **Responsibilities:**
  * Optical Character Recognition (OCR) on scans and images
  * Information extraction (extracting entities, values, dates)
  * Standardization of clinical metrics and terminology
* **Output:**
  * Structured Patient Record (JSON digital twin)

---

## 2. Medical Knowledge Agent
Demystifies complex medical terms, lab names, and clinical findings into clear, patient-friendly definitions and actions.

* **Responsibility:**
  * Translates jargon into clear, layperson-understandable terms.
* **Example:**
  * **Input:** `"Elevated ALT"`
  * **Output:** `"ALT is a liver enzyme. Elevated levels can indicate liver inflammation. Discuss with your doctor."`

---

## 3. Longitudinal Health Agent
Tracks clinical metrics over time to identify progressive trends and worsening/improving statuses.

* **Responsibility:**
  * Unlike standard systems that evaluate only the most recent report, this agent contextualizes results over months or years.
* **Example:**
  * **Input History:**
    * `2024: HbA1c = 5.9`
    * `2025: HbA1c = 6.4`
    * `2026: HbA1c = 7.1`
  * **Output:**
    * `"Blood sugar control has progressively worsened."` (Indicating pre-diabetic to diabetic progression).

---

## 4. Medication Intelligence Agent
Maintains patient safety and compliance by analyzing drug schedules and interactions.

* **Responsibility:**
  * Tracks medication schedule adherence.
  * Checks for adverse drug-drug interactions.
  * Screens for therapeutic duplicates and missed dosages.
* **Example:**
  * **Input:** `Aspirin + Ibuprofen`
  * **Output:** `"Potential interaction detected (increased risk of gastrointestinal bleeding)."`

---

## 5. Doctor Preparation Agent
Prepares the patient before their clinical appointments, ensuring high-value discussions with providers.

* **Responsibility:**
  * Generates clinical questions based on patient trajectory and upcoming specialist type.
* **Example:**
  * **Input:** `"Seeing cardiologist tomorrow."`
  * **Output:**
    * **Questions to ask:**
      * *"Why is my LDL cholesterol level increasing?"*
      * *"Should my current cardiovascular medication dosage be adjusted?"*
      * *"Are additional diagnostic tests needed at this stage?"*

---

## 6. Follow-Up Agent
Proactively schedules checks and tests to close the loop on clinical findings.

* **Responsibility:**
  * Automates clinical follow-up planning after a new report is processed.
* **Output:**
  * Recommended follow-up timeline
  * Next tests to discuss with the primary care provider
  * Reminders/scheduling triggers

---

## 7. Medical Research Agent
Acts as an advanced biomedical research assistant (for informational reference, not direct diagnosis).

* **Responsibility:**
  * Gathers verified medical research, guidelines, and trusted sources based on patient health indicators.
* **Example:**
  * **Input:** Report mentioning `Hypertension` and `Fatty liver`.
  * **Output:**
    * Latest clinical guidelines on hypertension and NAFLD
    * Evidence-based lifestyle and dietary recommendations
    * Links to trusted sources (e.g., Mayo Clinic, ACC/AHA guidelines)
