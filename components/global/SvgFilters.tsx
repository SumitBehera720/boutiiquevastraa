"use client";

export default function SvgFilters() {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none">
      <defs>
        {/* Scalloped Rectangular Clip Path for Category/Trending Cards */}
        <clipPath id="card-scallop-clip" clipPathUnits="objectBoundingBox">
          <path d="M 0.15,0.02
                   C 0.25,-0.03 0.35,0.03 0.5,0.02
                   C 0.65,0.01 0.75,-0.03 0.85,0.02
                   C 0.96,0.06 1.03,0.15 0.98,0.25
                   C 1.03,0.35 0.97,0.45 0.98,0.5
                   C 0.99,0.55 1.03,0.65 0.98,0.75
                   C 1.03,0.85 0.96,0.94 0.85,0.98
                   C 0.75,1.03 0.65,0.97 0.5,0.98
                   C 0.35,0.99 0.25,1.03 0.15,0.98
                   C 0.04,0.94 -0.03,0.85 0.02,0.75
                   C -0.03,0.65 0.01,0.55 0.02,0.5
                   C 0.03,0.45 -0.03,0.35 0.02,0.25
                   C -0.03,0.15 0.04,0.06 0.15,0.02 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}
