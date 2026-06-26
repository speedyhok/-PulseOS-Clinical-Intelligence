import type { PatientDigitalTwin } from "./types";

export const DEMO_PATIENT: PatientDigitalTwin = {
  patientId: "PT-9942",
  age: 58,
  history: [
    {
      date: "2024-05-10",
      recordType: "Blood Test",
      labs: [
        { metric: "ALT", value: 28.0, unit: "U/L" },
        { metric: "Creatinine", value: 0.9, unit: "mg/dL" },
        { metric: "LDL", value: 112.0, unit: "mg/dL" },
        { metric: "HbA1c", value: 5.5, unit: "%" },
      ],
      medications: ["Simvastatin 20mg"],
    },
    {
      date: "2025-06-15",
      recordType: "Blood Test",
      labs: [
        { metric: "ALT", value: 46.0, unit: "U/L" },
        { metric: "Creatinine", value: 1.1, unit: "mg/dL" },
        { metric: "LDL", value: 128.0, unit: "mg/dL" },
        { metric: "HbA1c", value: 5.9, unit: "%" },
      ],
      medications: ["Simvastatin 20mg", "Metformin 500mg"],
    },
    {
      date: "2026-06-25",
      recordType: "Blood Test",
      labs: [
        { metric: "ALT", value: 72.0, unit: "U/L" },
        { metric: "Creatinine", value: 1.5, unit: "mg/dL" },
        { metric: "LDL", value: 155.0, unit: "mg/dL" },
        { metric: "HbA1c", value: 6.4, unit: "%" },
      ],
      medications: ["Simvastatin 20mg", "Metformin 500mg", "Lisinopril 10mg"],
    },
  ],
};

export const EMPTY_PATIENT: PatientDigitalTwin = {
  patientId: "PT-9942",
  age: 45,
  history: [],
};

export const SAMPLE_CSV_TEMPLATE = `metric,value,unit
ALT,72.0,U/L
Creatinine,1.5,mg/dL
LDL,155.0,mg/dL
HbA1c,6.4,%`;
