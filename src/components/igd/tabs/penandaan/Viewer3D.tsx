"use client";

// Kanvas 3D penandaan tubuh: Canvas R3F + orbit drag + zoom + preset kamera (Depan/Belakang/Kepala-Leher).
// Di-load via next/dynamic ssr:false dari PenandaanGambarTab.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { Crosshair, Rotate3d, ZoomIn, ZoomOut, Focus } from "lucide-react";
import { cn } from "@/lib/utils";
import HumanModel from "./HumanModel";
import type {
  Anotasi,
  ModelJenis,
  ViewPresetId,
} from "./penandaanShared";

// ── Preset kamera per model (tinggi model beda) ───────────

interface CamPreset {
  rotY: number;
  pos: [number, number, number];
  look: [number, number, number];
}

const CAM_PRESETS: Record<ModelJenis, Record<ViewPresetId, CamPreset>> = {
  dewasa: {
    depan: { rotY: 0, pos: [0, 1.85, 4.9], look: [0, 1.72, 0] },
    belakang: { rotY: Math.PI, pos: [0, 1.85, 4.9], look: [0, 1.72, 0] },
    kepala: { rotY: 0, pos: [0, 3.0, 1.9], look: [0, 3.02, 0] },
  },
  anak: {
    depan: { rotY: 0, pos: [0, 1.3, 3.8], look: [0, 1.15, 0] },
    belakang: { rotY: Math.PI, pos: [0, 1.3, 3.8], look: [0, 1.15, 0] },
    kepala: { rotY: 0, pos: [0, 2.05, 1.55], look: [0, 2.1, 0] },
  },
};

interface RigTargets {
  rotY: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
  /** skala jarak kamera (zoom) */
  dist: number;
}

function makeTargets(p: CamPreset): RigTargets {
  return {
    rotY: p.rotY,
    pos: new THREE.Vector3(...p.pos),
    look: new THREE.Vector3(...p.look),
    dist: 1,
  };
}

// ── Rig: lerp kamera + rotasi model tiap frame ────────────

function CameraRig({
  targets,
  modelGroup,
}: {
  targets: React.RefObject<RigTargets>;
  modelGroup: React.RefObject<THREE.Group | null>;
}) {
  const { camera } = useThree();
  const curLook = useRef(new THREE.Vector3());
  const tmp = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const t = targets.current;
    if (!t) return;
    const lambda = 5.5;
    if (modelGroup.current) {
      modelGroup.current.rotation.y = THREE.MathUtils.damp(
        modelGroup.current.rotation.y,
        t.rotY,
        lambda,
        delta,
      );
    }
    // posisi kamera = look + arah preset × dist (zoom)
    tmp.current.copy(t.pos).sub(t.look).multiplyScalar(t.dist).add(t.look);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, tmp.current.x, lambda, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, tmp.current.y, lambda, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, tmp.current.z, lambda, delta);
    curLook.current.x = THREE.MathUtils.damp(curLook.current.x, t.look.x, lambda, delta);
    curLook.current.y = THREE.MathUtils.damp(curLook.current.y, t.look.y, lambda, delta);
    curLook.current.z = THREE.MathUtils.damp(curLook.current.z, t.look.z, lambda, delta);
    camera.lookAt(curLook.current);
  });
  return null;
}

// ── Scene ─────────────────────────────────────────────────

function Scene({
  jenis,
  targets,
  markers,
  pendingPos,
  selectedId,
  onSelectMarker,
  onMark,
  onHoverRegion,
}: {
  jenis: ModelJenis;
  targets: React.RefObject<RigTargets>;
  markers: Anotasi[];
  pendingPos: [number, number, number] | null;
  selectedId: string | null;
  onSelectMarker: (id: string) => void;
  onMark: (pos: [number, number, number], region: string) => void;
  onHoverRegion: (region: string | null) => void;
}) {
  const modelGroup = useRef<THREE.Group>(null);

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 6, 4]} intensity={1.05} />
      <directionalLight position={[-4, 3, -3]} intensity={0.4} color="#c7d2fe" />

      <group ref={modelGroup}>
        <HumanModel
          jenis={jenis}
          markers={markers}
          pendingPos={pendingPos}
          selectedId={selectedId}
          onSelectMarker={onSelectMarker}
          onMark={onMark}
          onHoverRegion={onHoverRegion}
        />
      </group>

      {/* platform + bayangan kontak */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <circleGeometry args={[jenis === "anak" ? 1.25 : 1.6, 48]} />
        <meshBasicMaterial color="#e8edf6" />
      </mesh>
      <ContactShadows
        position={[0, 0.002, 0]}
        opacity={0.32}
        scale={4}
        blur={2.6}
        far={3.2}
        resolution={384}
        color="#33415c"
      />

      <CameraRig targets={targets} modelGroup={modelGroup} />
    </>
  );
}

// ── Viewer (wrapper + overlay kontrol) ────────────────────

export interface Viewer3DProps {
  jenis: ModelJenis;
  view: ViewPresetId | null;
  /** dipanggil saat user drag bebas — parent meng-clear highlight preset */
  onFreeOrbit: () => void;
  markers: Anotasi[];
  pendingPos: [number, number, number] | null;
  selectedId: string | null;
  onSelectMarker: (id: string) => void;
  onMark: (pos: [number, number, number], region: string) => void;
}

export default function Viewer3D({
  jenis,
  view,
  onFreeOrbit,
  markers,
  pendingPos,
  selectedId,
  onSelectMarker,
  onMark,
}: Viewer3DProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const targets = useRef<RigTargets>(makeTargets(CAM_PRESETS.dewasa.depan));
  const drag = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [hoverRegion, setHoverRegion] = useState<string | null>(null);

  // terapkan preset saat model / view berubah
  useEffect(() => {
    const preset = CAM_PRESETS[jenis][view ?? "depan"];
    const t = targets.current;
    t.rotY = preset.rotY;
    t.pos.set(...preset.pos);
    t.look.set(...preset.look);
    t.dist = 1;
  }, [jenis, view]);

  // wheel zoom (non-passive agar bisa preventDefault)
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const t = targets.current;
      t.dist = THREE.MathUtils.clamp(t.dist * (1 + e.deltaY * 0.0012), 0.4, 1.9);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) => {
    const t = targets.current;
    t.dist = THREE.MathUtils.clamp(t.dist * factor, 0.4, 1.9);
  };

  const resetView = () => {
    const preset = CAM_PRESETS[jenis][view ?? "depan"];
    const t = targets.current;
    t.rotY = preset.rotY;
    t.pos.set(...preset.pos);
    t.look.set(...preset.look);
    t.dist = 1;
  };

  return (
    <div
      ref={wrapRef}
      className="relative h-105 w-full touch-none select-none overflow-hidden rounded-lg sm:h-120 lg:h-135"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 50% 38%, #ffffff 0%, #f1f5fb 55%, #e6ebf5 100%)",
      }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, active: true };
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current.active) return;
        const dx = e.clientX - drag.current.x;
        if (Math.abs(dx) > 2) {
          targets.current.rotY += dx * 0.011;
          drag.current.x = e.clientX;
          drag.current.y = e.clientY;
          onFreeOrbit();
        }
      }}
      onPointerUp={() => {
        drag.current.active = false;
      }}
      onPointerLeave={() => {
        drag.current.active = false;
      }}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 32, position: CAM_PRESETS[jenis].depan.pos, near: 0.1, far: 50 }}
      >
        <Scene
          jenis={jenis}
          targets={targets}
          markers={markers}
          pendingPos={pendingPos}
          selectedId={selectedId}
          onSelectMarker={onSelectMarker}
          onMark={onMark}
          onHoverRegion={setHoverRegion}
        />
      </Canvas>

      {/* chip regio ter-hover (live feedback) */}
      <div
        className={cn(
          "pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur transition-opacity duration-150",
          hoverRegion ? "opacity-100" : "opacity-0",
        )}
      >
        <Crosshair size={10} className="text-indigo-500" />
        <span className="text-[10px] font-semibold text-indigo-700">
          {hoverRegion ?? "—"}
        </span>
      </div>

      {/* hint interaksi */}
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-2.5 py-1 shadow-sm backdrop-blur">
        <Rotate3d size={11} className="text-slate-400" />
        <span className="text-[9px] font-medium text-slate-500">
          Drag memutar · scroll zoom · klik tubuh untuk menandai
        </span>
      </div>

      {/* kontrol zoom */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button
          onClick={() => zoomBy(0.82)}
          aria-label="Perbesar"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-indigo-600 active:scale-95"
        >
          <ZoomIn size={13} />
        </button>
        <button
          onClick={() => zoomBy(1.22)}
          aria-label="Perkecil"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-indigo-600 active:scale-95"
        >
          <ZoomOut size={13} />
        </button>
        <button
          onClick={resetView}
          aria-label="Reset tampilan"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-indigo-600 active:scale-95"
        >
          <Focus size={13} />
        </button>
      </div>
    </div>
  );
}
