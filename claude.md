# Chase Cover Configurator — Project Documentation

## Overview

This is a 3D chimney chase cover configurator built for **Kaminos**. Users configure custom chase covers by setting dimensions, hole placements, material, gauge, and options. The 3D model updates in real-time and supports AR preview.

**Tech stack**: React + TypeScript + Vite + Zustand (state) + React Three Fiber (3D) + Three.js (geometry)

---

## File Structure

```
src/
├── App.tsx                          # Main layout, dim-overlay, AR launch
├── main.tsx                         # React entry point
├── store/configStore.ts             # Zustand store, pricing logic
├── config/pricing.ts                # Pricing constants
├── utils/
│   ├── geometry.ts                  # 3D model generation (buildScene)
│   ├── ar.ts                        # AR export (GLB) and config serialization
│   └── cameraRef.ts                 # Camera action bindings (reset, top, front)
├── components/
│   ├── viewer/
│   │   ├── ChaseViewer.tsx          # R3F Canvas, lights, environment
│   │   ├── ChaseModel.tsx           # Geometry rebuild on config changes
│   │   └── DimensionOverlay.tsx     # 3D labels with arrows (A1-A4)
│   ├── sidebar/
│   │   ├── Sidebar.tsx              # Main sidebar layout + price breakdown
│   │   ├── DimensionField.tsx       # Width/Length/Skirt inputs with limits
│   │   ├── CollarGroup.tsx          # Per-hole controls (dia, height, offsets)
│   │   ├── HoleSelector.tsx         # 0–3 hole selection buttons
│   │   ├── GaugeSelect.tsx          # Gauge dropdown
│   │   ├── MaterialChips.tsx        # Galvanized / Copper toggle
│   │   ├── ToggleRow.tsx            # Toggle switches (drip, diag, pc)
│   │   ├── PowderCoatSection.tsx    # Color picker + RAL trigger
│   │   ├── PriceDisplay.tsx         # Estimated price display
│   │   ├── CartRow.tsx              # Quantity + Add to Cart
│   │   └── NotesField.tsx           # Special notes textarea
│   ├── ral/RalModal.tsx             # RAL color palette modal
│   └── ar/                          # AR-related components
└── styles/globals.css               # All CSS
```

---

## Dimension Limits

| Field | Min | Max | Default | Unit | Snap |
|-------|-----|-----|---------|------|------|
| Width | 16 (dynamic) | 60 | 48 | inches | ⅛" |
| Length | 16 (dynamic) | 120 | 60 | inches | ⅛" |
| Skirt | 1 | 12 | 3 | inches | ⅛" |

**Dynamic minimums** (`DimensionField.tsx`):
- Width min = max(16, `largestHoleDia + 1"`)
- Length min depends on hole count:
  - 1 hole: max(16, `diaA + 1"`)
  - 2 holes: max(16, `diaA + diaB + 2"`, `2×diaA + 2"`, etc.)
  - 3 holes: similar but with 3 hole diameters

All inputs snap to nearest ⅛ inch.

---

## Hole Placement Logic

### Holes (0–3)
Each hole has: diameter (3–30"), collar height (1–52"), centered flag, 4 offsets.

### Centered Mode
When centered, holes auto-position along the Z axis (length direction):
- **1 hole**: center of cover (0, 0)
- **2 holes**: spaced at ±L/4 from center (or further if diameters require it)
- **3 holes**: A at +L/3, B at center (0), C at −L/3 (adjusted for diameter)

**Overlap prevention**: Centered holes enforce a minimum gap of 1" between hole edges:
```
spacing = max(defaultSpacing, radiusA + radiusB + 1")
```

### Manual Offset Mode
When "Centered on Cover" is unchecked, user controls 4 offsets:

| Label | Offset Key | Meaning |
|-------|-----------|---------|
| X1 (Top) | offset3 | Distance from top edge to hole edge |
| X2 (Right) | offset4 | Distance from right edge to hole edge |
| X3 (Bottom) | offset1 | Distance from bottom edge to hole edge |
| X4 (Left) | offset2 | Distance from left edge to hole edge |

**Internal position calculation** (`geometry.ts:holeWorld`):
```
cx = (W/2 - offset1) × SC - radius
cz = (L/2 - offset2) × SC - radius
```

**Collision detection** (`CollarGroup.tsx:clampForCollision`):
When editing offsets, the system checks distance to all other holes and ensures `dist >= r1 + r2 + 1"`. If violated, the proposed offset is pushed back to maintain the gap.

**Offset constraints**: Each offset is clamped to `[0, coverDim - holeDia]`.

---

## Dim-Overlay (Top-Right Info Box)

Shows in the 3D viewport as a summary:
```
48" W × 60" L × 3" Skirt
H1: ⌀10" (on center)
H1: ⌀10" [A1: 5" A2: 8" A3: 5" A4: 8"]
```

When not centered, shows all 4 offsets: A1=offset3 (Top), A2=offset4 (Right), A3=offset1 (Bottom), A4=offset2 (Left).

---

## 3D Label System (DimensionOverlay)

Labels float above the model using `@react-three/drei Html` components with `distanceFactor={8}` for stable sizing. Each hole shows 4 measurement arrows:
- Arrow from each edge to the hole perimeter (not center)
- Color coded: A=yellow (#facc15), B=sky blue (#38bdf8), C=green (#4ade80)
- Arrows have heads at both ends

Side labels (Top/Right/Bottom/Left) shown when "Show Side Labels" is checked and holes > 0.

Per-hole labels are individually toggleable via "Show Labels" checkbox.

---

## Pricing Formula

**File**: `config/pricing.ts` + `store/configStore.ts`

```
base = AREA_RATE × W × L + LINEAR_RATE × (W + L) + BASE_FIXED
subtotal = base + holes × HOLE_PRICE + skirtSurcharge + powderCoat
total = subtotal × GAUGE_MULT × MATERIAL_MULT
```

| Constant | Value |
|----------|-------|
| AREA_RATE | $0.025/sq in |
| LINEAR_RATE | $0.445/in |
| BASE_FIXED | $178.03 |
| HOLE_PRICE | $25/hole |
| POWDER_COAT | $45 |
| SKIRT_SURCHARGE | $75 (if skirt ≥ 6") |
| SKIRT_THRESHOLD | 6" |

**Gauge multipliers**: 24ga=1.0, 20ga=1.3, 18ga=1.4, 16ga=1.6, 14ga=1.8, 12ga=2.7, 10ga=3.4

**Material multipliers**: Galvanized=1.0, Copper=3.0

---

## 3D Geometry (`geometry.ts`)

### Scale
`SC = 0.02` — world units per inch. All calculations convert inches to world units.

### Gauge Thickness (inches)
10ga=0.1345, 12ga=0.1046, 14ga=0.0747, 16ga=0.0598, 18ga=0.0478, 20ga=0.0359, 24ga=0.0239

### Model Components

1. **Lid (top surface)**:
   - **Flat** (diag off): `ExtrudeGeometry` rectangle with circular holes via `Shape.holes`
   - **Sloped** (diag on): 60×60 tessellated grid. Height at each point: `edgeY + SLOPE × (1 - max(|px|, |pz|))` where px/pz are normalized coords (Chebyshev distance). Vertices near diagonals snap to create sharp crease lines. Triangle edges align along diagonals for visible ridges. SLOPE = `sqrt(W² + L²) × 0.035`.

2. **Skirt**: 4 `BoxGeometry` panels around the perimeter, height = skirt value.

3. **Drip Edge**: 4 beveled strips (0.5" out, 0.5" down at 45°) as custom `BufferGeometry` quads.

4. **Collars**: Custom `BufferGeometry` cylinders (48 segments). Bottom vertices follow `getRoofY()` for smooth intersection with sloped roof. Top ring cap via `RingGeometry`.

5. **Bottom face** (sloped mode only): Flat `ExtrudeGeometry` with hole cutouts at skirt height.

### Hole Cutouts on Sloped Roof
Grid vertices near hole boundaries snap to the hole radius. Triangles inside holes or entirely on the hole boundary are culled. No CSG library needed.

---

## AR System (`ar.ts`)

### Export
`exportToGLB(group)`: Clones the scene group, scales to real-world meters (0.0254/SC), strips environment maps, exports as base64 GLB via `GLTFExporter`.

### Serialization
`getConfigState(config)`: Serializes config to base64 JSON for URL hash. Includes dimensions, toggles, and per-hole collar settings.

`applyConfigState(base64)`: Restores config from URL hash on page load (mobile AR flow).

### Flow
1. Desktop: Shows QR code with URL containing serialized config hash
2. Mobile: Scans QR → page loads with config → user taps "Launch AR"
3. GLB exported from scene → passed to `<model-viewer>` web component for WebXR/Scene Viewer

---

## Materials

- **Galvanized**: metalness=0.9, roughness=0.25, color=#b8c4cc
- **Copper**: metalness=0.85, roughness=0.15, color=#e09a72
- **Powder Coat**: metalness=0.3, roughness=0.6, user-selected color

---

## State Management (Zustand)

Single store `useConfigStore` with flat state. Two mutation methods:
- `set(partial)`: Updates any top-level config and recomputes price
- `setCollar(id, partial)`: Updates a specific collar (A/B/C) and recomputes price

Defaults: W=48, L=60, Skirt=3, 1 hole, 10" dia, 3" collar height, centered, galvanized, 24ga, drip on, diagonal crease on.
<parameter name="Complexity">5
