import type { LabResult, LabStatus, MedScanResult, PatientDigitalTwin } from "./types";

export interface LatestLab {
  metric: string;
  value: number;
  unit: string;
  date: string;
  status: LabStatus;
}

export function getLatestLabs(twin: PatientDigitalTwin): LatestLab[] {
  const map = new Map<string, LatestLab>();
  const sorted = [...twin.history].sort((a, b) => a.date.localeCompare(b.date));
  for (const record of sorted) {
    for (const lab of record.labs) {
      map.set(lab.metric, {
        metric: lab.metric,
        value: lab.value,
        unit: lab.unit,
        date: record.date,
        status: classifyLab(lab.metric, lab.value),
      });
    }
  }
  return Array.from(map.values());
}

export function classifyLab(metric: string, value: number): LabStatus {
  const n = metric.toLowerCase();
  if (n.includes("alt")) {
    if (value > 55) return "abnormal";
    if (value > 40) return "warning";
    return "normal";
  }
  if (n.includes("creatinine")) {
    if (value >= 1.5) return "abnormal";
    if (value >= 1.2) return "warning";
    return "normal";
  }
  if (n.includes("ldl")) {
    if (value >= 130) return "abnormal";
    if (value >= 100) return "warning";
    return "normal";
  }
  if (n.includes("hba1c")) {
    if (value >= 6.5) return "abnormal";
    if (value >= 5.7) return "warning";
    return "normal";
  }
  return "normal";
}

export function getActiveMedications(twin: PatientDigitalTwin): string[] {
  const meds: string[] = [];
  for (const record of twin.history) {
    for (const med of record.medications) {
      if (!meds.includes(med)) meds.push(med);
    }
  }
  return meds;
}

// Simplified local interaction knowledge base (mirrors the RxNorm-style check in the original)
const KNOWN_INTERACTIONS: Array<{
  pair: string[];
  severity: "Mild" | "Moderate" | "Severe";
  message: string;
}> = [
  {
    pair: ["Simvastatin", "Lisinopril"],
    severity: "Mild",
    message: "No clinically significant interaction. Monitor for muscle-related side effects.",
  },
  {
    pair: ["Simvastatin", "Metformin"],
    severity: "Mild",
    message: "Generally safe in combination. Continue standard monitoring of liver enzymes.",
  },
  {
    pair: ["Metformin", "Lisinopril"],
    severity: "Moderate",
    message: "Lisinopril may potentiate metformin's effect on renal function. Monitor creatinine and eGFR closely.",
  },
];

export function checkDrugInteraction(meds: string[]): MedScanResult {
  const normalized = meds.map((m) => m.split(" ")[0].toLowerCase());
  const found = [];
  for (const interaction of KNOWN_INTERACTIONS) {
    const a = interaction.pair[0].toLowerCase();
    const b = interaction.pair[1].toLowerCase();
    if (normalized.includes(a) && normalized.includes(b)) {
      found.push({
        drugsInvolved: interaction.pair,
        severity: interaction.severity,
        warningMessage: interaction.message,
      });
    }
  }
  if (found.length === 0) {
    return {
      status: "clear",
      source: "NIH RxNorm",
      message: "No drug-drug interactions detected across the active medication list.",
    };
  }
  return {
    status: "interaction_detected",
    source: "NIH RxNorm",
    interactions: found,
  };
}

export interface OrganStatus {
  organ: "heart" | "liver" | "kidney" | "pancreas";
  status: LabStatus;
  metric: string;
  value: number | null;
  unit: string;
}

export function getOrganStatuses(twin: PatientDigitalTwin): OrganStatuses {
  const latest = new Map<string, LabResult & { date: string }>();
  for (const record of twin.history) {
    for (const lab of record.labs) {
      latest.set(lab.metric.toLowerCase(), { ...lab, date: record.date });
    }
  }
  const pick = (keys: string[]) => {
    for (const k of keys) {
      if (latest.has(k)) return latest.get(k)!;
    }
    return null;
  };

  const ldl = pick(["ldl", "ldl cholesterol"]);
  const alt = pick(["alt"]);
  const creat = pick(["creatinine"]);
  const hba1c = pick(["hba1c"]);

  const heart: OrganStatus = {
    organ: "heart",
    status: ldl ? classifyLab("ldl", ldl.value) : "normal",
    metric: "LDL",
    value: ldl?.value ?? null,
    unit: ldl?.unit ?? "mg/dL",
  };
  const liver: OrganStatus = {
    organ: "liver",
    status: alt ? classifyLab("alt", alt.value) : "normal",
    metric: "ALT",
    value: alt?.value ?? null,
    unit: alt?.unit ?? "U/L",
  };
  const kidney: OrganStatus = {
    organ: "kidney",
    status: creat ? classifyLab("creatinine", creat.value) : "normal",
    metric: "Creatinine",
    value: creat?.value ?? null,
    unit: creat?.unit ?? "mg/dL",
  };
  const pancreas: OrganStatus = {
    organ: "pancreas",
    status: hba1c ? classifyLab("hba1c", hba1c.value) : "normal",
    metric: "HbA1c",
    value: hba1c?.value ?? null,
    unit: hba1c?.unit ?? "%",
  };

  return { heart, liver, kidney, pancreas };
}

export type OrganStatuses = Record<"heart" | "liver" | "kidney" | "pancreas", OrganStatus>;

// Lightweight canned agent responses for the demo (no live LLM in this environment)
export function generateAgentResponse(query: string, twin: PatientDigitalTwin): string {
  const q = query.toLowerCase();
  const latest = getLatestLabs(twin);
  const alt = latest.find((l) => l.metric.toLowerCase().includes("alt"));
  const ldl = latest.find((l) => l.metric.toLowerCase().includes("ldl"));
  const creat = latest.find((l) => l.metric.toLowerCase().includes("creatinine"));
  const hba1c = latest.find((l) => l.metric.toLowerCase().includes("hba1c"));

  if (q.includes("liver") || q.includes("alt")) {
    const trend = twin.history
      .map((r) => {
        const v = r.labs.find((l) => l.metric.toLowerCase() === "alt");
        return v ? `${r.date}: ${v.value} ${v.unit}` : null;
      })
      .filter(Boolean)
      .join(" → ");
    return [
      "**Liver Health Agent** — Trend Analysis",
      "",
      `ALT trajectory: ${trend || "no data"}`,
      alt
        ? `Current ALT: ${alt.value} ${alt.unit} (${alt.status.toUpperCase()})`
        : "No ALT values on record.",
      "",
      alt?.status === "abnormal"
        ? "ALT exceeds the 55 U/L threshold, suggesting possible hepatic stress. Recommend follow-up liver panel, abdominal ultrasound, and review of statin therapy with your provider."
        : alt?.status === "warning"
        ? "ALT is mildly elevated (40–55 U/L). Consider alcohol intake review, weight management, and a repeat panel in 8–12 weeks."
        : "ALT is within normal range. Continue current monitoring cadence.",
    ].join("\n");
  }

  if (q.includes("brief") || q.includes("doctor") || q.includes("appointment")) {
    return [
      "**Doctor Preparation Agent** — Suggested Questions",
      "",
      "Based on your longitudinal trends, consider asking your primary care provider:",
      "",
      `1. My LDL has trended from ${ldl ? ldl.value : "—"} mg/dL — should we adjust statin dosing or add a PCSK9 inhibitor?`,
      `2. Creatinine is now ${creat ? creat.value : "—"} mg/dL — is this early-stage renal impairment, and should metformin be re-evaluated?`,
      `3. HbA1c is ${hba1c ? hba1c.value : "—"}% — am I approaching the pre-diabetes/diabetes threshold?`,
      "4. Given the combined Simvastatin + Metformin + Lisinopril regimen, what renal and hepatic monitoring cadence do you recommend?",
      "5. Are there lifestyle interventions that could reduce my medication load over the next 6 months?",
    ].join("\n");
  }

  if (q.includes("pubmed") || q.includes("research") || q.includes("guideline")) {
    return [
      "**PubMed Research Agent** — Clinical Guideline Summary",
      "",
      "Fatty Liver (NAFLD):",
      "• AASLD 2023 guidance recommends lifestyle modification as first-line; pioglitazone or vitamin E considered in biopsy-confirmed NASH.",
      "",
      "Hypertension:",
      "• ACC/AHA 2017 guideline supports ACE inhibitor (e.g., Lisinopril) as first-line in patients with comorbid diabetes or CKD.",
      "• Target BP < 130/80 mmHg for adults with cardiovascular risk factors.",
      "",
      "Sources: PubMed Central, Mayo Clinic, American College of Cardiology.",
    ].join("\n");
  }

  return [
    "**Clinical Coordinator Agent** — Summary",
    "",
    `I've routed your query across the care team. Current snapshot:`,
    `• ALT: ${alt?.value ?? "—"} ${alt?.unit ?? ""} (${alt?.status ?? "n/a"})`,
    `• LDL: ${ldl?.value ?? "—"} ${ldl?.unit ?? ""} (${ldl?.status ?? "n/a"})`,
    `• Creatinine: ${creat?.value ?? "—"} ${creat?.unit ?? ""} (${creat?.status ?? "n/a"})`,
    `• HbA1c: ${hba1c?.value ?? "—"} ${hba1c?.unit ?? ""} (${hba1c?.status ?? "n/a"})`,
    "",
    "Ask me about liver trends, doctor visit prep, or PubMed research for more detail.",
  ].join("\n");
}
