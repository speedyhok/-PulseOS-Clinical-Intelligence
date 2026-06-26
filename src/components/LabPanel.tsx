import { useRef, useState } from "react";
import { AlertTriangle, FileUp, Pill, Search, ShieldCheck, Upload } from "lucide-react";
import type { LabResult, MedScanResult, PatientDigitalTwin } from "../lib/types";
import { getActiveMedications, getLatestLabs, type LatestLab } from "../lib/clinical";
import { SAMPLE_CSV_TEMPLATE } from "../lib/demoData";

interface Props {
  twin: PatientDigitalTwin;
  onAddLabs: (labs: LabResult[], medications?: string[]) => void;
  sessionId: string;
}

const statusBadge: Record<string, { label: string; cls: string; dot: string }> = {
  normal: { label: "Normal", cls: "bg-teal-50 text-teal-700 border-teal-300", dot: "bg-teal-500" },
  warning: { label: "Elevated", cls: "bg-amber-50 text-amber-700 border-amber-300", dot: "bg-amber-500" },
  abnormal: { label: "Critical", cls: "bg-rose-50 text-rose-700 border-rose-300", dot: "bg-rose-500" },
};

export default function LabPanel({ twin, onAddLabs, sessionId }: Props) {
  const [showTemplate, setShowTemplate] = useState(false);
  const [scanResult, setScanResult] = useState<MedScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [newMed, setNewMed] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const latest = getLatestLabs(twin);
  const meds = getActiveMedications(twin);

  const handleAddMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.trim()) return;
    onAddLabs([], [newMed.trim()]);
    setNewMed("");
  };

  const handleFile = (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      try {
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) throw new Error("CSV must include a header and at least one row.");
        const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const mi = header.indexOf("metric");
        const vi = header.indexOf("value");
        const ui = header.indexOf("unit");
        let medi = header.indexOf("medication");
        if (medi === -1) medi = header.indexOf("medications");

        if (mi === -1 || vi === -1) throw new Error("CSV must have 'metric' and 'value' columns.");
        const labs: LabResult[] = [];
        const medications: string[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          const metric = (cols[mi] || "").trim();
          const value = parseFloat(cols[vi]);
          const unit = ui >= 0 ? (cols[ui] || "").trim() : "";
          if (metric && !Number.isNaN(value)) {
            labs.push({ metric, value, unit });
          }
          if (medi >= 0 && cols[medi]) {
            const med = cols[medi].trim();
            if (med) medications.push(med);
          }
        }
        if (labs.length === 0 && medications.length === 0) {
          throw new Error("No valid lab rows or medications found.");
        }
        onAddLabs(labs, medications);
        const labMsg = labs.length > 0 ? `${labs.length} lab metric${labs.length === 1 ? "" : "s"}` : "";
        const medMsg = medications.length > 0 ? `${medications.length} medication${medications.length === 1 ? "" : "s"}` : "";
        const joinMsg = labMsg && medMsg ? " and " : "";
        setUploadSuccess(`Added ${labMsg}${joinMsg}${medMsg} to the Digital Twin.`);
      } catch (e) {
        setUploadError(`Error processing CSV: ${(e as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  const runScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch(`http://localhost:8000/api/meds/scan?session_id=${sessionId}`, {
        method: "POST"
      });
      const data = await res.json();
      setScanResult(data);
    } catch (e) {
      setScanResult({
        status: "interaction_detected",
        source: "API Error",
        interactions: [{
          drugsInvolved: [],
          severity: "Severe",
          warningMessage: "Could not contact medication safety API: " + (e instanceof Error ? e.message : String(e))
        }]
      });
    } finally {
      setScanning(false);
    }
  };

  return (
    <section className="glass-card p-6 md:p-7">
      <h2 className="card-title">
        <span className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
          <FileUp className="w-5.5 h-5.5 text-teal-600" strokeWidth={2.2} />
        </span>
        Lab Reports &amp; Metrics
      </h2>

      <button
        onClick={() => setShowTemplate((s) => !s)}
        className="text-sm text-teal-600 hover:text-teal-700 mb-3.5 font-semibold flex items-center gap-1.5"
      >
        <span className={`transition-transform ${showTemplate ? "rotate-90" : ""}`}>▸</span>
        View Sample Lab CSV Template
      </button>
      {showTemplate && (
        <pre className="text-xs bg-teal-50/70 border border-teal-200 rounded-xl p-4 overflow-x-auto text-teal-800 mb-3.5">
          {SAMPLE_CSV_TEMPLATE}
        </pre>
      )}

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`block cursor-pointer rounded-2xl border-2 border-dashed transition-all px-6 py-8 text-center ${
          dragOver
            ? "border-teal-400 bg-teal-50/70 scale-[1.01]"
            : "border-teal-300/60 bg-white/40 hover:border-teal-400 hover:bg-teal-50/40"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center">
            <Upload className="w-6 h-6 text-teal-600" />
          </div>
          <p className="text-base text-teal-800 font-bold">Upload laboratory blood test report (CSV)</p>
          <p className="text-xs text-teal-500 font-medium">Click to browse or drag &amp; drop a file</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </label>

      {uploadError && (
        <div className="mt-3.5 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
          {uploadError}
        </div>
      )}
      {uploadSuccess && (
        <div className="mt-3.5 text-sm text-teal-700 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
          {uploadSuccess}
        </div>
      )}

      <div className="mt-6">
        <p className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-3">
          Latest Lab Values
        </p>
        {latest.length > 0 ? (
          <div className="space-y-3">
            {latest.map((lab: LatestLab) => {
              const badge = statusBadge[lab.status];
              return (
                <div
                  key={lab.metric}
                  className="flex items-center justify-between px-4.5 py-3.5 rounded-xl bg-white/55 border border-white/70 hover:border-teal-300 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${badge.dot}`} />
                    <span className="font-bold text-teal-900 text-base">{lab.metric}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-base font-semibold text-teal-700">
                      {lab.value} <span className="text-teal-400 text-sm font-normal">{lab.unit}</span>
                    </span>
                    <span className={`chip ${badge.cls}`}>{badge.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-base text-teal-500/80 italic px-1">
            No laboratory reports loaded. Load the demo profile or upload a CSV.
          </p>
        )}
      </div>

      <div className="mt-7 pt-6 border-t border-teal-200/60">
        <h3 className="flex items-center gap-3 text-lg font-extrabold text-teal-900 mb-4">
          <span className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Pill className="w-5.5 h-5.5 text-teal-600" strokeWidth={2.2} />
          </span>
          Medications &amp; Safety Scan
        </h3>

        <form onSubmit={handleAddMed} className="flex gap-2.5 mb-4.5">
          <input
            type="text"
            placeholder="Add medication (e.g. Sildenafil 50mg)"
            value={newMed}
            onChange={(e) => setNewMed(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-teal-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white/50 text-teal-950 font-medium placeholder-teal-400 text-sm shadow-sm"
          />
          <button
            type="submit"
            className="px-4.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-sm hover:shadow transition-all"
          >
            Add
          </button>
        </form>
        {meds.length > 0 ? (
          <>
            <div className="space-y-2 mb-4">
              {meds.map((med) => (
                <div
                  key={med}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-teal-50/60 border border-teal-200/70 text-base text-teal-800 shadow-sm"
                >
                  <Pill className="w-4.5 h-4.5 text-teal-500 shrink-0" />
                  <span className="font-semibold">{med}</span>
                </div>
              ))}
            </div>
            <button onClick={runScan} disabled={scanning} className="btn-primary w-full">
              <Search className="w-5 h-5" />
              {scanning ? "Scanning RxNorm databases..." : "Run Medication Safety Scan"}
            </button>

            {scanResult && (
              <div className="mt-4">
                {scanResult.status === "interaction_detected" ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4.5 shadow-sm">
                    <div className="flex items-center gap-2.5 text-rose-700 font-bold text-base mb-3">
                      <AlertTriangle className="w-5 h-5" />
                      Interaction Detected · {scanResult.source}
                    </div>
                    {scanResult.interactions?.map((it, i) => (
                      <div key={i} className="text-sm text-teal-800 mb-3 last:mb-0 pl-1 space-y-1">
                        <p><span className="text-teal-500 font-medium">Drugs:</span> {it.drugsInvolved.join(", ")}</p>
                        <p><span className="text-teal-500 font-medium">Severity:</span> <span className="text-amber-600 font-bold">{it.severity}</span></p>
                        <p className="mt-1 text-teal-700 leading-relaxed">{it.warningMessage}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4 text-base text-teal-700 shadow-sm">
                    <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-teal-600" />
                    <span>{scanResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-base text-teal-500/80 italic px-1">No active medications found in patient profile.</p>
        )}
      </div>
    </section>
  );
}
