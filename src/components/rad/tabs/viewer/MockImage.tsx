// Mock radiological image placeholders — no real DICOM rendering
// Used by ViewerPane for demo/mock purposes only

import { type Modalitas } from "../../radShared";

export interface SeriesDef {
  id:       string;
  label:    string;
  subtitle: string;
  svg:      React.ReactNode;
}

// ── Anatomy SVGs ──────────────────────────────────────────


function CTAxial() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <rect width="200" height="200" fill="#000" />
      {/* Body cross-section */}
      <ellipse cx="100" cy="108" rx="86" ry="80" fill="#1c1c1c" stroke="#333" strokeWidth="1" />
      {/* Anterior chest wall */}
      <path d="M22 75 Q100 55 178 75" fill="#252525" />
      {/* Sternum (bright bone) */}
      <rect x="93" y="52" width="14" height="30" rx="3" fill="#ccc" opacity="0.8" />
      {/* Lung fields (very dark — air) */}
      <ellipse cx="58"  cy="110" rx="32" ry="42" fill="#040404" stroke="#1a1a1a" strokeWidth="0.5" />
      <ellipse cx="142" cy="110" rx="32" ry="42" fill="#040404" stroke="#1a1a1a" strokeWidth="0.5" />
      {/* Heart (medium gray) */}
      <ellipse cx="96" cy="114" rx="26" ry="30" fill="#3c3c3c" />
      {/* Aorta (with lumen) */}
      <circle cx="114" cy="90" r="9" fill="#555" />
      <circle cx="114" cy="90" r="5" fill="#060606" />
      {/* Pulmonary artery */}
      <circle cx="86"  cy="88" r="7" fill="#4a4a4a" />
      <circle cx="86"  cy="88" r="3.5" fill="#060606" />
      {/* Esophagus */}
      <circle cx="90" cy="95" r="3.5" fill="#222" stroke="#333" strokeWidth="0.5" />
      {/* Vertebra (bright cortical bone) */}
      <ellipse cx="100" cy="158" rx="17" ry="15" fill="#eee" />
      <circle  cx="100" cy="158" r="8" fill="#111" />
      {/* Paraspinal muscles */}
      <ellipse cx="64"  cy="150" rx="18" ry="13" fill="#2e2e2e" />
      <ellipse cx="136" cy="150" rx="18" ry="13" fill="#2e2e2e" />
      {/* Subcutaneous fat ring */}
      <ellipse cx="100" cy="108" rx="86" ry="80" fill="none" stroke="#2a2a2a" strokeWidth="6" />
    </svg>
  );
}

function USGFan() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <rect width="200" height="200" fill="#07080e" />
      {/* Sector (fan) shape */}
      <path d="M100 18 L14 182 Q100 198 186 182 Z" fill="#0a0e1a" stroke="#1a2030" strokeWidth="0.5" />
      {/* Scan-line radii */}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (-55 + i * 22) * Math.PI / 180;
        return (
          <line key={i}
            x1="100" y1="18"
            x2={100 + 182 * Math.sin(a)}
            y2={18  + 182 * Math.cos(a)}
            stroke="#0d1220" strokeWidth="0.5"
          />
        );
      })}
      {/* Liver (medium gray) */}
      <ellipse cx="80" cy="112" rx="52" ry="44" fill="#1e2e1e" opacity="0.9" />
      {/* Gallbladder (anechoic — black oval) */}
      <ellipse cx="88" cy="136" rx="11" ry="14" fill="#020406" stroke="#101820" strokeWidth="0.5" />
      {/* Portal vein */}
      <ellipse cx="65" cy="116" rx="8" ry="5" fill="#03060a" stroke="#101820" strokeWidth="0.5" />
      {/* Right kidney */}
      <ellipse cx="150" cy="122" rx="18" ry="26" fill="#1e1c18" stroke="#2e2c26" strokeWidth="0.5" />
      <ellipse cx="150" cy="122" rx="9"  ry="14" fill="#50483a" opacity="0.5" />
      {/* IVC */}
      <ellipse cx="112" cy="105" rx="6" ry="10" fill="#020406" stroke="#10181e" strokeWidth="0.5" />
      {/* Depth markers */}
      {[50, 90, 130, 170].map((y, i) => (
        <text key={i} x="168" y={y + 4} fill="#2a3040" fontSize="7">{i + 1}cm</text>
      ))}
    </svg>
  );
}

function MRIAxial() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full">
      <rect width="200" height="200" fill="#000" />
      {/* Outer skull (cortical — white on T1) */}
      <ellipse cx="100" cy="100" rx="88" ry="86" fill="#ccc" opacity="0.9" />
      {/* Diploe / cancellous */}
      <ellipse cx="100" cy="100" rx="80" ry="78" fill="#888" opacity="0.7" />
      {/* Brain parenchyma */}
      <ellipse cx="100" cy="102" rx="72" ry="70" fill="#808080" />
      {/* Simplified sulci (darker lines) */}
      <path d="M38 78  Q55 62 72 78  Q88 92 102 78  Q116 62 132 78  Q148 92 160 78"
        stroke="#555" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M34 100 Q50 84 66 100 Q82 116 98 100 Q114 84 130 100 Q145 114 162 100"
        stroke="#555" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M36 122 Q52 108 68 122 Q84 136 100 122 Q116 108 132 122 Q148 136 164 122"
        stroke="#555" strokeWidth="2" fill="none" opacity="0.5" />
      {/* Falx cerebri (midline) */}
      <line x1="100" y1="30" x2="100" y2="170" stroke="#444" strokeWidth="1.5" />
      {/* Lateral ventricles (CSF = dark on T1) */}
      <path d="M65 94  Q78 84 90 94  Q84 110 66 110 Z" fill="#282828" opacity="0.9" />
      <path d="M135 94 Q122 84 110 94 Q116 110 134 110 Z" fill="#282828" opacity="0.9" />
      {/* Third ventricle */}
      <rect x="95" y="102" width="10" height="16" rx="4" fill="#1e1e1e" />
      {/* Cerebellum */}
      <ellipse cx="100" cy="162" rx="32" ry="16" fill="#6a6a6a" stroke="#505050" strokeWidth="0.5" />
      {/* Brainstem */}
      <rect x="94" y="152" width="12" height="18" rx="4" fill="#606060" />
    </svg>
  );
}

function MammographyView() {
  return (
    <svg viewBox="0 0 180 220" className="h-full w-full">
      <rect width="180" height="220" fill="#080808" />
      {/* Pectoral muscle */}
      <path d="M0 50 Q20 80 25 130 L0 130 Z" fill="#555" opacity="0.7" />
      <rect x="0" y="50" width="25" height="130" fill="#3a3a3a" opacity="0.8" />
      {/* Breast outline */}
      <ellipse cx="95" cy="130" rx="72" ry="78" fill="#1c1c1c" />
      {/* Glandular tissue */}
      <ellipse cx="90" cy="125" rx="45" ry="48" fill="#555" opacity="0.5" />
      {/* Dense areas */}
      <ellipse cx="75"  cy="112" rx="20" ry="24" fill="#777" opacity="0.4" />
      <ellipse cx="105" cy="122" rx="15" ry="18" fill="#777" opacity="0.4" />
      {/* Cooper's ligaments */}
      <path d="M55 100 Q75 90 85 110" stroke="#666" strokeWidth="0.5" fill="none" opacity="0.4" />
      <path d="M80 140 Q90 155 110 148" stroke="#666" strokeWidth="0.5" fill="none" opacity="0.4" />
      {/* Suspicious lesion */}
      <ellipse cx="78" cy="108" rx="7" ry="6" fill="#aaa" opacity="0.5" />
      {/* Skin line */}
      <ellipse cx="95" cy="130" rx="72" ry="78" fill="none" stroke="#333" strokeWidth="1" />
      {/* Nipple */}
      <circle cx="160" cy="135" r="4" fill="#888" opacity="0.7" />
    </svg>
  );
}

// ── Public API ────────────────────────────────────────────

export function getMockSeries(modalitas: Modalitas): SeriesDef[] {
  switch (modalitas) {
    case "Konvensional":
      return [
        {
          id: "s1", label: "PA", subtitle: "Proyeksi PA/AP",
          svg: <img src="/ImagingMock/mockThorax.jpg" alt="Foto Thorax PA" className="h-full w-full object-contain" />,
        },
        {
          id: "s2", label: "LAT", subtitle: "Proyeksi Lateral",
          svg: <img src="/ImagingMock/mockThorax.jpg" alt="Foto Thorax Lateral" className="h-full w-full object-contain" />,
        },
      ];
    case "CT":
      return [
        { id: "s1", label: "Axial",    subtitle: "Axial Reformat",    svg: <CTAxial /> },
        { id: "s2", label: "Coronal",  subtitle: "Coronal Reformat",  svg: <CTAxial /> },
        { id: "s3", label: "Sagittal", subtitle: "Sagittal Reformat", svg: <CTAxial /> },
        {
          id: "s4", label: "Scout", subtitle: "Localizer",
          svg: <img src="/ImagingMock/mockThorax.jpg" alt="CT Scout Localizer" className="h-full w-full object-contain" />,
        },
      ];
    case "USG":
      return [
        { id: "s1", label: "Long",    subtitle: "Longitudinal",     svg: <USGFan /> },
        { id: "s2", label: "Trans",   subtitle: "Transversal",      svg: <USGFan /> },
        { id: "s3", label: "Oblique", subtitle: "Miring / Oblique", svg: <USGFan /> },
      ];
    case "MRI":
      return [
        { id: "s1", label: "T1",   subtitle: "T1-weighted Axial",  svg: <MRIAxial /> },
        { id: "s2", label: "T2 FL",subtitle: "T2 FLAIR Axial",     svg: <MRIAxial /> },
        { id: "s3", label: "DWI",  subtitle: "Diffusion-weighted", svg: <MRIAxial /> },
        { id: "s4", label: "T1+C", subtitle: "T1 Post-Kontras",    svg: <MRIAxial /> },
      ];
    case "Mammografi":
      return [
        { id: "s1", label: "CC-R",  subtitle: "CC Kanan",  svg: <MammographyView /> },
        { id: "s2", label: "MLO-R", subtitle: "MLO Kanan", svg: <MammographyView /> },
        { id: "s3", label: "CC-L",  subtitle: "CC Kiri",   svg: <MammographyView /> },
        { id: "s4", label: "MLO-L", subtitle: "MLO Kiri",  svg: <MammographyView /> },
      ];
    default:
      return [
        {
          id: "s1", label: "Seri 1", subtitle: "Gambar Pemeriksaan",
          svg: <img src="/ImagingMock/mockThorax.jpg" alt="Gambar Pemeriksaan" className="h-full w-full object-contain" />,
        },
      ];
  }
}
