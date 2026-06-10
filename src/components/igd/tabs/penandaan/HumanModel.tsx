"use client";

// Model humanoid 3D prosedural (tanpa asset eksternal) — mesh per-regio anatomis bernama.
// Klik permukaan → raycast → emit posisi lokal + nama regio (depan/belakang dibedakan dari sisi z).

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useFrame } from "@react-three/fiber";
import {
  SEV,
  type Anotasi,
  type ModelJenis,
} from "./penandaanShared";

// ── Definisi part ─────────────────────────────────────────

type PartKind = "capsule" | "sphere";

interface PartDef {
  key: string;
  /** regio saat ditandai dari sisi depan (z ≥ 0) */
  regionFront: string;
  /** regio saat ditandai dari sisi belakang (z < 0) — fallback ke regionFront */
  regionBack?: string;
  kind: PartKind;
  /** sphere: [radius] · capsule: [radius, panjang] */
  args: [number] | [number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

/** Mirror part kiri (+x = kiri pasien saat menghadap kamera) → kanan (−x). */
function mirrorLR(parts: PartDef[]): PartDef[] {
  const out: PartDef[] = [];
  for (const p of parts) {
    if (!p.key.endsWith("-L")) {
      out.push(p);
      continue;
    }
    out.push(p);
    out.push({
      ...p,
      key: p.key.replace(/-L$/, "-R"),
      regionFront: p.regionFront.replace("Kiri", "Kanan"),
      regionBack: p.regionBack?.replace("Kiri", "Kanan"),
      position: [-p.position[0], p.position[1], p.position[2]],
      rotation: p.rotation
        ? [p.rotation[0], -p.rotation[1], -p.rotation[2]]
        : undefined,
    });
  }
  return out;
}

const DEWASA_PARTS: PartDef[] = mirrorLR([
  { key: "kepala", regionFront: "Kepala", regionBack: "Kepala Belakang", kind: "sphere", args: [0.295], position: [0, 3.16, 0], scale: [0.92, 1.12, 0.98] },
  { key: "leher", regionFront: "Leher", regionBack: "Tengkuk", kind: "capsule", args: [0.095, 0.16], position: [0, 2.83, 0] },
  { key: "dada", regionFront: "Dada", regionBack: "Punggung Atas", kind: "capsule", args: [0.42, 0.5], position: [0, 2.36, 0], scale: [1, 1, 0.64] },
  { key: "perut", regionFront: "Abdomen", regionBack: "Punggung Bawah", kind: "capsule", args: [0.36, 0.26], position: [0, 1.94, 0], scale: [1, 1, 0.6] },
  { key: "pelvis", regionFront: "Pelvis / Inguinal", regionBack: "Bokong", kind: "capsule", args: [0.39, 0.14], position: [0, 1.6, 0], scale: [1, 1, 0.66] },
  { key: "bahu-L", regionFront: "Bahu Kiri", kind: "sphere", args: [0.135], position: [0.5, 2.6, 0] },
  { key: "lengan-atas-L", regionFront: "Lengan Atas Kiri", kind: "capsule", args: [0.105, 0.42], position: [0.63, 2.22, 0], rotation: [0, 0, -0.1] },
  { key: "lengan-bawah-L", regionFront: "Lengan Bawah Kiri", kind: "capsule", args: [0.09, 0.4], position: [0.71, 1.73, 0], rotation: [0, 0, -0.04] },
  { key: "tangan-L", regionFront: "Tangan Kiri", kind: "sphere", args: [0.105], position: [0.76, 1.4, 0.02], scale: [0.85, 1.3, 0.55] },
  { key: "paha-L", regionFront: "Paha Kiri", regionBack: "Paha Kiri (Posterior)", kind: "capsule", args: [0.15, 0.52], position: [0.21, 1.2, 0] },
  { key: "tungkai-L", regionFront: "Tungkai Bawah Kiri", regionBack: "Betis Kiri", kind: "capsule", args: [0.11, 0.48], position: [0.215, 0.56, 0] },
  { key: "kaki-L", regionFront: "Kaki Kiri", regionBack: "Tumit Kiri", kind: "sphere", args: [0.12], position: [0.22, 0.12, 0.14], scale: [0.95, 0.5, 1.8] },
]);

const ANAK_PARTS: PartDef[] = mirrorLR([
  { key: "kepala", regionFront: "Kepala", regionBack: "Kepala Belakang", kind: "sphere", args: [0.31], position: [0, 2.12, 0], scale: [0.95, 1.05, 0.98] },
  { key: "leher", regionFront: "Leher", regionBack: "Tengkuk", kind: "capsule", args: [0.08, 0.08], position: [0, 1.84, 0] },
  { key: "dada", regionFront: "Dada", regionBack: "Punggung Atas", kind: "capsule", args: [0.33, 0.3], position: [0, 1.58, 0], scale: [1, 1, 0.7] },
  { key: "perut", regionFront: "Abdomen", regionBack: "Punggung Bawah", kind: "capsule", args: [0.3, 0.16], position: [0, 1.28, 0], scale: [1, 1, 0.72] },
  { key: "pelvis", regionFront: "Pelvis / Inguinal", regionBack: "Bokong", kind: "capsule", args: [0.3, 0.08], position: [0, 1.05, 0], scale: [1, 1, 0.72] },
  { key: "bahu-L", regionFront: "Bahu Kiri", kind: "sphere", args: [0.1], position: [0.36, 1.72, 0] },
  { key: "lengan-atas-L", regionFront: "Lengan Atas Kiri", kind: "capsule", args: [0.08, 0.26], position: [0.45, 1.48, 0], rotation: [0, 0, -0.1] },
  { key: "lengan-bawah-L", regionFront: "Lengan Bawah Kiri", kind: "capsule", args: [0.07, 0.24], position: [0.5, 1.18, 0], rotation: [0, 0, -0.04] },
  { key: "tangan-L", regionFront: "Tangan Kiri", kind: "sphere", args: [0.085], position: [0.53, 0.97, 0.02], scale: [0.85, 1.2, 0.6] },
  { key: "paha-L", regionFront: "Paha Kiri", regionBack: "Paha Kiri (Posterior)", kind: "capsule", args: [0.115, 0.3], position: [0.16, 0.78, 0] },
  { key: "tungkai-L", regionFront: "Tungkai Bawah Kiri", regionBack: "Betis Kiri", kind: "capsule", args: [0.09, 0.28], position: [0.165, 0.38, 0] },
  { key: "kaki-L", regionFront: "Kaki Kiri", regionBack: "Tumit Kiri", kind: "sphere", args: [0.095], position: [0.17, 0.08, 0.1], scale: [0.95, 0.5, 1.7] },
]);

const PARTS: Record<ModelJenis, PartDef[]> = {
  dewasa: DEWASA_PARTS,
  anak: ANAK_PARTS,
};

const BODY_COLOR = "#d7ddec";
const HOVER_EMISSIVE = "#6366f1";

// ── Marker pin 3D ─────────────────────────────────────────

function MarkerPin({
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
  const ringRef = useRef<THREE.Mesh>(null);

  // ring "ping" halus saat terpilih
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = (clock.elapsedTime % 1.4) / 1.4;
    const s = selected ? 1 + t * 1.6 : 1;
    ringRef.current.scale.setScalar(s);
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = selected ? 0.55 * (1 - t) : 0;
  });

  if (!anotasi.pos3d) return null;

  return (
    <group position={anotasi.pos3d}>
      <mesh
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta > 6) return;
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[selected ? 0.052 : 0.042, 18, 18]} />
        <meshStandardMaterial
          color={c.hex}
          emissive={c.hex}
          emissiveIntensity={0.45}
          roughness={0.35}
        />
      </mesh>
      {/* ring ping */}
      <mesh ref={ringRef}>
        <sphereGeometry args={[0.055, 14, 14]} />
        <meshBasicMaterial color={c.hex} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* nomor pin */}
      <Html
        center
        position={[0, 0.1, 0]}
        distanceFactor={5}
        occlude
        zIndexRange={[20, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold text-white shadow-md ring-2 ring-white ${c.pinBg} ${selected ? "scale-110" : ""}`}
        >
          {displayIdx + 1}
        </div>
      </Html>
    </group>
  );
}

function GhostPin3D({ pos }: { pos: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 5) * 0.18;
    ref.current.scale.setScalar(s);
  });
  return (
    <group position={pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[0.05, 18, 18]} />
        <meshStandardMaterial
          color="#4f46e5"
          emissive="#4f46e5"
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>
      <Html
        center
        position={[0, 0.12, 0]}
        distanceFactor={5}
        zIndexRange={[30, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="whitespace-nowrap rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
          Lokasi baru…
        </div>
      </Html>
    </group>
  );
}

// ── Model utama ───────────────────────────────────────────

export interface HumanModelProps {
  jenis: ModelJenis;
  markers: Anotasi[];
  pendingPos: [number, number, number] | null;
  selectedId: string | null;
  onSelectMarker: (id: string) => void;
  onMark: (pos: [number, number, number], region: string) => void;
  onHoverRegion: (region: string | null) => void;
}

export default function HumanModel({
  jenis,
  markers,
  pendingPos,
  selectedId,
  onSelectMarker,
  onMark,
  onHoverRegion,
}: HumanModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const parts = PARTS[jenis];

  // geometry di-share per bentuk+args (hemat; ≤24 mesh)
  const geometries = useMemo(() => {
    const map = new Map<string, THREE.BufferGeometry>();
    for (const p of parts) {
      const id = `${p.kind}:${p.args.join(",")}`;
      if (map.has(id)) continue;
      map.set(
        id,
        p.kind === "sphere"
          ? new THREE.SphereGeometry(p.args[0], 28, 24)
          : new THREE.CapsuleGeometry(p.args[0], p.args[1] ?? 0.3, 8, 20),
      );
    }
    return map;
  }, [parts]);

  const resolveRegion = (part: PartDef, localPoint: THREE.Vector3) => {
    if (!part.regionBack) return part.regionFront;
    return localPoint.z < part.position[2] - 0.02
      ? part.regionBack
      : part.regionFront;
  };

  const handleClick = (part: PartDef) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 6) return; // drag orbit, bukan klik
    if (!groupRef.current) return;
    const local = groupRef.current.worldToLocal(e.point.clone());
    onMark([local.x, local.y, local.z], resolveRegion(part, local));
  };

  return (
    <group ref={groupRef}>
      {parts.map((p) => (
        <mesh
          key={p.key}
          geometry={geometries.get(`${p.kind}:${p.args.join(",")}`)}
          position={p.position}
          rotation={p.rotation ?? [0, 0, 0]}
          scale={p.scale ?? [1, 1, 1]}
          onClick={handleClick(p)}
          onPointerMove={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            if (!groupRef.current) return;
            const local = groupRef.current.worldToLocal(e.point.clone());
            setHoverKey(p.key);
            onHoverRegion(resolveRegion(p, local));
            document.body.style.cursor = "crosshair";
          }}
          onPointerOut={() => {
            setHoverKey((k) => (k === p.key ? null : k));
            onHoverRegion(null);
            document.body.style.cursor = "";
          }}
        >
          <meshStandardMaterial
            color={BODY_COLOR}
            roughness={0.55}
            metalness={0.05}
            emissive={HOVER_EMISSIVE}
            emissiveIntensity={hoverKey === p.key ? 0.16 : 0}
          />
        </mesh>
      ))}

      {markers.map((a, i) => (
        <MarkerPin
          key={a.id}
          anotasi={a}
          displayIdx={i}
          selected={selectedId === a.id}
          onClick={() => onSelectMarker(a.id)}
        />
      ))}

      {pendingPos && <GhostPin3D pos={pendingPos} />}
    </group>
  );
}
