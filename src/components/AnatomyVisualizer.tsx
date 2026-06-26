import type { OrganStatuses } from "../lib/clinical";
import type { LabStatus } from "../lib/types";

interface Props {
  statuses: OrganStatuses;
}

const stateColor: Record<LabStatus, string> = {
  normal: "#14b8a6",
  warning: "#f59e0b",
  abnormal: "#ef4444",
};

export default function AnatomyVisualizer({ statuses }: Props) {
  return (
    <div className="anatomy-stage bg-[#020617] border-slate-800 shadow-inner relative overflow-hidden w-full">
      {/* HUD Scanner Line Animation */}
      <div 
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent opacity-40"
        style={{
          animation: "scan 4s linear infinite",
          boxShadow: "0 0 10px #38bdf8",
        }}
      />
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 260 480"
        xmlns="http://www.w3.org/2000/svg"
        style={{ backgroundColor: "transparent" }}
      >
        <defs>
          <pattern id="hud-grid-b" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="#1e293b" />
          </pattern>
        </defs>

        {/* HUD grid overlay */}
        <rect width="100%" height="100%" fill="url(#hud-grid-b)" />

        {/* Framing brackets */}
        <path d="M 12 30 L 12 12 L 30 12 M 248 30 L 248 12 L 230 12 M 12 450 L 12 468 L 30 468 M 248 450 L 248 468 L 230 468" stroke="#334155" strokeWidth="1.5" fill="none" />

        {/* Body outline with dashed technical lines */}
        <path
          d="M130 24
             C 112 24 100 38 100 56
             C 100 68 106 78 114 82
             L 114 92
             C 90 100 66 112 54 132
             C 46 148 48 166 52 184
             L 58 300
             C 60 344 64 392 68 432
             C 70 448 78 458 92 460
             L 168 460
             C 182 458 190 448 192 432
             C 196 392 200 344 202 300
             L 208 184
             C 212 166 214 148 206 132
             C 194 112 170 100 146 92
             L 146 82
             C 154 78 160 68 160 56
             C 160 38 148 24 130 24 Z"
          fill="none"
          stroke="#475569"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Heart Target HUD */}
        <g>
          <circle cx="130" cy="178" r="30" fill="none" stroke={stateColor[statuses.heart.status]} strokeWidth="1" strokeDasharray={statuses.heart.status === "normal" ? "2 6" : "2 2"} opacity={statuses.heart.status === "normal" ? 0.3 : 0.8} />
          {statuses.heart.status !== "normal" && (
            <>
              <line x1="130" y1="140" x2="130" y2="146" stroke={stateColor[statuses.heart.status]} strokeWidth="1" />
              <line x1="130" y1="210" x2="130" y2="216" stroke={stateColor[statuses.heart.status]} strokeWidth="1" />
              <line x1="92" y1="178" x2="98" y2="178" stroke={stateColor[statuses.heart.status]} strokeWidth="1" />
              <line x1="162" y1="178" x2="168" y2="178" stroke={stateColor[statuses.heart.status]} strokeWidth="1" />
            </>
          )}
          <path
            d="M 130 158 C 122 148 104 150 100 166 C 96 184 114 200 130 210 C 146 200 164 184 160 166 C 156 150 138 148 130 158 Z"
            fill={statuses.heart.status === "normal" ? "transparent" : stateColor[statuses.heart.status]}
            fillOpacity="0.25"
            stroke={stateColor[statuses.heart.status]}
            strokeWidth="1.5"
          />
        </g>

        {/* Liver Target HUD */}
        <g>
          <circle cx="108" cy="258" r="30" fill="none" stroke={stateColor[statuses.liver.status]} strokeWidth="1" strokeDasharray={statuses.liver.status === "normal" ? "2 6" : "2 2"} opacity={statuses.liver.status === "normal" ? 0.3 : 0.8} />
          {statuses.liver.status !== "normal" && (
            <>
              <line x1="108" y1="220" x2="108" y2="226" stroke={stateColor[statuses.liver.status]} strokeWidth="1" />
              <line x1="108" y1="290" x2="108" y2="296" stroke={stateColor[statuses.liver.status]} strokeWidth="1" />
            </>
          )}
          <path
            d="M 68 246 C 84 238 128 238 148 248 C 156 252 154 264 144 268 C 128 274 92 274 74 268 C 64 264 62 252 68 246 Z"
            fill={statuses.liver.status === "normal" ? "transparent" : stateColor[statuses.liver.status]}
            fillOpacity="0.25"
            stroke={stateColor[statuses.liver.status]}
            strokeWidth="1.5"
          />
        </g>

        {/* Pancreas Target HUD */}
        <g>
          <ellipse cx="130" cy="294" rx="36" ry="16" fill="none" stroke={stateColor[statuses.pancreas.status]} strokeWidth="1" strokeDasharray={statuses.pancreas.status === "normal" ? "2 6" : "2 2"} opacity={statuses.pancreas.status === "normal" ? 0.3 : 0.8} />
          {statuses.pancreas.status !== "normal" && (
            <>
              <line x1="130" y1="270" x2="130" y2="276" stroke={stateColor[statuses.pancreas.status]} strokeWidth="1" />
              <line x1="130" y1="312" x2="130" y2="318" stroke={stateColor[statuses.pancreas.status]} strokeWidth="1" />
            </>
          )}
          <path
            d="M 96 288 C 112 284 138 286 152 292 C 158 295 160 300 156 304 C 144 310 116 310 98 304 C 90 301 88 292 96 288 Z"
            fill={statuses.pancreas.status === "normal" ? "transparent" : stateColor[statuses.pancreas.status]}
            fillOpacity="0.25"
            stroke={stateColor[statuses.pancreas.status]}
            strokeWidth="1.5"
          />
        </g>

        {/* Kidneys Target HUD */}
        <g>
          <circle cx="92" cy="338" r="22" fill="none" stroke={stateColor[statuses.kidney.status]} strokeWidth="1" strokeDasharray={statuses.kidney.status === "normal" ? "2 6" : "2 2"} opacity={statuses.kidney.status === "normal" ? 0.3 : 0.8} />
          <circle cx="168" cy="338" r="22" fill="none" stroke={stateColor[statuses.kidney.status]} strokeWidth="1" strokeDasharray={statuses.kidney.status === "normal" ? "2 6" : "2 2"} opacity={statuses.kidney.status === "normal" ? 0.3 : 0.8} />
          {/* Left Kidney */}
          <path
            d="M 82 318 C 70 318 64 330 64 342 C 64 354 72 364 84 364 C 92 364 96 358 96 350 C 96 346 92 344 90 344 Z"
            fill={statuses.kidney.status === "normal" ? "transparent" : stateColor[statuses.kidney.status]}
            fillOpacity="0.25"
            stroke={stateColor[statuses.kidney.status]}
            strokeWidth="1.5"
          />
          {/* Right Kidney */}
          <path
            d="M 178 318 C 190 318 196 330 196 342 C 196 354 188 364 176 364 C 168 364 164 358 164 350 C 164 346 168 344 170 344 Z"
            fill={statuses.kidney.status === "normal" ? "transparent" : stateColor[statuses.kidney.status]}
            fillOpacity="0.25"
            stroke={stateColor[statuses.kidney.status]}
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  );
}
