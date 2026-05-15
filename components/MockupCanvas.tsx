"use client";

import { useState, useRef } from "react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type ElementType =
  | "balloon"
  | "cluster"
  | "arch"
  | "arch-half"
  | "column"
  | "garland"
  | "organic";

export type Background = "white" | "grey" | "brick" | "sky";

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  scale: number;
  colors: string[]; // hex colors, cycled per balloon
}

export const CANVAS_W = 1200;
export const CANVAS_H = 700;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function lightenHex(hex: string, amount = 60): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function darkenHex(hex: string, amount = 40): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/* ─── Balloon positions per element type (relative to anchor 0,0) ───────── */

interface BalloonPos {
  cx: number;
  cy: number;
  r: number;
  colorIdx: number;
  strLen?: number; // string length override
}

export function getElementBalloons(type: ElementType, scale: number = 1): BalloonPos[] {
  const s = scale;

  switch (type) {
    case "balloon":
      return [{ cx: 0, cy: -44 * s, r: 38 * s, colorIdx: 0, strLen: 32 }];

    case "cluster":
      return [
        { cx: -54 * s, cy: -18 * s, r: 30 * s, colorIdx: 0, strLen: 28 },
        { cx: -22 * s, cy: -62 * s, r: 36 * s, colorIdx: 1, strLen: 22 },
        { cx: 12 * s, cy: -84 * s, r: 40 * s, colorIdx: 0, strLen: 20 },
        { cx: 48 * s, cy: -60 * s, r: 34 * s, colorIdx: 2, strLen: 24 },
        { cx: 78 * s, cy: -16 * s, r: 28 * s, colorIdx: 1, strLen: 30 },
      ];

    case "arch": {
      const n = 24;
      const rx = 280 * s;
      const ry = 330 * s;
      return Array.from({ length: n }, (_, i) => {
        const t = Math.PI - (i / (n - 1)) * Math.PI;
        return {
          cx: rx * Math.cos(t),
          cy: -ry * Math.sin(t),
          r: [30, 23, 19, 15][i % 4] * s,
          colorIdx: i % 3,
        };
      });
    }

    case "arch-half": {
      const n = 14;
      const rx = 260 * s;
      const ry = 360 * s;
      return Array.from({ length: n }, (_, i) => {
        const t = Math.PI - (i / (n - 1)) * (Math.PI * 0.55);
        return {
          cx: rx * Math.cos(t),
          cy: -ry * Math.sin(t),
          r: [30, 23, 19, 16][i % 4] * s,
          colorIdx: i % 3,
        };
      });
    }

    case "column": {
      const n = 8;
      return Array.from({ length: n }, (_, i) => ({
        cx: (i % 2 === 0 ? -7 : 9) * s,
        cy: -(52 + i * 66) * s,
        r: (44 - i * 1.5) * s,
        colorIdx: i % 2,
      }));
    }

    case "garland": {
      const n = 16;
      return Array.from({ length: n }, (_, i) => ({
        cx: (i - 7.5) * 46 * s,
        cy: (-28 + Math.sin(i * 0.85) * 20) * s,
        r: [24, 19, 28, 21][i % 4] * s,
        colorIdx: i % 3,
      }));
    }

    case "organic": {
      const positions: [number, number, number, number][] = [
        [-80, -30, 34, 0], [-40, -72, 40, 1], [0, -90, 44, 2],
        [44, -68, 38, 0], [82, -26, 32, 1],
        [-60, -110, 28, 2], [-18, -128, 33, 0], [24, -124, 36, 1],
        [60, -108, 28, 2],
      ];
      return positions.map(([cx, cy, r, colorIdx]) => ({
        cx: cx * s, cy: cy * s, r: r * s, colorIdx,
      }));
    }

    default:
      return [];
  }
}

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface MockupCanvasProps {
  elements: CanvasElement[];
  background: Background;
  selectedElementId: string | null;
  onElementSelect: (id: string | null) => void;
  onElementMove: (id: string, x: number, y: number) => void;
  onDropNew: (type: ElementType, x: number, y: number) => void;
  isDraggingFromLibrary: boolean;
  showGrid?: boolean;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function MockupCanvas({
  elements,
  background,
  selectedElementId,
  onElementSelect,
  onElementMove,
  onDropNew,
  isDraggingFromLibrary,
  showGrid = false,
}: MockupCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<{
    elementId: string;
    startMx: number;
    startMy: number;
    startEx: number;
    startEy: number;
  } | null>(null);

  const [livePos, setLivePos] = useState<{ id: string; x: number; y: number } | null>(null);

  const toSvg = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (CANVAS_W / rect.width),
      y: (clientY - rect.top) * (CANVAS_H / rect.height),
    };
  };

  const handleElementMouseDown = (
    e: React.MouseEvent,
    id: string,
    ex: number,
    ey: number
  ) => {
    e.stopPropagation();
    onElementSelect(id);
    const { x, y } = toSvg(e.clientX, e.clientY);
    dragRef.current = { elementId: id, startMx: x, startMy: y, startEx: ex, startEy: ey };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    const { x, y } = toSvg(e.clientX, e.clientY);
    const dx = x - dragRef.current.startMx;
    const dy = y - dragRef.current.startMy;
    setLivePos({
      id: dragRef.current.elementId,
      x: dragRef.current.startEx + dx,
      y: dragRef.current.startEy + dy,
    });
  };

  const handleMouseUp = () => {
    if (dragRef.current && livePos?.id === dragRef.current.elementId) {
      onElementMove(livePos.id, livePos.x, livePos.y);
    }
    dragRef.current = null;
    setLivePos(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("elementType") as ElementType;
    if (!type) return;
    const { x, y } = toSvg(e.clientX, e.clientY);
    onDropNew(type, x, y);
  };

  // Collect unique colors for gradient defs
  const uniqueColors = new Set<string>();
  elements.forEach((el) => el.colors.forEach((c) => uniqueColors.add(c)));
  const gradId = (hex: string) => `mc_${hex.replace("#", "")}`;

  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: isDraggingFromLibrary
          ? "0 0 0 3px #F05000, 0 24px 80px rgba(0,0,0,0.4)"
          : "0 24px 80px rgba(0,0,0,0.38), 0 4px 16px rgba(0,0,0,0.18)",
        transition: "box-shadow 0.15s",
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
        style={{ width: "100%", display: "block", cursor: dragRef.current ? "grabbing" : "default" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (e.target === svgRef.current) onElementSelect(null);
        }}
      >
        <defs>
          {/* Per-color radial gradients for 3D glossy look */}
          {Array.from(uniqueColors).map((hex) => (
            <radialGradient key={hex} id={gradId(hex)} cx="36%" cy="27%" r="72%">
              <stop offset="0%"   stopColor={lightenHex(hex, 90)} stopOpacity="1" />
              <stop offset="22%"  stopColor={lightenHex(hex, 44)} stopOpacity="1" />
              <stop offset="65%"  stopColor={hex}                 stopOpacity="1" />
              <stop offset="100%" stopColor={darkenHex(hex, 40)}  stopOpacity="0.88" />
            </radialGradient>
          ))}
          {/* Unset (no color assigned) */}
          <radialGradient id="mc_unset" cx="36%" cy="27%" r="72%">
            <stop offset="0%"   stopColor="#FAFAF8" />
            <stop offset="22%"  stopColor="#F0ECE8" />
            <stop offset="65%"  stopColor="#E0D8D0" />
            <stop offset="100%" stopColor="#C8C0B8" stopOpacity="0.88" />
          </radialGradient>
          {/* Filters */}
          <filter id="mc-shadow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
          <filter id="mc-highlight" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
          <filter id="mc-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* ── SCENE BACKGROUND ─────────────────────────────────────────── */}
        {background === "white" && (
          <g>
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="#F8F7F5" />
            <rect x="0" y="0" width={CANVAS_W} height="38" fill="#EDE9E4" />
            <rect x="0" y="36" width={CANVAS_W} height="5" fill="rgba(0,0,0,0.04)" />
            <rect x="0" y="654" width={CANVAS_W} height="18" fill="#E2DDD7" />
            <rect x="0" y="672" width={CANVAS_W} height="28" fill="#D8D3CB" />
            <line x1="0" y1="654" x2={CANVAS_W} y2="654" stroke="rgba(0,0,0,0.07)" strokeWidth="1.5" />
          </g>
        )}
        {background === "grey" && (
          <g>
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="#E2DFDC" />
            <rect x="0" y="0" width={CANVAS_W} height="38" fill="#D4D0CB" />
            <rect x="0" y="36" width={CANVAS_W} height="5" fill="rgba(0,0,0,0.05)" />
            {[300, 600, 900].map((x) => (
              <line key={x} x1={x} y1="38" x2={x} y2="660" stroke="rgba(0,0,0,0.04)" strokeWidth="0.75" strokeDasharray="4 6" />
            ))}
            <rect x="0" y="660" width={CANVAS_W} height="16" fill="#C8C4BF" />
            <rect x="0" y="676" width={CANVAS_W} height="24" fill="#BFBBB6" />
            <line x1="0" y1="660" x2={CANVAS_W} y2="660" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
          </g>
        )}
        {background === "brick" && (
          <g>
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="#C09878" />
            {Array.from({ length: 22 }).map((_, row) => {
              const bw = 100, bh = 34, offset = row % 2 === 0 ? 0 : bw / 2;
              return Array.from({ length: 14 }).map((_, col) => (
                <rect
                  key={`br${row}-${col}`}
                  x={col * bw - offset - 1} y={row * bh + 2}
                  width={bw - 5} height={bh - 4}
                  fill={seededRandom(row * 19 + col * 3) > 0.55 ? "#A85A38" : seededRandom(row * 7 + col) > 0.4 ? "#B86444" : "#C07050"}
                  rx="2"
                />
              ));
            })}
            <rect x="0" y="665" width={CANVAS_W} height="35" fill="rgba(0,0,0,0.22)" />
          </g>
        )}
        {background === "sky" && (
          <g>
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="#C4D8ED" />
            <rect x="0" y="0" width={CANVAS_W} height="120" fill="#D4E8F6" />
            <rect x="0" y="120" width={CANVAS_W} height="120" fill="#C8DCED" />
            <rect x="0" y="524" width={CANVAS_W} height="40" fill="#EAE4D8" />
            <rect x="0" y="564" width={CANVAS_W} height="136" fill="#78A85C" />
            <rect x="0" y="564" width={CANVAS_W} height="22" fill="#8CBE6C" />
            {Array.from({ length: 70 }, (_, i) => (
              <ellipse key={`g${i}`} cx={i * 18 + 9} cy={564} rx={14 + seededRandom(i) * 5} ry={7 + seededRandom(i + 200) * 4} fill="#72A054" />
            ))}
            <ellipse cx="160" cy="68" rx="90" ry="34" fill="white" opacity="0.82" />
            <ellipse cx="215" cy="48" rx="65" ry="28" fill="white" opacity="0.72" />
            <ellipse cx="820" cy="80" rx="100" ry="36" fill="white" opacity="0.76" />
            <ellipse cx="880" cy="60" rx="72" ry="28" fill="white" opacity="0.66" />
            <ellipse cx="490" cy="42" rx="55" ry="20" fill="white" opacity="0.5" />
          </g>
        )}

        {/* Optional grid */}
        {showGrid && (
          <g>
            {Array.from({ length: 25 }, (_, i) => (
              <line key={`vg${i}`} x1={i * 50} y1="0" x2={i * 50} y2={CANVAS_H} stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 15 }, (_, i) => (
              <line key={`hg${i}`} x1="0" y1={i * 50} x2={CANVAS_W} y2={i * 50} stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
            ))}
          </g>
        )}

        {/* Empty state */}
        {elements.length === 0 && !isDraggingFromLibrary && (
          <g>
            <rect
              x={CANVAS_W / 2 - 220} y={CANVAS_H / 2 - 48}
              width={440} height={96}
              rx="14" fill="rgba(0,0,0,0.05)"
              stroke="rgba(0,0,0,0.08)" strokeWidth="1"
              strokeDasharray="6 4"
            />
            <text x={CANVAS_W / 2} y={CANVAS_H / 2 - 8} textAnchor="middle" fontSize="14" fill="rgba(0,0,0,0.35)" fontFamily="DM Sans, sans-serif" fontWeight="600">
              Drag an arrangement from the left panel
            </text>
            <text x={CANVAS_W / 2} y={CANVAS_H / 2 + 16} textAnchor="middle" fontSize="12" fill="rgba(0,0,0,0.22)" fontFamily="DM Sans, sans-serif">
              Build arches, columns, garlands and more
            </text>
          </g>
        )}

        {/* Drop hint overlay */}
        {isDraggingFromLibrary && (
          <>
            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="#F05000" opacity="0.06" rx="10" />
            <text x={CANVAS_W / 2} y={CANVAS_H / 2} textAnchor="middle" fontSize="16" fill="#F05000" opacity="0.85" fontFamily="DM Sans, sans-serif" fontWeight="700">
              Drop to place
            </text>
          </>
        )}

        {/* ── PLACED ELEMENTS ──────────────────────────────────────────── */}
        {elements.map((el) => {
          const pos = livePos?.id === el.id ? { x: livePos.x, y: livePos.y } : { x: el.x, y: el.y };
          const isSelected = selectedElementId === el.id;
          const balloons = getElementBalloons(el.type, el.scale);
          const isDraggingThis = dragRef.current?.elementId === el.id;

          return (
            <g
              key={el.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{ cursor: isDraggingThis ? "grabbing" : "grab" }}
              onMouseDown={(e) => handleElementMouseDown(e, el.id, el.x, el.y)}
            >
              {/* Selection glow behind all balloons */}
              {isSelected && (
                <g pointerEvents="none">
                  {balloons.map((b, bi) => (
                    <circle
                      key={`sg${bi}`}
                      cx={b.cx} cy={b.cy}
                      r={b.r + 12}
                      fill="#3B82F6"
                      opacity="0.14"
                      filter="url(#mc-glow)"
                    />
                  ))}
                </g>
              )}

              {/* Balloon bodies */}
              {balloons.map((b, bi) => {
                const hex = el.colors[b.colorIdx] ?? el.colors[0] ?? null;
                const fill = hex ? `url(#${gradId(hex)})` : "url(#mc_unset)";
                const strOffset = seededRandom(bi * 17) > 0.5 ? 5 : -5;
                const strLen = b.strLen ?? 24;

                return (
                  <g key={bi}>
                    {/* Drop shadow */}
                    <ellipse
                      cx={b.cx + 4} cy={b.cy + b.r * 0.78}
                      rx={b.r * 0.86} ry={b.r * 0.26}
                      fill="rgba(0,0,0,0.18)"
                      filter="url(#mc-shadow)"
                    />
                    {/* Body */}
                    <circle
                      cx={b.cx} cy={b.cy} r={b.r}
                      fill={fill}
                      stroke={isSelected ? "#3B82F6" : "rgba(0,0,0,0.07)"}
                      strokeWidth={isSelected ? "1.5" : "0.5"}
                    />
                    {/* Soft highlight */}
                    <ellipse
                      cx={b.cx - b.r * 0.27} cy={b.cy - b.r * 0.29}
                      rx={b.r * 0.34} ry={b.r * 0.22}
                      fill="rgba(255,255,255,0.62)"
                      filter="url(#mc-highlight)"
                    />
                    {/* Hard specular */}
                    <ellipse
                      cx={b.cx - b.r * 0.30} cy={b.cy - b.r * 0.32}
                      rx={b.r * 0.13} ry={b.r * 0.08}
                      fill="rgba(255,255,255,0.93)"
                    />
                    {/* Bounce light */}
                    <ellipse
                      cx={b.cx + b.r * 0.20} cy={b.cy + b.r * 0.44}
                      rx={b.r * 0.24} ry={b.r * 0.12}
                      fill="rgba(255,255,255,0.18)"
                    />
                    {/* Knot */}
                    <circle cx={b.cx} cy={b.cy + b.r + 2.5} r={2.5} fill={hex ?? "#B0A8A0"} opacity="0.8" />
                    {/* String (single balloons and clusters only) */}
                    {(el.type === "balloon" || el.type === "cluster") && (
                      <path
                        d={`M${b.cx},${b.cy + b.r + 4} Q${b.cx + strOffset},${b.cy + b.r + strLen * 0.5} ${b.cx + strOffset * 1.6},${b.cy + b.r + strLen}`}
                        stroke="rgba(0,0,0,0.15)"
                        strokeWidth="0.9"
                        fill="none"
                      />
                    )}
                  </g>
                );
              })}

              {/* Selection ring (on top) */}
              {isSelected && (
                <g pointerEvents="none">
                  {balloons.map((b, bi) => (
                    <circle
                      key={`sr${bi}`}
                      cx={b.cx} cy={b.cy}
                      r={b.r + 7}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      opacity="0.75"
                    />
                  ))}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
