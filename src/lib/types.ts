export type LabStatus = "normal" | "warning" | "abnormal";

export interface LabResult {
  metric: string;
  value: number;
  unit: string;
  date?: string;
  medication?: string;
}

export interface HealthRecord {
  date: string;
  recordType: string;
  labs: LabResult[];
  medications: string[];
}

export interface PatientDigitalTwin {
  patientId: string;
  age: number;
  history: HealthRecord[];
}

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

export interface MedInteraction {
  drugsInvolved: string[];
  severity: "Mild" | "Moderate" | "Severe";
  warningMessage: string;
}

export interface MedScanResult {
  status: "clear" | "interaction_detected";
  source: string;
  interactions?: MedInteraction[];
  message?: string;
}
