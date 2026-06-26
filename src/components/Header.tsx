/**
 * Author: Mohibul Hoque
 * Email: hokworks@gmail.com
 * LinkedIn: linkedin.com/in/speedymohibul
 */
import { Activity, HeartPulse, RotateCcw, UserPlus } from "lucide-react";
import type { PatientDigitalTwin } from "../lib/types";

interface Props {
  twin: PatientDigitalTwin;
  onLoadDemo: () => void;
  onReset: () => void;
}

export default function Header({ twin, onLoadDemo, onReset }: Props) {
  return (
    <header className="glass-card px-6 md:px-8 py-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
          <HeartPulse className="w-7 h-7 text-white" strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="text-3xl md:text-[2rem] font-extrabold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent leading-none mb-1">
            PulseOS
          </h1>
          <p className="text-[0.75rem] uppercase tracking-[0.2em] text-teal-500/80 font-semibold">
            Clinical Intelligence Console
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-6 px-6 py-3 rounded-2xl bg-white/55 border border-white/70 backdrop-blur-md shadow-sm">
          <div className="flex flex-col">
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-teal-500/80 font-semibold leading-none">
              Patient ID
            </span>
            <span className="text-teal-800 font-extrabold text-lg mt-1.5 leading-none">
              {twin.patientId}
            </span>
          </div>
          <div className="w-px h-10 bg-teal-200" />
          <div className="flex flex-col">
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-teal-500/80 font-semibold leading-none">
              Age Profile
            </span>
            <span className="text-teal-800 font-extrabold text-lg mt-1.5 leading-none">
              {twin.age} yrs
            </span>
          </div>
          <div className="w-px h-10 bg-teal-200" />
          <div className="flex items-center gap-2">
            <Activity className="w-4.5 h-4.5 text-teal-500" />
            <span className="text-teal-800 font-extrabold text-lg leading-none">
              {twin.history.length}
            </span>
            <span className="text-[0.7rem] uppercase tracking-[0.14em] text-teal-500/80 font-semibold">
              visits
            </span>
          </div>
        </div>

        <button onClick={onLoadDemo} className="btn-primary !h-12 !px-5 text-sm md:text-base">
          <UserPlus className="w-5 h-5" />
          Load Demo Profile
        </button>
        <button onClick={onReset} className="btn-ghost !h-12 !px-5 text-sm md:text-base">
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
      </div>
    </header>
  );
}
