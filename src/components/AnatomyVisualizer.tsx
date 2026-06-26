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
        viewBox="0 0 260 480"
        xmlns="http://www.w3.org/2000/svg"
        style={{ backgroundColor: "transparent" }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#f0fdfa" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ccfbf1" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="lungGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#99f6e4" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
          <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id="liverGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b45309" />
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

        {/* Body silhouette — refined head, neck, shoulders, torso */}
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
          fill="url(#bodyGrad)"
          stroke="rgba(13, 148, 136, 0.4)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Head detail — subtle face guide */}
        <circle cx="130" cy="52" r="1.6" fill="rgba(13, 148, 136, 0.3)" />
        <circle cx="130" cy="52" r="14" fill="none" stroke="rgba(13, 148, 136, 0.12)" strokeWidth="1" />

        {/* Collarbone */}
        <path d="M 74 118 Q 130 108 186 118" fill="none" stroke="rgba(13, 148, 136, 0.2)" strokeWidth="1.5" strokeLinecap="round" />
        {/* Sternum */}
        <path d="M 130 124 L 130 214" fill="none" stroke="rgba(13, 148, 136, 0.14)" strokeWidth="1.2" strokeDasharray="3 4" />
        {/* Rib hints */}
        <path d="M 70 150 Q 130 168 190 150" fill="none" stroke="rgba(13, 148, 136, 0.1)" strokeWidth="1" />
        <path d="M 66 180 Q 130 200 194 180" fill="none" stroke="rgba(13, 148, 136, 0.1)" strokeWidth="1" />
        <path d="M 64 210 Q 130 232 196 210" fill="none" stroke="rgba(13, 148, 136, 0.1)" strokeWidth="1" />

        {/* Lungs — anatomical lobed shape */}
        <g className="organ organ-base">
          {/* Left lung */}
          <path
            d="M 100 132
               C 86 132 76 144 74 162
               C 72 186 80 214 94 226
               C 104 232 112 226 114 214
               C 116 196 116 156 114 142
               C 113 134 108 132 100 132 Z"
            fill="url(#lungGrad)"
            stroke="rgba(13, 148, 136, 0.5)"
            strokeWidth="1.2"
          />
          {/* Left lung lobe fissure */}
          <path d="M 86 178 Q 100 188 110 200" fill="none" stroke="rgba(13, 148, 136, 0.3)" strokeWidth="1" />
          {/* Right lung */}
          <path
            d="M 160 132
               C 174 132 184 144 186 162
               C 188 186 180 214 166 226
               C 156 232 148 226 146 214
               C 144 196 144 156 146 142
               C 147 134 152 132 160 132 Z"
            fill="url(#lungGrad)"
            stroke="rgba(13, 148, 136, 0.5)"
            strokeWidth="1.2"
          />
          {/* Right lung lobe fissure */}
          <path d="M 174 178 Q 160 188 150 200" fill="none" stroke="rgba(13, 148, 136, 0.3)" strokeWidth="1" />
        </g>

        {/* Heart — anatomical shape with aorta nub */}
        <g className={`organ organ-base ${stateClass[statuses.heart.status]}`}>
          {statuses.heart.status !== "normal" && (
            <circle
              cx="130"
              cy="178"
              r="28"
              fill={statuses.heart.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"}
              className="halo halo-on"
            />
          )}
          {/* Aorta arch hint */}
          <path d="M 130 156 C 128 148 134 144 138 148" fill="none" stroke="rgba(190, 24, 93, 0.45)" strokeWidth="2" strokeLinecap="round" />
          {/* Heart body */}
          <path
            d="M 130 158
               C 122 148 104 150 100 166
               C 96 184 114 200 130 210
               C 146 200 164 184 160 166
               C 156 150 138 148 130 158 Z"
            fill="url(#heartGrad)"
            stroke="rgba(190, 24, 93, 0.45)"
            strokeWidth="1.2"
          />
          {/* Ventricle line */}
          <path d="M 130 168 L 130 206" fill="none" stroke="rgba(190, 24, 93, 0.3)" strokeWidth="1.2" />
        </g>

        {/* Liver — anatomical with distinct lobes */}
        <g className={`organ organ-base ${stateClass[statuses.liver.status]}`}>
          {statuses.liver.status !== "normal" && (
            <ellipse
              cx="108"
              cy="258"
              rx="38"
              ry="18"
              fill={statuses.liver.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"}
              className="halo halo-on"
            />
          )}
          <path
            d="M 68 246
               C 84 238 128 238 148 248
               C 156 252 154 264 144 268
               C 128 274 92 274 74 268
               C 64 264 62 252 68 246 Z"
            fill="url(#liverGrad)"
            stroke="rgba(120, 53, 15, 0.45)"
            strokeWidth="1.2"
          />
          {/* Lobe division */}
          <path d="M 108 240 L 108 270" fill="none" stroke="rgba(120, 53, 15, 0.3)" strokeWidth="1.2" />
          {/* Gallbladder hint */}
          <ellipse cx="120" cy="270" rx="4" ry="6" fill="rgba(120, 53, 15, 0.35)" />
        </g>

        {/* Pancreas — elongated tapered shape */}
        <g className={`organ organ-base ${stateClass[statuses.pancreas.status]}`}>
          {statuses.pancreas.status !== "normal" && (
            <ellipse
              cx="130"
              cy="294"
              rx="34"
              ry="13"
              fill={statuses.pancreas.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"}
              className="halo halo-on"
            />
          )}
          <path
            d="M 96 288
               C 112 284 138 286 152 292
               C 158 295 160 300 156 304
               C 144 310 116 310 98 304
               C 90 301 88 292 96 288 Z"
            fill="url(#pancreasGrad)"
            stroke="rgba(180, 83, 9, 0.45)"
            strokeWidth="1.2"
          />
          {/* Duct hint */}
          <path d="M 100 296 Q 130 300 152 298" fill="none" stroke="rgba(180, 83, 9, 0.3)" strokeWidth="1" />
        </g>

        {/* Kidneys — bean-shaped, mirrored */}
        <g className={`organ organ-base ${stateClass[statuses.kidney.status]}`}>
          {statuses.kidney.status !== "normal" && (
            <>
              <circle cx="92" cy="338" r="20" fill={statuses.kidney.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"} className="halo halo-on" />
              <circle cx="168" cy="338" r="20" fill={statuses.kidney.status === "abnormal" ? "url(#glowCrit)" : "url(#glowWarn)"} className="halo halo-on" />
            </>
          )}
          {/* Left kidney */}
          <path
            d="M 82 318
               C 70 318 64 330 64 342
               C 64 354 72 364 84 364
               C 92 364 96 358 96 350
               C 96 346 92 344 90 344
               C 88 344 86 342 86 340
               C 86 336 88 334 90 334
               C 92 334 94 332 94 330
               C 94 324 90 318 82 318 Z"
            fill="url(#kidneyGrad)"
            stroke="rgba(153, 27, 27, 0.4)"
            strokeWidth="1.2"
          />
          {/* Right kidney (mirrored) */}
          <path
            d="M 178 318
               C 190 318 196 330 196 342
               C 196 354 188 364 176 364
               C 168 364 164 358 164 350
               C 164 346 168 344 170 344
               C 172 344 174 342 174 340
               C 174 336 172 334 170 334
               C 168 334 166 332 166 330
               C 166 324 170 318 178 318 Z"
            fill="url(#kidneyGrad)"
            stroke="rgba(153, 27, 27, 0.4)"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  );
}
