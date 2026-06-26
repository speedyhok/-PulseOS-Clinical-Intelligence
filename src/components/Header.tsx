import { Activity, HeartPulse, RotateCcw, UserPlus } from "lucide-react";
import type { PatientDigitalTwin } from "../lib/types";

interface Props {
  twin: PatientDigitalTwin;
  onLoadDemo: () => void;
  onReset: () => void;
}

export default function Header({ twin, onLoadDemo, onReset }: Props) {
  return (
    <header className="glass-card px-5 md:px-7 py-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
          <HeartPulse className="w-6 h-6 text-white" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-2xl md:text-[1.7rem] font-extrabold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
            PulseOS
          </h1>
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-teal-500/80 font-semibold">
            Clinical Intelligence Console
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-5 px-5 py-2.5 rounded-2xl bg-white/55 border border-white/70 backdrop-blur-md shadow-sm">
          <div className="flex flex-col">
            <span className="text-[0.6rem] uppercase tracking-[0.14em] text-teal-500/80 font-semibold leading-none">
              Patient ID
            </span>
            <span className="text-teal-800 font-bold text-base mt-1 leading-none">
              {twin.patientId}
            </span>
          </div>
          <div className="w-px h-8 bg-teal-200" />
          <div className="flex flex-col">
            <span className="text-[0.6rem] uppercase tracking-[0.14em] text-teal-500/80 font-semibold leading-none">
              Age Profile
            </span>
            <span className="text-teal-800 font-bold text-base mt-1 leading-none">
              {twin.age} yrs
            </span>
          </div>
          <div className="w-px h-8 bg-teal-200" />
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-500" />
            <span className="text-teal-800 font-bold text-base leading-none">
              {twin.history.length}
            </span>
            <span className="text-[0.6rem] uppercase tracking-[0.14em] text-teal-500/80 font-semibold">
              visits
            </span>
          </div>
        </div>

        <button onClick={onLoadDemo} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Load Demo Profile
        </button>
        <button onClick={onReset} className="btn-ghost">
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </header>
  );
}
