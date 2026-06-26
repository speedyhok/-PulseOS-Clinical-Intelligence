import { useRef, useState } from "react";
import { AlertTriangle, FileUp, Pill, Search, ShieldCheck, Upload } from "lucide-react";
import type { LabResult, MedScanResult, PatientDigitalTwin } from "../lib/types";
import { checkDrugInteraction, getActiveMedications, getLatestLabs, type LatestLab } from "../lib/clinical";
import { SAMPLE_CSV_TEMPLATE } from "../lib/demoData";

interface Props {
  twin: PatientDigitalTwin;
  onAddLabs: (labs: LabResult[]) => void;
}

const statusBadge: Record<string, { label: string; cls: string; dot: string }> = {
  normal: { label: "Normal", cls: "bg-teal-50 text-teal-700 border-teal-300", dot: "bg-teal-500" },
  warning: { label: "Elevated", cls: "bg-amber-50 text-amber-700 border-amber-300", dot: "bg-amber-500" },
  abnormal: { label: "Critical", cls: "bg-rose-50 text-rose-700 border-rose-300", dot: "bg-rose-500" },
};

export default function LabPanel({ twin, onAddLabs }: Props) {
  const [showTemplate, setShowTemplate] = useState(false);
  const [scanResult, setScanResult] = useState<MedScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const latest = getLatestLabs(twin);
  const meds = getActiveMedications(twin);

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
        if (mi === -1 || vi === -1) throw new Error("CSV must have 'metric' and 'value' columns.");
        const labs: LabResult[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          const metric = (cols[mi] || "").trim();
          const value = parseFloat(cols[vi]);
          const unit = ui >= 0 ? (cols[ui] || "").trim() : "";
          if (!metric || Number.isNaN(value)) continue;
          labs.push({ metric, value, unit });
        }
        if (labs.length === 0) throw new Error("No valid lab rows found.");
        onAddLabs(labs);
        setUploadSuccess(`Added ${labs.length} lab metric${labs.length === 1 ? "" : "s"} to the Digital Twin.`);
      } catch (e) {
        setUploadError(`Error processing CSV: ${(e as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  const runScan = () => {
    setScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setScanResult(checkDrugInteraction(meds));
      setScanning(false);
    }, 700);
  };

  return (
    <section className="glass-card p-5 md:p-6">
      <h2 className="card-title">
        <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
          <FileUp className="w-4 h-4 text-teal-600" />
        </span>
        Lab Reports &amp; Metrics
      </h2>

      <button
        onClick={() => setShowTemplate((s) => !s)}
        className="text-xs text-teal-600 hover:text-teal-700 mb-3 font-medium flex items-center gap-1.5"
      >
        <span className={`transition-transform ${showTemplate ? "rotate-90" : ""}`}>▸</span>
        View Sample Lab CSV Template
      </button>
      {showTemplate && (
        <pre className="text-[0.72rem] bg-teal-50/70 border border-teal-200 rounded-xl p-3 overflow-x-auto text-teal-800 mb-3">
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
        className={`block cursor-pointer rounded-2xl border-2 border-dashed transition-all px-4 py-6 text-center ${
          dragOver
            ? "border-teal-400 bg-teal-50/70 scale-[1.01]"
            : "border-teal-300/60 bg-white/40 hover:border-teal-400 hover:bg-teal-50/40"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Upload className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-sm text-teal-800 font-semibold">Upload laboratory blood test report (CSV)</p>
          <p className="text-[0.72rem] text-teal-500">Click to browse or drag &amp; drop a file</p>
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
        <div className="mt-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {uploadError}
        </div>
      )}
      {uploadSuccess && (
        <div className="mt-3 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
          {uploadSuccess}
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-2.5">
          Latest Lab Values
        </p>
        {latest.length > 0 ? (
          <div className="space-y-2">
            {latest.map((lab: LatestLab) => {
              const badge = statusBadge[lab.status];
              return (
                <div
                  key={lab.metric}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/55 border border-white/70 hover:border-teal-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                    <span className="font-semibold text-teal-900 text-sm">{lab.metric}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-teal-700">
                      {lab.value} <span className="text-teal-400 text-xs">{lab.unit}</span>
                    </span>
                    <span className={`chip ${badge.cls}`}>{badge.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-teal-500/80 italic px-1">
            No laboratory reports loaded. Load the demo profile or upload a CSV.
          </p>
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-teal-200/60">
        <h3 className="flex items-center gap-2.5 text-base font-bold text-teal-900 mb-3">
          <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
            <Pill className="w-4 h-4 text-teal-600" />
          </span>
          Medications &amp; Safety Scan
        </h3>
        {meds.length > 0 ? (
          <>
            <div className="space-y-1.5 mb-3">
              {meds.map((med) => (
                <div
                  key={med}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-teal-50/60 border border-teal-200/70 text-sm text-teal-800"
                >
                  <Pill className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  <span className="font-medium">{med}</span>
                </div>
              ))}
            </div>
            <button onClick={runScan} disabled={scanning} className="btn-primary w-full">
              <Search className="w-4 h-4" />
              {scanning ? "Scanning RxNorm databases..." : "Run Medication Safety Scan"}
            </button>

            {scanResult && (
              <div className="mt-3">
                {scanResult.status === "interaction_detected" ? (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5">
                    <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm mb-2.5">
                      <AlertTriangle className="w-4 h-4" />
                      Interaction Detected · {scanResult.source}
                    </div>
                    {scanResult.interactions?.map((it, i) => (
                      <div key={i} className="text-xs text-teal-800 mb-2.5 last:mb-0 pl-1">
                        <p><span className="text-teal-500">Drugs:</span> {it.drugsInvolved.join(", ")}</p>
                        <p><span className="text-teal-500">Severity:</span> <span className="text-amber-600 font-semibold">{it.severity}</span></p>
                        <p className="mt-1 text-teal-700">{it.warningMessage}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-sm text-teal-700">
                    <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-teal-600" />
                    <span>{scanResult.message}</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-teal-500/80 italic px-1">No active medications found in patient profile.</p>
        )}
      </div>
    </section>
  );
}
