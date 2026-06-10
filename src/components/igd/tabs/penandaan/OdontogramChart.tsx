"use client";

// Odontogram FDI 32 gigi — tetap chart 2D (standar klinis), dengan pin anotasi koordinat-%.

import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SEV, type Anotasi } from "./penandaanShared";

// ── SVG chart ─────────────────────────────────────────────

function GigiSVG() {
  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
  const STEP = 21;
  const TW = 19;
  const startX = 10;
  const upperY = 56;
  const lowerY = 117;
  const boxH = 42;
  const midX = startX + 8 * STEP - 0.5;

  const tx = (i: number) => startX + i * STEP;
  const tcx = (i: number) => tx(i) + TW / 2;

  const toothType = (n: number) => {
    const d = n % 10;
    if (d >= 6) return "molar";
    if (d >= 4) return "premolar";
    if (d === 3) return "canine";
    return "incisor";
  };

  return (
    <svg
      viewBox="0 0 356 215"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <rect width="356" height="215" rx="8" fill="#f8fafc" />

      <text x="93" y="19" textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#8896b3">
        Q1 · KANAN ATAS
      </text>
      <text x="263" y="19" textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#8896b3">
        Q2 · KIRI ATAS
      </text>
      <text x="93" y="207" textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#8896b3">
        Q4 · KANAN BAWAH
      </text>
      <text x="263" y="207" textAnchor="middle" fontSize={7.5} fontWeight="700" fill="#8896b3">
        Q3 · KIRI BAWAH
      </text>

      <line
        x1={midX}
        y1="30"
        x2={midX}
        y2="185"
        stroke="#6b7fa8"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.45"
      />

      <rect
        x={startX - 3}
        y={upperY - 3}
        width="340"
        height={boxH + 6}
        rx="4"
        fill="none"
        stroke="#8896b3"
        strokeWidth="0.6"
        opacity="0.22"
      />
      <rect
        x={startX - 3}
        y={lowerY - 3}
        width="340"
        height={boxH + 6}
        rx="4"
        fill="none"
        stroke="#8896b3"
        strokeWidth="0.6"
        opacity="0.22"
      />

      {upperTeeth.map((num, i) => {
        const x = tx(i);
        const cx = tcx(i);
        const t = toothType(num);
        return (
          <g key={`u${num}`}>
            <rect x={x} y={upperY} width={TW} height={boxH} rx="2.5" fill="#dde3ef" stroke="#8896b3" strokeWidth="0.9" />
            {t === "molar" &&
              ([4, 10, 16] as number[]).map((ox, ki) => (
                <circle key={ki} cx={x + ox} cy={upperY + boxH - 6} r="1.7" fill="#8896b3" opacity="0.38" />
              ))}
            {t === "premolar" &&
              ([6, 13] as number[]).map((ox, ki) => (
                <circle key={ki} cx={x + ox} cy={upperY + boxH - 6} r="1.7" fill="#8896b3" opacity="0.38" />
              ))}
            {t === "canine" && (
              <path
                d={`M${cx} ${upperY + boxH - 10} L${x + 4} ${upperY + boxH - 2} L${x + 16} ${upperY + boxH - 2} Z`}
                fill="#8896b3"
                opacity="0.28"
              />
            )}
            {t === "incisor" && (
              <line
                x1={x + 4}
                y1={upperY + boxH - 5}
                x2={x + 16}
                y2={upperY + boxH - 5}
                stroke="#8896b3"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.38"
              />
            )}
            <text x={cx} y={upperY - 5} textAnchor="middle" fontSize={7} fontWeight="600" fill="#6b7fa8">
              {num}
            </text>
          </g>
        );
      })}

      {lowerTeeth.map((num, i) => {
        const x = tx(i);
        const cx = tcx(i);
        const t = toothType(num);
        return (
          <g key={`l${num}`}>
            <rect x={x} y={lowerY} width={TW} height={boxH} rx="2.5" fill="#dde3ef" stroke="#8896b3" strokeWidth="0.9" />
            {t === "molar" &&
              ([4, 10, 16] as number[]).map((ox, ki) => (
                <circle key={ki} cx={x + ox} cy={lowerY + 6} r="1.7" fill="#8896b3" opacity="0.38" />
              ))}
            {t === "premolar" &&
              ([6, 13] as number[]).map((ox, ki) => (
                <circle key={ki} cx={x + ox} cy={lowerY + 6} r="1.7" fill="#8896b3" opacity="0.38" />
              ))}
            {t === "canine" && (
              <path
                d={`M${cx} ${lowerY + 10} L${x + 4} ${lowerY + 2} L${x + 16} ${lowerY + 2} Z`}
                fill="#8896b3"
                opacity="0.28"
              />
            )}
            {t === "incisor" && (
              <line
                x1={x + 4}
                y1={lowerY + 5}
                x2={x + 16}
                y2={lowerY + 5}
                stroke="#8896b3"
                strokeWidth="1.4"
                strokeLinecap="round"
                opacity="0.38"
              />
            )}
            <text x={cx} y={lowerY + boxH + 12} textAnchor="middle" fontSize={7} fontWeight="600" fill="#6b7fa8">
              {num}
            </text>
          </g>
        );
      })}

      <rect x={midX - 18} y={upperY + boxH + 5} width="37" height="11" rx="3" fill="white" opacity="0.85" />
      <text
        x={midX}
        y={upperY + boxH + 13}
        textAnchor="middle"
        fontSize={6}
        fontWeight="600"
        fill="#8896b3"
        opacity="0.65"
      >
        MIDLINE
      </text>
    </svg>
  );
}

// ── Pin 2D ────────────────────────────────────────────────

function PinMarker2D({
  anotasi,
  displayIdx,
  selected,
  onClick,
}: {
  anotasi: Anotasi;
  displayIdx: number;
  selected: boolean;
  onClick: () => void;
}) {
  const c = SEV[anotasi.severitas];
  if (!anotasi.koordinat2d) return null;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        left: `${anotasi.koordinat2d.x}%`,
        top: `${anotasi.koordinat2d.y}%`,
      }}
      className="group absolute z-10 -translate-x-1/2 -translate-y-full"
      aria-label={`Anotasi ${displayIdx + 1}: ${anotasi.label}`}
    >
      <div
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-semibold text-white shadow-lg opacity-0 transition-all duration-150 group-hover:opacity-100",
          c.pinBg,
        )}
      >
        {anotasi.label}
      </div>
      <motion.div
        initial={{ scale: 0, y: -8 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className={cn(
          "relative flex h-6 w-6 items-center justify-center rounded-full shadow-md ring-2 ring-white transition-all duration-150",
          c.pinBg,
          selected ? "scale-125 ring-offset-1" : "hover:scale-110",
        )}
      >
        <span className="text-[9px] font-bold text-white leading-none">
          {displayIdx + 1}
        </span>
        {selected && (
          <span className={cn("absolute -inset-1.5 rounded-full opacity-20 animate-ping", c.pinBg)} />
        )}
      </motion.div>
      <div className={cn("mx-auto mt-px h-2 w-0.5 rounded-full opacity-70", c.pinBg)} />
    </button>
  );
}

function GhostPin2D({ koordinat }: { koordinat: { x: number; y: number } }) {
  return (
    <div
      style={{ left: `${koordinat.x}%`, top: `${koordinat.y}%` }}
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
    >
      <div className="flex h-6 w-6 animate-bounce items-center justify-center rounded-full bg-indigo-600 shadow-md ring-2 ring-white ring-offset-1">
        <Plus size={13} className="text-white" />
      </div>
      <div className="mx-auto mt-px h-2 w-0.5 rounded-full bg-indigo-600 opacity-80" />
    </div>
  );
}

// ── Kanvas odontogram ─────────────────────────────────────

export interface OdontogramCanvasProps {
  markers: Anotasi[];
  pending: { x: number; y: number } | null;
  selectedId: string | null;
  onPick: (koordinat: { x: number; y: number }) => void;
  onSelectMarker: (id: string) => void;
}

export default function OdontogramCanvas({
  markers,
  pending,
  selectedId,
  onPick,
  onSelectMarker,
}: OdontogramCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (pending) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
      onPick({ x, y });
    },
    [pending, onPick],
  );

  return (
    <div className="flex items-center justify-center bg-slate-50/40 p-4">
      <div
        ref={canvasRef}
        onClick={handleClick}
        className={cn(
          "relative aspect-[356/215] w-full max-w-130 select-none overflow-visible rounded-lg transition-all duration-150",
          pending
            ? "cursor-crosshair ring-2 ring-indigo-300 ring-offset-2"
            : "cursor-pointer hover:ring-1 hover:ring-indigo-200 hover:ring-offset-1",
        )}
      >
        <GigiSVG />

        <AnimatePresence>
          {markers.map((a, i) => (
            <PinMarker2D
              key={a.id}
              anotasi={a}
              displayIdx={i}
              selected={selectedId === a.id}
              onClick={() => onSelectMarker(a.id)}
            />
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {pending && <GhostPin2D key="ghost" koordinat={pending} />}
        </AnimatePresence>

        {markers.length === 0 && !pending && (
          <div className="pointer-events-none absolute inset-x-0 -bottom-1 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 shadow-sm">
              <MapPin size={10} className="text-indigo-400" />
              <span className="text-[9px] font-medium text-indigo-600">
                Klik chart untuk menandai
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
