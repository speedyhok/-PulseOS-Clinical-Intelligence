# PulseOS — Clinical Decision Support & Patient Engagement Console

PulseOS is a modern, clinical-intelligence patient platform built on a highly modular multi-agent architecture. It integrates with live NIH RxNorm and PubMed APIs to analyze clinical records, flag medication safety concerns, map anatomical health risks, and prepare patients for primary care visits.

Developed by: **Mohibul Hoque** ([hokworks@gmail.com](mailto:hokworks@gmail.com) | [LinkedIn](https://linkedin.com/in/speedymohibul))

---

## 🚀 Key Features

* **Multi-Agent Clinical Support**: Coordinates 7 specialized AI agents:
  1. *Medical Document Agent*: Extracts structures from uploaded report CSVs.
  2. *Medical Knowledge Agent*: Translates complex clinical terminology to patient-friendly explanations.
  3. *Longitudinal Health Agent*: Identifies progressive, multi-year trajectories (sorting dates chronologically).
  4. *Medication Intelligence Agent*: Evaluates schedules, duplicate therapies, and drug interactions.
  5. *Doctor Preparation Agent*: Suggests appointment questions based on patient trajectory.
  6. *Follow-Up Agent*: Proposes diagnostics, schedules, and reminders.
  7. *Medical Research Agent*: References ACC/AHA, AASLD guidelines and NCBI PubMed papers.
* **Interactive Anatomy Visualizer**: Renders SVG-based anatomical models that dynamically glow matching clinical elevations (e.g. renal, cardiovascular, hepatic, pancreatic).
* **Medication Safety Scanning**: Live querying of NIH RxNorm APIs to identify drug-drug interactions.
* **Longitudinal Timeline**: Tracks multi-year records in strict chronological order.

---

## 🛠️ Architecture & Tech Stack

* **Frontend**: React, TypeScript, Vite, TailwindCSS (for glassmorphic UI layout), Lucide icons.
* **Backend**: FastAPI (Python), Google GenAI Agent Development Kit (ADK), Streamlit (fallback UI option).
* **Integrations**: NLM RxNorm, NCBI Entrez E-Utilities (PubMed).

---

## 💻 Running the Application

Ensure you have Python 3.11+ and Node.js installed.

### 1. Backend Server Setup
Navigate to the root directory and install dependencies:
```bash
# Create virtual environment and install packages
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Start FastAPI server
python app/server.py
```
*The FastAPI server will run on `http://localhost:8000`.*

### 2. Frontend App Setup
Open another terminal:
```bash
# Install node packages
npm install

# Start Vite React server
npm run dev
```
*The React app will serve on `http://localhost:5173`.*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
