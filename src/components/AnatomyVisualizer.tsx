import type { OrganStatuses } from "../lib/clinical";
import type { LabStatus } from "../lib/types";

interface Props {
  statuses: OrganStatuses;
}

const stateClass: Record<LabStatus, string> = {
  normal: "",
  warning: "state-warning",
  abnormal: "state-abnormal",
};

export default function AnatomyVisualizer({ statuses }: Props) {
  return (
    <div className="anatomy-stage">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 240 460"
        xmlns="http://www.w3.org/2000/svg"
        style={{ backgroundColor: "transparent" }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="50%" stopColor="#f0fdfa" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#ccfbf1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="lungGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
          <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="liverGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
          <linearGradient id="pancreasGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="kidneyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <radialGradient id="glowWarn" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glowCrit" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
        </defs>

        <style>{`
          .organ { transition: all 0.4s ease; transform-box: fill-box; transform-origin: center; }
          .organ-base { filter: drop-shadow(0 3px 6px rgba(13, 148, 136, 0.18)); }
          .state-warning { filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.75)); }
          .state-abnormal { filter: drop-shadow(0 0 14px rgba(239, 68, 68, 0.9)); }
          @keyframes softPulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }
          .halo { transform-box: fill-box; transform-origin: center; pointer-events: none; }
          .halo-on { animation: softPulse 1.8s ease-in-out infinite; }
        `}</style>

        {/* Head */}
        <ellipse cx="120" cy="34" rx="21" ry="25" fill="url(#bodyGrad)" stroke="rgba(13, 148, 136, 0.4)" strokeWidth="2" />

        {/* Neck + Torso (single clean symmetric path) */}
        <path
          d="M 110 60
             L 130 60
             C 132 64, 134 66, 138 68
             C 152 74, 164 84, 170 98
             C 175 110, 175 124, 173 140
             C 171 165, 169 195, 167 225
             C 165 255, 161 285, 155 310
             C 149 330, 139 344, 127 348
             L 113 348
             C 101 344, 91 330, 85 310
             C 79 285, 75 255, 73 225
             C 71 195, 69 165, 67 140
             C 65 124, 65 110, 70 98
             C 76 84, 88 74, 102 68
             C 106 66, 108 64, 110 60 Z"
          fill="url(#bodyGrad)"
          stroke="rgba(13, 148, 136, 0.4)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Shoulder line */}
        <path d="M 72 100 Q 120 90 168 100" fill="none" stroke="rgba(13, 148, 136, 0.18)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Collarbone */}
        <path d="M 82 112 Q 120 104 158 112" fill="none" stroke="rgba(13, 148, 136, 0.15)" strokeWidth="1.2" strokeLinecap="round" />
        {/* Sternum / spine center line */}
        <path d="M 120 116 L 120 340" fill="none" stroke="rgba(13, 148, 136, 0.12)" strokeWidth="1" strokeDasharray="3 4" />
        {/* Rib hints */}
        <path d="M 74 140 Q 120 156 166 140" fill="none" stroke="rgba(13, 148, 136, 0.1)" strokeWidth="1" />
        <path d="M 72 170 Q 120 188 168 170" fill="none" stroke="rgba(13, 148, 136, 0.1)" strokeWidth="1" />
        <path d="M 72 200 Q 120 220 168 200" fill="none" stroke="rgba(13, 148, 136, 0.1)" strokeWidth="1" />

        {/* Lungs — left (viewer's left) */}
        <g className="organ organ-base">
          <path
            d="M 82 118
               C 74 118, 68 128, 67 142
               C 66 165, 70 192, 78 212
               C 84 224, 92 226, 96 216
               C 100 202, 100 178, 99 156
               C 98 138, 96 122, 92 120
               C 89 118, 85 118, 82 118 Z"
            fill="url(#lungGrad)"
            stroke="rgba(13, 148, 136, 0.5)"
            strokeWidth="1.2"
          />
          <path d="M 78 180 Q 88 190 96 198" fill="none" stroke="rgba(13, 148, 136, 0.3)" strokeWidth="1" />
          {/* Lungs — right (viewer's right) */}
          <path
            d="M 158 118
               C 166 118, 172 128, 173 142
               C 174 165, 170 192, 162 212
               C 156 224, 148 226, 144 216
               C 140 202, 140 178, 141 156
               C 142 138, 144 122, 148 120
               C 151 118, 155 118, 158 118 Z"
            fill="url(#lungGrad)"
            stroke="rgba(13, 148, 136, 0.5)"
            strokeWidth="1.2"
          />
          <path d="M 162 180 Q 152 190 144 198" fill="none" stroke="rgba(13, 148, 136, 0.3)" strokeWidth="1" />
        </g>

        {/* Heart — centered, slightly tilted, between lungs */}
        <g className={`organ organ-base ${stateClass[statuses.heart.status]}`}>
          {statuses.heart.status !== "normal" && (
            <circle
              cx="120"
              cy="168"
              r="26"
              fill={statuses.heart.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"}
              className="halo halo-on"
            />
          )}
          {/* Aorta arch */}
          <path d="M 120 148 C 118 142, 124 138, 128 142" fill="none" stroke="rgba(190, 24, 93, 0.5)" strokeWidth="2" strokeLinecap="round" />
          {/* Heart body */}
          <path
            d="M 120 150
               C 113 142, 100 144, 96 156
               C 92 170, 106 184, 120 194
               C 134 184, 148 170, 144 156
               C 140 144, 127 142, 120 150 Z"
            fill="url(#heartGrad)"
            stroke="rgba(190, 24, 93, 0.45)"
            strokeWidth="1.2"
          />
          {/* Ventricle line */}
          <path d="M 120 158 L 120 190" fill="none" stroke="rgba(190, 24, 93, 0.3)" strokeWidth="1.2" />
        </g>

        {/* Liver — upper right abdomen, large wedge */}
        <g className={`organ organ-base ${stateClass[statuses.liver.status]}`}>
          {statuses.liver.status !== "normal" && (
            <ellipse
              cx="116"
              cy="244"
              rx="36"
              ry="16"
              fill={statuses.liver.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"}
              className="halo halo-on"
            />
          )}
          <path
            d="M 80 232
               C 96 226, 136 226, 154 234
               C 160 238, 158 248, 148 252
               C 132 258, 96 258, 84 252
               C 76 248, 74 236, 80 232 Z"
            fill="url(#liverGrad)"
            stroke="rgba(120, 53, 15, 0.45)"
            strokeWidth="1.2"
          />
          {/* Lobe division */}
          <path d="M 116 228 L 116 254" fill="none" stroke="rgba(120, 53, 15, 0.3)" strokeWidth="1.2" />
        </g>

        {/* Pancreas — elongated, behind/below liver */}
        <g className={`organ organ-base ${stateClass[statuses.pancreas.status]}`}>
          {statuses.pancreas.status !== "normal" && (
            <ellipse
              cx="120"
              cy="276"
              rx="32"
              ry="12"
              fill={statuses.pancreas.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"}
              className="halo halo-on"
            />
          )}
          <path
            d="M 90 270
               C 106 266, 134 268, 150 274
               C 154 276, 154 282, 148 284
               C 132 288, 106 288, 92 284
               C 86 282, 86 272, 90 270 Z"
            fill="url(#pancreasGrad)"
            stroke="rgba(180, 83, 9, 0.45)"
            strokeWidth="1.2"
          />
          <path d="M 96 278 Q 120 282 146 280" fill="none" stroke="rgba(180, 83, 9, 0.3)" strokeWidth="1" />
        </g>

        {/* Kidneys — bean-shaped, flanking the spine */}
        <g className={`organ organ-base ${stateClass[statuses.kidney.status]}`}>
          {statuses.kidney.status !== "normal" && (
            <>
              <circle cx="92" cy="312" r="18" fill={statuses.kidney.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"} className="halo halo-on" />
              <circle cx="148" cy="312" r="18" fill={statuses.kidney.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"} className="halo halo-on" />
            </>
          )}
          {/* Left kidney */}
          <path
            d="M 84 296
               C 74 296, 68 306, 68 316
               C 68 326, 74 334, 84 334
               C 90 334, 94 328, 94 322
               C 94 318, 90 316, 88 316
               C 86 316, 84 314, 84 312
               C 84 308, 86 306, 88 306
               C 90 306, 92 304, 92 302
               C 92 298, 88 296, 84 296 Z"
            fill="url(#kidneyGrad)"
            stroke="rgba(153, 27, 27, 0.4)"
            strokeWidth="1.2"
          />
          {/* Right kidney (mirrored) */}
          <path
            d="M 156 296
               C 166 296, 172 306, 172 316
               C 172 326, 166 334, 156 334
               C 150 334, 146 328, 146 322
               C 146 318, 150 316, 152 316
               C 154 316, 156 314, 156 312
               C 156 308, 154 306, 152 306
               C 150 306, 148 304, 148 302
               C 148 298, 152 296, 156 296 Z"
            fill="url(#kidneyGrad)"
            stroke="rgba(153, 27, 27, 0.4)"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  );
}
