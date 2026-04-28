"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  X,
  Save,
  Trash2,
  Plus,
  Eye,
  FileText,
  Layers,
  RotateCcw,
  Crosshair,
  CheckCircle2,
  ScanEye,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────

interface Koordinat {
  x: number;
  y: number;
}

type Severitas = "Normal" | "Ringan" | "Sedang" | "Berat" | "Trauma";

interface Anotasi {
  id: string;
  koordinat: Koordinat;
  label: string;
  deskripsi: string;
  severitas: Severitas;
  templateLabel: string;
  createdAt: string;
}

type TemplateId = "anterior" | "posterior" | "kepala" | "gigi";

interface TemplateDef {
  id: TemplateId;
  label: string;
  desc: string;
  viewBox: string;
  aspect: number; // height / width ratio
}

// ── Config ────────────────────────────────────────────────

const TEMPLATES: TemplateDef[] = [
  {
    id: "anterior",
    label: "Tubuh Depan",
    desc: "Tampak anterior",
    viewBox: "0 0 180 400",
    aspect: 400 / 180,
  },
  {
    id: "posterior",
    label: "Tubuh Belakang",
    desc: "Tampak posterior",
    viewBox: "0 0 180 400",
    aspect: 400 / 180,
  },
  {
    id: "kepala",
    label: "Kepala & Leher",
    desc: "Regio kepala / leher",
    viewBox: "0 0 180 280",
    aspect: 280 / 180,
  },
  {
    id: "gigi",
    label: "Gigi / Odontogram",
    desc: "FDI chart · 32 gigi",
    viewBox: "0 0 356 215",
    aspect: 215 / 356,
  },
];

const SEV: Record<
  Severitas,
  {
    bg: string;
    text: string;
    ring: string;
    dot: string;
    pinBg: string;
    pinText: string;
    border: string;
  }
> = {
  Normal: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
    dot: "bg-emerald-500",
    pinBg: "bg-emerald-500",
    pinText: "text-emerald-700",
    border: "border-emerald-200",
  },
  Ringan: {
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
    dot: "bg-sky-500",
    pinBg: "bg-sky-500",
    pinText: "text-sky-700",
    border: "border-sky-200",
  },
  Sedang: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    dot: "bg-amber-500",
    pinBg: "bg-amber-500",
    pinText: "text-amber-700",
    border: "border-amber-200",
  },
  Berat: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
    dot: "bg-rose-500",
    pinBg: "bg-rose-600",
    pinText: "text-rose-700",
    border: "border-rose-200",
  },
  Trauma: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    ring: "ring-orange-200",
    dot: "bg-orange-500",
    pinBg: "bg-orange-600",
    pinText: "text-orange-700",
    border: "border-orange-200",
  },
};

const SEV_ORDER: Severitas[] = [
  "Normal",
  "Ringan",
  "Sedang",
  "Berat",
  "Trauma",
];

// ── SVG body silhouettes ──────────────────────────────────

function AnteriorSVG() {
  return (
    <svg
      viewBox="0 0 180 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      {/* Head */}
      <ellipse
        cx="90"
        cy="38"
        rx="26"
        ry="30"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.4"
      />
      {/* Ear L */}
      <path
        d="M64 34 C58 34 55 39 55 44 C55 49 58 53 64 53"
        stroke="#8896b3"
        strokeWidth="1.2"
        fill="#dde3ef"
      />
      {/* Ear R */}
      <path
        d="M116 34 C122 34 125 39 125 44 C125 49 122 53 116 53"
        stroke="#8896b3"
        strokeWidth="1.2"
        fill="#dde3ef"
      />
      {/* Neck */}
      <rect
        x="80"
        y="66"
        width="20"
        height="20"
        rx="5"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.4"
      />
      {/* Shoulder line */}
      <path
        d="M56 90 C46 86 36 84 28 88 L28 104 C28 108 32 110 36 110 L60 108 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      <path
        d="M124 90 C134 86 144 84 152 88 L152 104 C152 108 148 110 144 110 L120 108 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Torso */}
      <path
        d="M56 86 L60 100 L52 200 C52 206 58 212 64 212 L116 212 C122 212 128 206 128 200 L120 100 L124 86 C116 82 104 80 90 80 C76 80 64 82 56 86 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.4"
      />
      {/* Left arm */}
      <path
        d="M56 92 C48 94 40 104 36 118 L30 170 C28 180 34 188 44 188 L54 188 C60 188 64 184 66 178 L70 120 C70 106 64 92 56 92 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Right arm */}
      <path
        d="M124 92 C132 94 140 104 144 118 L150 170 C152 180 146 188 136 188 L126 188 C120 188 116 184 114 178 L110 120 C110 106 116 92 124 92 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Left hand */}
      <ellipse
        cx="42"
        cy="196"
        rx="12"
        ry="14"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Right hand */}
      <ellipse
        cx="138"
        cy="196"
        rx="12"
        ry="14"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Left leg */}
      <path
        d="M66 212 L62 340 C60 352 66 362 76 362 L88 362 C94 360 96 354 96 346 L98 212 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Right leg */}
      <path
        d="M114 212 L118 340 C120 352 114 362 104 362 L92 362 C86 360 84 354 84 346 L82 212 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Left foot */}
      <ellipse
        cx="72"
        cy="370"
        rx="16"
        ry="9"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Right foot */}
      <ellipse
        cx="108"
        cy="370"
        rx="16"
        ry="9"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Facial features - eyes */}
      <ellipse
        cx="80"
        cy="36"
        rx="5"
        ry="4"
        fill="white"
        stroke="#8896b3"
        strokeWidth="0.8"
      />
      <ellipse cx="80" cy="36" rx="2.5" ry="2.5" fill="#8896b3" />
      <ellipse
        cx="100"
        cy="36"
        rx="5"
        ry="4"
        fill="white"
        stroke="#8896b3"
        strokeWidth="0.8"
      />
      <ellipse cx="100" cy="36" rx="2.5" ry="2.5" fill="#8896b3" />
      {/* Nose */}
      <path
        d="M88 42 L86 52 L90 54 L94 52 L92 42"
        stroke="#8896b3"
        strokeWidth="0.7"
        fill="none"
      />
      {/* Mouth */}
      <path
        d="M82 60 C86 64 94 64 98 60"
        stroke="#8896b3"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
      />
      {/* Clavicle */}
      <path
        d="M80 82 C74 78 64 78 56 82"
        stroke="#8896b3"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path
        d="M100 82 C106 78 116 78 124 82"
        stroke="#8896b3"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Midline */}
      <line
        x1="90"
        y1="84"
        x2="90"
        y2="210"
        stroke="#8896b3"
        strokeWidth="0.5"
        strokeDasharray="4 3"
        opacity="0.4"
      />
      {/* Belly button */}
      <circle
        cx="90"
        cy="170"
        r="2.5"
        fill="none"
        stroke="#8896b3"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Knee caps */}
      <ellipse
        cx="74"
        cy="300"
        rx="8"
        ry="6"
        fill="none"
        stroke="#8896b3"
        strokeWidth="0.7"
        opacity="0.4"
      />
      <ellipse
        cx="106"
        cy="300"
        rx="8"
        ry="6"
        fill="none"
        stroke="#8896b3"
        strokeWidth="0.7"
        opacity="0.4"
      />
    </svg>
  );
}

function PosteriorSVG() {
  return (
    <svg
      viewBox="0 0 180 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      {/* Head back */}
      <ellipse
        cx="90"
        cy="38"
        rx="26"
        ry="30"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.4"
      />
      {/* Ear L */}
      <path
        d="M64 34 C58 34 55 39 55 44 C55 49 58 53 64 53"
        stroke="#8896b3"
        strokeWidth="1.2"
        fill="#dde3ef"
      />
      {/* Ear R */}
      <path
        d="M116 34 C122 34 125 39 125 44 C125 49 122 53 116 53"
        stroke="#8896b3"
        strokeWidth="1.2"
        fill="#dde3ef"
      />
      {/* Neck */}
      <rect
        x="80"
        y="66"
        width="20"
        height="20"
        rx="5"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.4"
      />
      {/* Shoulders */}
      <path
        d="M56 90 C46 86 36 84 28 88 L28 104 C28 108 32 110 36 110 L60 108 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      <path
        d="M124 90 C134 86 144 84 152 88 L152 104 C152 108 148 110 144 110 L120 108 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Torso back */}
      <path
        d="M56 86 L60 100 L52 200 C52 206 58 212 64 212 L116 212 C122 212 128 206 128 200 L120 100 L124 86 C116 82 104 80 90 80 C76 80 64 82 56 86 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.4"
      />
      {/* Left arm */}
      <path
        d="M56 92 C48 94 40 104 36 118 L30 170 C28 180 34 188 44 188 L54 188 C60 188 64 184 66 178 L70 120 C70 106 64 92 56 92 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Right arm */}
      <path
        d="M124 92 C132 94 140 104 144 118 L150 170 C152 180 146 188 136 188 L126 188 C120 188 116 184 114 178 L110 120 C110 106 116 92 124 92 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Left hand */}
      <ellipse
        cx="42"
        cy="196"
        rx="12"
        ry="14"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Right hand */}
      <ellipse
        cx="138"
        cy="196"
        rx="12"
        ry="14"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Left leg */}
      <path
        d="M66 212 L62 340 C60 352 66 362 76 362 L88 362 C94 360 96 354 96 346 L98 212 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Right leg */}
      <path
        d="M114 212 L118 340 C120 352 114 362 104 362 L92 362 C86 360 84 354 84 346 L82 212 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Left foot (back shows heel) */}
      <ellipse
        cx="72"
        cy="370"
        rx="16"
        ry="9"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Right foot */}
      <ellipse
        cx="108"
        cy="370"
        rx="16"
        ry="9"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Spine */}
      <line
        x1="90"
        y1="84"
        x2="90"
        y2="210"
        stroke="#8896b3"
        strokeWidth="0.8"
        strokeDasharray="3 2"
        opacity="0.5"
      />
      {/* Scapulae */}
      <path
        d="M68 102 C62 106 60 118 64 128 C68 138 76 140 82 134 C88 128 88 116 84 108 Z"
        fill="none"
        stroke="#8896b3"
        strokeWidth="0.8"
        opacity="0.45"
      />
      <path
        d="M112 102 C118 106 120 118 116 128 C112 138 104 140 98 134 C92 128 92 116 96 108 Z"
        fill="none"
        stroke="#8896b3"
        strokeWidth="0.8"
        opacity="0.45"
      />
      {/* Gluteal crease */}
      <line
        x1="90"
        y1="210"
        x2="90"
        y2="226"
        stroke="#8896b3"
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* Knee back */}
      <ellipse
        cx="74"
        cy="300"
        rx="9"
        ry="7"
        fill="none"
        stroke="#8896b3"
        strokeWidth="0.7"
        opacity="0.4"
      />
      <ellipse
        cx="106"
        cy="300"
        rx="9"
        ry="7"
        fill="none"
        stroke="#8896b3"
        strokeWidth="0.7"
        opacity="0.4"
      />
      {/* Hair suggestion */}
      <path
        d="M64 18 C70 10 80 8 90 8 C100 8 110 10 116 18"
        stroke="#8896b3"
        strokeWidth="1.2"
        fill="none"
        opacity="0.3"
      />
    </svg>
  );
}

function HeadSVG() {
  return (
    <svg
      viewBox="0 0 180 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      {/* Head shape */}
      <path
        d="M90 10 C54 10 32 38 32 78 C32 114 44 140 60 158 L60 190 C60 200 68 208 78 208 L102 208 C112 208 120 200 120 190 L120 158 C136 140 148 114 148 78 C148 38 126 10 90 10 Z"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.4"
      />
      {/* Left ear */}
      <path
        d="M32 72 C22 72 16 80 16 90 C16 100 22 108 32 106"
        stroke="#8896b3"
        strokeWidth="1.2"
        fill="#dde3ef"
      />
      <path
        d="M26 80 C22 84 21 88 22 92 C23 96 25 99 28 100"
        stroke="#8896b3"
        strokeWidth="0.7"
        fill="none"
        opacity="0.5"
      />
      {/* Right ear */}
      <path
        d="M148 72 C158 72 164 80 164 90 C164 100 158 108 148 106"
        stroke="#8896b3"
        strokeWidth="1.2"
        fill="#dde3ef"
      />
      <path
        d="M154 80 C158 84 159 88 158 92 C157 96 155 99 152 100"
        stroke="#8896b3"
        strokeWidth="0.7"
        fill="none"
        opacity="0.5"
      />
      {/* Eyebrow L */}
      <path
        d="M56 64 C62 60 72 60 78 62"
        stroke="#8896b3"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Eyebrow R */}
      <path
        d="M102 62 C108 60 118 60 124 64"
        stroke="#8896b3"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* Eye L */}
      <ellipse
        cx="67"
        cy="80"
        rx="12"
        ry="9"
        fill="white"
        stroke="#8896b3"
        strokeWidth="1"
      />
      <ellipse cx="67" cy="80" rx="6" ry="6" fill="#c9d0e0" />
      <ellipse cx="67" cy="80" rx="3.5" ry="3.5" fill="#6b7fa8" />
      <ellipse cx="65" cy="78" rx="1.2" ry="1.2" fill="white" />
      {/* Eye R */}
      <ellipse
        cx="113"
        cy="80"
        rx="12"
        ry="9"
        fill="white"
        stroke="#8896b3"
        strokeWidth="1"
      />
      <ellipse cx="113" cy="80" rx="6" ry="6" fill="#c9d0e0" />
      <ellipse cx="113" cy="80" rx="3.5" ry="3.5" fill="#6b7fa8" />
      <ellipse cx="111" cy="78" rx="1.2" ry="1.2" fill="white" />
      {/* Nose */}
      <path
        d="M86 92 L80 118 C82 124 86 126 90 126 C94 126 98 124 100 118 L94 92 Z"
        stroke="#8896b3"
        strokeWidth="0.8"
        fill="#cdd5e4"
        opacity="0.6"
      />
      <path
        d="M80 120 C78 124 76 128 80 130 C84 130 88 126 90 126 C92 126 96 130 100 130 C104 128 102 124 100 120"
        stroke="#8896b3"
        strokeWidth="0.9"
        fill="none"
      />
      {/* Mouth */}
      <path
        d="M72 148 C78 143 84 141 90 141 C96 141 102 143 108 148"
        stroke="#8896b3"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M72 148 C78 154 84 157 90 157 C96 157 102 154 108 148"
        stroke="#8896b3"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Philtrum */}
      <line
        x1="90"
        y1="130"
        x2="90"
        y2="141"
        stroke="#8896b3"
        strokeWidth="0.6"
        opacity="0.4"
      />
      {/* Chin */}
      <path
        d="M72 185 C78 194 100 196 108 185"
        stroke="#8896b3"
        strokeWidth="0.7"
        fill="none"
        opacity="0.4"
      />
      {/* Neck */}
      <rect
        x="76"
        y="208"
        width="28"
        height="38"
        rx="6"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.4"
      />
      {/* Collar */}
      <path
        d="M60 240 C40 238 24 234 16 228 L16 248 C16 258 26 266 36 264 L76 262"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      <path
        d="M120 240 C140 238 156 234 164 228 L164 248 C164 258 154 266 144 264 L104 262"
        fill="#dde3ef"
        stroke="#8896b3"
        strokeWidth="1.2"
      />
      {/* Midline */}
      <line
        x1="90"
        y1="126"
        x2="90"
        y2="208"
        stroke="#8896b3"
        strokeWidth="0.4"
        strokeDasharray="3 3"
        opacity="0.3"
      />
    </svg>
  );
}

function GigiSVG() {
  const upperTeeth = [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  ];
  const lowerTeeth = [
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
  ];
  const STEP = 21; // tooth pitch
  const TW = 19; // tooth box width
  const startX = 10;
  const upperY = 56; // top of upper tooth boxes
  const lowerY = 117; // top of lower tooth boxes
  const boxH = 42; // tooth box height
  const midX = startX + 8 * STEP - 0.5; // = 177.5

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
      {/* Background */}
      <rect width="356" height="215" rx="8" fill="#f8fafc" />

      {/* Quadrant labels */}
      <text
        x="93"
        y="19"
        textAnchor="middle"
        fontSize={7.5}
        fontWeight="700"
        fill="#8896b3"
      >
        Q1 · KANAN ATAS
      </text>
      <text
        x="263"
        y="19"
        textAnchor="middle"
        fontSize={7.5}
        fontWeight="700"
        fill="#8896b3"
      >
        Q2 · KIRI ATAS
      </text>
      <text
        x="93"
        y="207"
        textAnchor="middle"
        fontSize={7.5}
        fontWeight="700"
        fill="#8896b3"
      >
        Q4 · KANAN BAWAH
      </text>
      <text
        x="263"
        y="207"
        textAnchor="middle"
        fontSize={7.5}
        fontWeight="700"
        fill="#8896b3"
      >
        Q3 · KIRI BAWAH
      </text>

      {/* Vertical midline */}
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

      {/* Arch border outlines */}
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

      {/* Upper teeth */}
      {upperTeeth.map((num, i) => {
        const x = tx(i);
        const cx = tcx(i);
        const t = toothType(num);
        return (
          <g key={`u${num}`}>
            <rect
              x={x}
              y={upperY}
              width={TW}
              height={boxH}
              rx="2.5"
              fill="#dde3ef"
              stroke="#8896b3"
              strokeWidth="0.9"
            />
            {t === "molar" &&
              ([4, 10, 16] as number[]).map((ox, ki) => (
                <circle
                  key={ki}
                  cx={x + ox}
                  cy={upperY + boxH - 6}
                  r="1.7"
                  fill="#8896b3"
                  opacity="0.38"
                />
              ))}
            {t === "premolar" &&
              ([6, 13] as number[]).map((ox, ki) => (
                <circle
                  key={ki}
                  cx={x + ox}
                  cy={upperY + boxH - 6}
                  r="1.7"
                  fill="#8896b3"
                  opacity="0.38"
                />
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
            <text
              x={cx}
              y={upperY - 5}
              textAnchor="middle"
              fontSize={7}
              fontWeight="600"
              fill="#6b7fa8"
            >
              {num}
            </text>
          </g>
        );
      })}

      {/* Lower teeth */}
      {lowerTeeth.map((num, i) => {
        const x = tx(i);
        const cx = tcx(i);
        const t = toothType(num);
        return (
          <g key={`l${num}`}>
            <rect
              x={x}
              y={lowerY}
              width={TW}
              height={boxH}
              rx="2.5"
              fill="#dde3ef"
              stroke="#8896b3"
              strokeWidth="0.9"
            />
            {t === "molar" &&
              ([4, 10, 16] as number[]).map((ox, ki) => (
                <circle
                  key={ki}
                  cx={x + ox}
                  cy={lowerY + 6}
                  r="1.7"
                  fill="#8896b3"
                  opacity="0.38"
                />
              ))}
            {t === "premolar" &&
              ([6, 13] as number[]).map((ox, ki) => (
                <circle
                  key={ki}
                  cx={x + ox}
                  cy={lowerY + 6}
                  r="1.7"
                  fill="#8896b3"
                  opacity="0.38"
                />
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
            <text
              x={cx}
              y={lowerY + boxH + 12}
              textAnchor="middle"
              fontSize={7}
              fontWeight="600"
              fill="#6b7fa8"
            >
              {num}
            </text>
          </g>
        );
      })}

      {/* Midline label badge */}
      <rect
        x={midX - 18}
        y={upperY + boxH + 5}
        width="37"
        height="11"
        rx="3"
        fill="white"
        opacity="0.85"
      />
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

// ── Pin marker on canvas ──────────────────────────────────

function PinMarker({
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
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        left: `${anotasi.koordinat.x}%`,
        top: `${anotasi.koordinat.y}%`,
      }}
      className="group absolute z-10 -translate-x-1/2 -translate-y-full"
      aria-label={`Anotasi ${displayIdx + 1}: ${anotasi.label}`}
    >
      {/* Tooltip */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-semibold text-white shadow-lg opacity-0 transition-all duration-150 group-hover:opacity-100",
          c.pinBg,
        )}
      >
        {anotasi.label}
      </div>

      {/* Pin head */}
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
          <span
            className={cn(
              "absolute -inset-1.5 rounded-full opacity-20 animate-ping",
              c.pinBg,
            )}
          />
        )}
      </motion.div>

      {/* Pin stem */}
      <div
        className={cn(
          "mx-auto mt-px h-2 w-0.5 rounded-full opacity-70",
          c.pinBg,
        )}
      />
    </button>
  );
}

// ── Pending ghost pin ─────────────────────────────────────

function GhostPin({ koordinat }: { koordinat: Koordinat }) {
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

// ── Annotation form ───────────────────────────────────────

interface AnotasiFormProps {
  onSave: (data: Pick<Anotasi, "label" | "deskripsi" | "severitas">) => void;
  onCancel: () => void;
  labelPlaceholder?: string;
}

function AnotasiForm({ onSave, onCancel, labelPlaceholder }: AnotasiFormProps) {
  const [label, setLabel] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [severitas, setSeveritas] = useState<Severitas>("Ringan");

  const canSave = label.trim().length > 0;

  const commit = () => {
    if (!canSave) return;
    onSave({ label: label.trim(), deskripsi: deskripsi.trim(), severitas });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="overflow-hidden rounded-xl border border-indigo-200 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-3 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600">
          <MapPin size={11} className="text-white" />
        </div>
        <p className="text-xs font-bold text-indigo-800">Anotasi Baru</p>
        <button
          onClick={onCancel}
          aria-label="Batal"
          className="ml-auto flex h-5 w-5 items-center justify-center rounded text-indigo-300 hover:bg-indigo-100 hover:text-indigo-600"
        >
          <X size={11} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-3">
        {/* Label */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-500">
            Label Lokasi <span className="text-rose-400">*</span>
          </label>
          <input
            autoFocus
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") onCancel();
            }}
            placeholder={
              labelPlaceholder ?? "mis. Dahi kanan, siku kiri, punggung bawah…"
            }
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Severitas */}
        <div>
          <label className="mb-1.5 block text-[10px] font-semibold text-slate-500">
            Severitas Temuan
          </label>
          <div className="flex flex-wrap gap-1">
            {SEV_ORDER.map((s) => {
              const c = SEV[s];
              const act = severitas === s;
              return (
                <button
                  key={s}
                  onClick={() => setSeveritas(s)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all duration-150",
                    act
                      ? cn("border-transparent ring-1", c.bg, c.text, c.ring)
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      act ? c.dot : "bg-slate-300",
                    )}
                  />
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keterangan */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold text-slate-500">
            Keterangan{" "}
            <span className="font-normal text-slate-400">(opsional)</span>
          </label>
          <textarea
            rows={2}
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            placeholder="Deskripsi klinis: ukuran, bentuk, warna, nyeri tekan, dll…"
            className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={commit}
            disabled={!canSave}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={11} /> Simpan Anotasi
          </button>
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          >
            Batal
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Annotation list item ──────────────────────────────────

function AnotasiItem({
  anotasi,
  displayIdx,
  selected,
  onSelect,
  onDelete,
}: {
  anotasi: Anotasi;
  displayIdx: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const c = SEV[anotasi.severitas];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.17 }}
      onClick={onSelect}
      className={cn(
        "group cursor-pointer rounded-xl border p-2.5 transition-all duration-150",
        selected
          ? "border-indigo-200 bg-indigo-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70",
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white",
            c.pinBg,
          )}
        >
          {displayIdx + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-semibold text-slate-800">
              {anotasi.label}
            </p>
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1",
                c.bg,
                c.text,
                c.ring,
              )}
            >
              {anotasi.severitas}
            </span>
          </div>
          {anotasi.deskripsi && (
            <p className="mt-0.5 line-clamp-1 text-[10px] leading-snug text-slate-500">
              {anotasi.deskripsi}
            </p>
          )}
          <p className="mt-0.5 text-[9px] text-slate-400">
            {anotasi.templateLabel} · {anotasi.createdAt}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Hapus anotasi"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Selected detail panel ─────────────────────────────────

function DetailPanel({
  anotasi,
  displayIdx,
  onClose,
}: {
  anotasi: Anotasi;
  displayIdx: number;
  onClose: () => void;
}) {
  const c = SEV[anotasi.severitas];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.17 }}
      className={cn(
        "overflow-hidden rounded-xl border shadow-sm",
        c.border,
        c.bg,
      )}
    >
      <div
        className={cn("flex items-center gap-2 border-b px-3 py-2", c.border)}
      >
        <div
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white",
            c.pinBg,
          )}
        >
          {displayIdx + 1}
        </div>
        <p className={cn("text-xs font-bold", c.text)}>{anotasi.label}</p>
        <span
          className={cn(
            "ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1",
            c.bg,
            c.text,
            c.ring,
          )}
        >
          {anotasi.severitas}
        </span>
        <button
          onClick={onClose}
          aria-label="Tutup detail"
          className="ml-auto flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:text-slate-600"
        >
          <X size={10} />
        </button>
      </div>
      <div className="px-3 py-2.5">
        {anotasi.deskripsi ? (
          <p className="text-[11px] leading-relaxed text-slate-700">
            {anotasi.deskripsi}
          </p>
        ) : (
          <p className="text-[10px] italic text-slate-400">
            Tidak ada keterangan tambahan.
          </p>
        )}
        <p className="mt-2 text-[9px] text-slate-400">
          {anotasi.templateLabel} · {anotasi.createdAt} · koordinat (
          {Math.round(anotasi.koordinat.x)}%, {Math.round(anotasi.koordinat.y)}
          %)
        </p>
      </div>
    </motion.div>
  );
}

// ── Save toast ────────────────────────────────────────────

function SaveToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 shadow-lg">
        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
        <p className="text-xs font-semibold text-emerald-800">
          Penandaan gambar berhasil disimpan
        </p>
        <button
          onClick={onDismiss}
          className="ml-2 text-emerald-400 hover:text-emerald-600"
        >
          <X size={11} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────

export default function PenandaanGambarTab({
  patient: _patient,
}: {
  patient: IGDPatientDetail;
}) {
  const [activeTemplateId, setActiveTemplateId] =
    useState<TemplateId>("anterior");
  const [anotasiList, setAnotasiList] = useState<Anotasi[]>([]);
  const [pending, setPending] = useState<Koordinat | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const template = TEMPLATES.find((t) => t.id === activeTemplateId)!;

  const onTemplateAnotasi = anotasiList.filter(
    (a) => a.templateLabel === template.label,
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (pending) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
      setPending({ x, y });
      setSelectedId(null);
    },
    [pending],
  );

  const handleSave = (
    data: Pick<Anotasi, "label" | "deskripsi" | "severitas">,
  ) => {
    if (!pending) return;
    const now = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const next: Anotasi = {
      id: `an-${Date.now()}`,
      koordinat: pending,
      templateLabel: template.label,
      createdAt: now,
      ...data,
    };
    setAnotasiList((prev) => [...prev, next]);
    setSelectedId(next.id);
    setPending(null);
  };

  const handleDelete = (id: string) => {
    setAnotasiList((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleReset = () => {
    setAnotasiList((prev) =>
      prev.filter((a) => a.templateLabel !== template.label),
    );
    setSelectedId(null);
  };

  const handleSaveAll = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const displayList = filterActive ? onTemplateAnotasi : anotasiList;
  const selectedAnotasi = selectedId
    ? (anotasiList.find((a) => a.id === selectedId) ?? null)
    : null;

  const sevCounts = SEV_ORDER.reduce<Partial<Record<Severitas, number>>>(
    (acc, s) => {
      const n = anotasiList.filter((a) => a.severitas === s).length;
      if (n > 0) acc[s] = n;
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col gap-3">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <ScanEye size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Penandaan Gambar</p>
          <p className="text-[10px] text-slate-400">
            Klik diagram untuk menandai lokasi temuan klinis
          </p>
        </div>

        {anotasiList.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            {/* Summary pills */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
              <MapPin size={10} className="text-indigo-400" />
              <span className="text-[10px] font-semibold text-slate-600">
                {anotasiList.length}
              </span>
            </div>
            {SEV_ORDER.filter((s) => sevCounts[s]).map((s) => {
              const c = SEV[s];
              return (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ring-1",
                    c.bg,
                    c.text,
                    c.ring,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
                  {sevCounts[s]}
                </span>
              );
            })}
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Save size={10} /> Simpan Semua
            </button>
          </div>
        )}
      </div>

      {/* ── Template tabs ── */}
      <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {TEMPLATES.map((t, i) => {
          const isAct = activeTemplateId === t.id;
          const cnt = anotasiList.filter(
            (a) => a.templateLabel === t.label,
          ).length;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTemplateId(t.id);
                setPending(null);
                setSelectedId(null);
              }}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-center transition-colors duration-150",
                i > 0 && "border-l border-slate-200",
                isAct
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700",
              )}
            >
              <span className="text-xs font-semibold">{t.label}</span>
              <span className="text-[9px] opacity-60">{t.desc}</span>
              {cnt > 0 && (
                <span
                  className={cn(
                    "absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white",
                    isAct ? "bg-indigo-600" : "bg-slate-400",
                  )}
                >
                  {cnt}
                </span>
              )}
              {isAct && (
                <motion.span
                  layoutId="tmpl-line"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main workspace ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        {/* ── Left: canvas ── */}
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            {/* Canvas toolbar */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Layers size={11} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-700">
                {template.label}
              </p>
              <span className="text-[10px] text-slate-400">
                — {template.desc}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                {onTemplateAnotasi.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-500 transition hover:bg-rose-100"
                  >
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-2 py-0.5",
                    pending
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-slate-200 bg-slate-50",
                  )}
                >
                  <Crosshair
                    size={9}
                    className={pending ? "text-indigo-500" : "text-slate-400"}
                  />
                  <span
                    className={cn(
                      "text-[9px]",
                      pending
                        ? "text-indigo-600 font-semibold"
                        : "text-slate-400",
                    )}
                  >
                    {pending ? "Pilih lokasi..." : "Klik untuk tandai"}
                  </span>
                </div>
              </div>
            </div>

            {/* SVG canvas */}
            <div className="flex items-center justify-center p-4 bg-slate-50/40">
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={cn(
                  "relative select-none overflow-visible rounded-lg transition-all duration-150",
                  pending
                    ? "cursor-crosshair ring-2 ring-indigo-300 ring-offset-2"
                    : "cursor-pointer hover:ring-1 hover:ring-indigo-200 hover:ring-offset-1",
                )}
                style={{
                  width:
                    activeTemplateId === "kepala"
                      ? 220
                      : activeTemplateId === "gigi"
                        ? 360
                        : 200,
                  height:
                    activeTemplateId === "kepala"
                      ? Math.round(220 * template.aspect)
                      : activeTemplateId === "gigi"
                        ? Math.round(360 * template.aspect)
                        : Math.round(200 * template.aspect),
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTemplateId}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="h-full w-full"
                  >
                    {activeTemplateId === "anterior" && <AnteriorSVG />}
                    {activeTemplateId === "posterior" && <PosteriorSVG />}
                    {activeTemplateId === "kepala" && <HeadSVG />}
                    {activeTemplateId === "gigi" && <GigiSVG />}
                  </motion.div>
                </AnimatePresence>

                {/* Placed pins */}
                <AnimatePresence>
                  {onTemplateAnotasi.map((a, i) => (
                    <PinMarker
                      key={a.id}
                      anotasi={a}
                      displayIdx={i}
                      selected={selectedId === a.id}
                      onClick={() =>
                        setSelectedId(a.id === selectedId ? null : a.id)
                      }
                    />
                  ))}
                </AnimatePresence>

                {/* Pending ghost */}
                <AnimatePresence>
                  {pending && <GhostPin key="ghost" koordinat={pending} />}
                </AnimatePresence>

                {/* Empty hint */}
                {onTemplateAnotasi.length === 0 && !pending && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                    <div className="flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 shadow-sm">
                      <MapPin size={10} className="text-indigo-400" />
                      <span className="text-[9px] font-medium text-indigo-600">
                        Klik untuk menandai
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Severitas:
              </span>
              {SEV_ORDER.map((s) => {
                const c = SEV[s];
                return (
                  <span key={s} className="flex items-center gap-1">
                    <span className={cn("h-2 w-2 rounded-full", c.pinBg)} />
                    <span className="text-[9px] text-slate-500">{s}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Right: form + list ── */}
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-95">
          {/* Annotation form */}
          <AnimatePresence>
            {pending && (
              <AnotasiForm
                key="anotasi-form"
                onSave={handleSave}
                onCancel={() => setPending(null)}
                labelPlaceholder={
                  activeTemplateId === "gigi"
                    ? "mis. Gigi 11, 16 karies, 36 fraktur…"
                    : undefined
                }
              />
            )}
          </AnimatePresence>

          {/* Detail panel for selected pin */}
          <AnimatePresence>
            {selectedAnotasi && !pending && (
              <DetailPanel
                key="detail"
                anotasi={selectedAnotasi}
                displayIdx={onTemplateAnotasi.indexOf(selectedAnotasi)}
                onClose={() => setSelectedId(null)}
              />
            )}
          </AnimatePresence>

          {/* Annotation list */}
          {anotasiList.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              {/* List header */}
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                <FileText size={11} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">
                  Daftar Anotasi
                </p>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                  {displayList.length}
                </span>
                <button
                  onClick={() => setFilterActive((v) => !v)}
                  className={cn(
                    "ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold transition",
                    filterActive
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  <Eye size={9} />
                  {filterActive ? template.label : "Semua"}
                </button>
              </div>

              {/* List body */}
              <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto p-2">
                <AnimatePresence initial={false}>
                  {displayList.length === 0 ? (
                    <p className="py-5 text-center text-[10px] text-slate-400">
                      Belum ada anotasi pada {template.label}
                    </p>
                  ) : (
                    displayList.map((a, i) => (
                      <AnotasiItem
                        key={a.id}
                        anotasi={a}
                        displayIdx={
                          filterActive ? i : onTemplateAnotasi.indexOf(a)
                        }
                        selected={selectedId === a.id}
                        onSelect={() =>
                          setSelectedId(a.id === selectedId ? null : a.id)
                        }
                        onDelete={() => handleDelete(a.id)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            !pending && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200">
                  <MapPin size={20} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Belum ada anotasi
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
                    Pilih template lalu klik pada
                    <br />
                    diagram untuk menandai lokasi
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <Crosshair size={10} className="text-indigo-400" />
                  <span className="text-[10px] text-slate-500">
                    Klik diagram untuk mulai
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {showToast && (
          <SaveToast key="toast" onDismiss={() => setShowToast(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
