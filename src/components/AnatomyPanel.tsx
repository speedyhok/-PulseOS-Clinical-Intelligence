import { Info, User } from "lucide-react";
import AnatomyVisualizer from "./AnatomyVisualizer";
import type { OrganStatuses } from "../lib/clinical";

interface Props {
  statuses: OrganStatuses;
}

const organMeta: Record<string, { label: string; metric: string }> = {
  heart: { label: "Heart", metric: "LDL" },
  liver: { label: "Liver", metric: "ALT" },
  kidney: { label: "Kidneys", metric: "Creatinine" },
  pancreas: { label: "Pancreas", metric: "HbA1c" },
};

const stateStyle: Record<string, { ring: string; text: string; label: string }> = {
  normal: { ring: "ring-teal-300", text: "text-teal-700", label: "Normal" },
  warning: { ring: "ring-amber-300", text: "text-amber-700", label: "Elevated" },
  abnormal: { ring: "ring-rose-300", text: "text-rose-700", label: "Critical" },
};

export default function AnatomyPanel({ statuses }: Props) {
  return (
    <section className="glass-card p-5 md:p-6">
      <h2 className="card-title">
        <span className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
          <User className="w-4 h-4 text-teal-600" />
        </span>
        Visual Organ Anatomy
      </h2>
      <p className="text-sm text-teal-600 mb-4">
        Organs render dynamically. Affected areas glow amber or red based on your latest lab findings.
      </p>

      <AnatomyVisualizer statuses={statuses} />

      <div className="mt-4 px-4 py-3 rounded-2xl bg-white/55 border border-white/70 flex items-start gap-2.5">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-teal-500" />
        <div className="text-xs text-teal-700 space-y-1">
          <p><span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500 mr-2 align-middle"></span>Within normal clinical range.</p>
          <p><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-2 align-middle shadow-[0_0_6px_rgba(245,158,11,0.6)]"></span>Mild elevations detected.</p>
          <p><span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 mr-2 align-middle shadow-[0_0_6px_rgba(239,68,68,0.6)]"></span>Significant clinical deviation.</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["heart", "liver", "kidney", "pancreas"] as const).map((k) => {
          const s = statuses[k];
          const meta = organMeta[k];
          const style = stateStyle[s.status];
          return (
            <div
              key={k}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/55 border border-white/70 ring-1 ${style.ring} ring-opacity-40`}
            >
              <div className="flex-1">
                <p className="text-teal-900 font-semibold text-sm">{meta.label}</p>
                <p className="text-teal-500 text-[0.7rem]">
                  {meta.metric}: {s.value !== null ? `${s.value} ${s.unit}` : "—"}
                </p>
              </div>
              <span className={`text-[0.68rem] font-bold uppercase tracking-wide ${style.text}`}>
                {style.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
