// Tipe global proyek.
//
// `IconComponent` menggantikan pola lama `icon: React.ElementType` di seluruh komponen.
// Alasan: augmentasi JSX global @react-three/fiber v9 (IntrinsicElements extends ThreeElements,
// dipakai Penandaan Gambar 3D) membuat JSX `IconComponent` ambruk jadi `never` untuk prop
// `size`/`className`. Tipe presisi ini lucide-compatible dan tidak terdampak augmentasi.

import type * as React from "react";

declare global {
  /** Komponen ikon (lucide-react compatible): props SVG + `size`. */
  type IconComponent = React.ComponentType<
    React.SVGProps<SVGSVGElement> & { size?: number | string }
  >;
}

export {};
