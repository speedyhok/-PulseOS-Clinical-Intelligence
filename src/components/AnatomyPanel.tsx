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
    <section className="glass-card p-6 md:p-7">
      <h2 className="card-title">
        <span className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
          <User className="w-5.5 h-5.5 text-teal-600" strokeWidth={2.2} />
        </span>
        Visual Organ Anatomy
      </h2>
      <p className="text-sm md:text-base text-teal-600 mb-5 leading-relaxed">
        Organs render dynamically. Affected areas glow amber or red based on your latest lab findings.
      </p>

      <AnatomyVisualizer statuses={statuses} />

      <div className="mt-5 px-5 py-4 rounded-2xl bg-white/55 border border-white/70 flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 mt-0.5 shrink-0 text-teal-500" />
        <div className="text-xs md:text-sm text-teal-700 space-y-1.5">
          <p><span className="inline-block w-3.5 h-3.5 rounded-full bg-teal-500 mr-2 align-middle"></span>Within normal clinical range.</p>
          <p><span className="inline-block w-3.5 h-3.5 rounded-full bg-amber-500 mr-2 align-middle shadow-[0_0_6px_rgba(245,158,11,0.6)]"></span>Mild elevations detected.</p>
          <p><span className="inline-block w-3.5 h-3.5 rounded-full bg-rose-500 mr-2 align-middle shadow-[0_0_6px_rgba(239,68,68,0.6)]"></span>Significant clinical deviation.</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
        {(["heart", "liver", "kidney", "pancreas"] as const).map((k) => {
          const s = statuses[k];
          const meta = organMeta[k];
          const style = stateStyle[s.status];
          return (
            <div
              key={k}
              className={`flex flex-col justify-between p-3.5 rounded-xl bg-white/55 border border-white/70 ring-1 ${style.ring} ring-opacity-40 shadow-sm gap-1.5`}
            >
              <div className="flex flex-wrap justify-between items-center w-full gap-1.5">
                <span className="text-teal-900 font-bold text-xs md:text-sm leading-none">{meta.label}</span>
                <span className={`text-[0.6rem] md:text-[0.65rem] font-extrabold uppercase tracking-wide leading-none ${style.text} px-1.5 py-0.5 rounded bg-white/40 border border-current/10 shrink-0`}>
                  {style.label}
                </span>
              </div>
              <p className="text-teal-500 text-[0.7rem] md:text-xs font-semibold leading-none mt-1.5">
                {meta.metric}: <span className="font-bold text-teal-700">{s.value !== null ? `${s.value} ${s.unit}` : "—"}</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
