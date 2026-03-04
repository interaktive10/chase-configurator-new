import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
import type { ConfigState, CollarState } from '../store/configStore';

export const SC = 0.02; // world units per inch

export function mkMat(
    mat: 'galvanized' | 'copper',
    pc: boolean,
    pcCol: string
): THREE.MeshStandardMaterial {
    if (pc) return new THREE.MeshStandardMaterial({ color: pcCol, metalness: 0.3, roughness: 0.6 });
    if (mat === 'copper') return new THREE.MeshStandardMaterial({ color: '#e09a72', metalness: 0.85, roughness: 0.15, envMapIntensity: 1.2 });
    return new THREE.MeshStandardMaterial({ color: '#b8c4cc', metalness: 0.9, roughness: 0.25 });
}

const GAUGE_THICKNESS: Record<number, number> = {
    10: 0.1345, 12: 0.1046, 14: 0.0747,
    16: 0.0598, 18: 0.0478, 20: 0.0359, 24: 0.0239
};

function getCollarConfig(id: 'A' | 'B' | 'C', config: ConfigState): CollarState {
    if (id === 'A') return config.collarA;
    if (id === 'B') return config.collarB;
    return config.collarC;
}

export function holeR(id: 'A' | 'B' | 'C', config: ConfigState): number {
    return (getCollarConfig(id, config).dia / 2) * SC;
}

export function colH(id: 'A' | 'B' | 'C', config: ConfigState): number {
    return getCollarConfig(id, config).height * SC;
}

export function holeWorld(id: 'A' | 'B' | 'C', config: ConfigState): { wx: number; wz: number; r: number; h: number; id: string } {
    const collar = getCollarConfig(id, config);
    const r = holeR(id, config);
    const h = colH(id, config);
    const MIN_GAP = 1 * SC; // 1 inch minimum gap between holes

    if (collar.centered) {
        if (config.holes === 1) return { wx: 0, wz: 0, r, h, id };
        if (config.holes === 2) {
            const rA = (getCollarConfig('A', config).dia / 2) * SC;
            const rB = (getCollarConfig('B', config).dia / 2) * SC;
            const defaultSpacing = (config.l / 4) * SC;
            const minSpacing = rA + rB + MIN_GAP;
            const spacing = Math.max(defaultSpacing, minSpacing);
            if (id === 'A') return { wx: 0, wz: spacing, r, h, id };
            if (id === 'B') return { wx: 0, wz: -spacing, r, h, id };
        }
        if (config.holes === 3) {
            const rA = (getCollarConfig('A', config).dia / 2) * SC;
            const rB = (getCollarConfig('B', config).dia / 2) * SC;
            const rC = (getCollarConfig('C', config).dia / 2) * SC;
            const defaultAB = (config.l / 3) * SC;
            const defaultBC = (config.l / 3) * SC;
            const minAB = rA + rB + MIN_GAP;
            const minBC = rB + rC + MIN_GAP;
            const spacingAB = Math.max(defaultAB, minAB);
            const spacingBC = Math.max(defaultBC, minBC);
            if (id === 'A') return { wx: 0, wz: spacingAB, r, h, id };
            if (id === 'B') return { wx: 0, wz: 0, r, h, id };
            if (id === 'C') return { wx: 0, wz: -spacingBC, r, h, id };
        }
    }

    // Uses offset1 as distance from bottom edge (Width / 2)
    // Uses offset2 as distance from left edge (Length / 2)
    const cz = (config.l / 2 - collar.offset2) * SC - r;
    const cx = (config.w / 2 - collar.offset1) * SC - r;

    return { wx: cx, wz: cz, r, h, id };
}

export function buildScene(grp: THREE.Group, config: ConfigState) {
    const W = config.w * SC;
    const L = config.l * SC;
    const skH = config.sk * SC;
    const T = (GAUGE_THICKNESS[config.gauge] || 0.0478) * SC;
    const SLOPE = config.diag ? Math.sqrt(W * W + L * L) * 0.035 : 0;

    const mat = mkMat(config.mat, config.pc, config.pcCol);

    const holes: ReturnType<typeof holeWorld>[] = [];
    if (config.holes >= 1) holes.push(holeWorld('A', config));
    if (config.holes >= 2) holes.push(holeWorld('B', config));
    if (config.holes === 3) holes.push(holeWorld('C', config));

    if (config.diag) {
        buildSlopedTop(W, L, skH, T, SLOPE, holes, mat, grp);
    } else {
        buildFlatTop(W, L, skH, T, holes, mat, grp);
    }

    // Skirt
    function addSk(w: number, px: number, pz: number, ry: number) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, skH, T), mat.clone());
        m.position.set(px, skH / 2, pz);
        m.rotation.y = ry;
        m.castShadow = true;
        m.receiveShadow = true;
        grp.add(m);
    }

    addSk(W + T, 0, L / 2, 0);
    addSk(W + T, 0, -L / 2, 0);
    addSk(L + T, -W / 2, 0, Math.PI / 2);
    addSk(L + T, W / 2, 0, Math.PI / 2);

    // Drip Edge — 0.5" outward at 45 degrees
    if (config.drip) {
        const dy = 0;
        const lipOut = 0.5 * SC;  // 0.5 inch horizontal extension
        const lipDrop = 0.5 * SC; // 0.5 inch vertical drop → 45° angle

        function addDrip(len: number, ox: number, oz: number, ix: number, iz: number) {
            const g = new THREE.BufferGeometry();
            let tx = 0, tz = 0;
            if (Math.abs(ix) > 0.5) { tx = 0; tz = 1; } else { tx = 1; tz = 0; }
            const hl = len / 2;

            const t0x = ox - tx * hl, t0z = oz - tz * hl;
            const t1x = ox + tx * hl, t1z = oz + tz * hl;
            const topY = dy;

            const btmY = dy - lipDrop;
            const b0x = t0x - ix * lipOut - tx * lipOut, b0z = t0z - iz * lipOut - tz * lipOut;
            const b1x = t1x - ix * lipOut + tx * lipOut, b1z = t1z - iz * lipOut + tz * lipOut;

            g.setAttribute('position', new THREE.Float32BufferAttribute([
                t0x, topY, t0z, t1x, topY, t1z,
                b0x, btmY, b0z, b1x, btmY, b1z,
            ], 3));
            g.setIndex([0, 2, 1, 1, 2, 3]);
            g.computeVertexNormals();
            const m = new THREE.Mesh(g, mat.clone());
            m.material.side = THREE.DoubleSide;
            m.castShadow = true;
            grp.add(m);
        }

        addDrip(W + T, 0, L / 2, 0, -1);
        addDrip(W + T, 0, -L / 2, 0, 1);
        addDrip(L + T, -W / 2, 0, 1, 0);
        addDrip(L + T, W / 2, 0, -1, 0);
    }

    // Collars — custom cylinder that follows roof slope at the bottom
    const COLLAR_SEGS = 48;
    for (const hole of holes) {
        const localRoofY = config.diag ? SLOPE * (1 - Math.max(Math.abs(hole.wx / (W / 2)), Math.abs(hole.wz / (L / 2)))) : 0;
        const topY = skH + localRoofY + hole.h;

        // Build custom collar geometry with bottom vertices conforming to the roof
        const colVerts: number[] = [];
        const colIdx: number[] = [];

        for (let i = 0; i < COLLAR_SEGS; i++) {
            const a = (i / COLLAR_SEGS) * Math.PI * 2;
            const px = hole.wx + Math.cos(a) * hole.r;
            const pz = hole.wz + Math.sin(a) * hole.r;

            // Bottom Y follows the roof surface at this point
            let btmY: number;
            if (config.diag) {
                const npx = px / (W / 2);
                const npz = pz / (L / 2);
                const d = Math.max(Math.abs(npx), Math.abs(npz));
                btmY = skH + SLOPE * (1 - d) - 0.002; // slight overlap into roof
            } else {
                btmY = skH - 0.002;
            }

            // Top vertex (even index: i*2)
            colVerts.push(px, topY, pz);
            // Bottom vertex (odd index: i*2+1)
            colVerts.push(px, btmY, pz);
        }

        // Create quads between adjacent segments
        for (let i = 0; i < COLLAR_SEGS; i++) {
            const cur = i * 2;
            const next = ((i + 1) % COLLAR_SEGS) * 2;
            // Two triangles per quad
            colIdx.push(cur, next, cur + 1);      // top-left triangle
            colIdx.push(next, next + 1, cur + 1);  // bottom-right triangle
        }

        const cGeo = new THREE.BufferGeometry();
        cGeo.setAttribute('position', new THREE.Float32BufferAttribute(colVerts, 3));
        cGeo.setIndex(colIdx);
        cGeo.computeVertexNormals();

        const cMat = mat.clone();
        cMat.side = THREE.DoubleSide;
        const cMesh = new THREE.Mesh(cGeo, cMat);
        cMesh.castShadow = true;
        grp.add(cMesh);

        const lo = hole.r + T;
        const li = hole.r - T * 0.5;
        const rG = new THREE.RingGeometry(li, lo, 32);
        const rm = new THREE.Mesh(rG, mat.clone());
        rm.rotation.x = -Math.PI / 2;
        rm.position.set(hole.wx, topY + 0.001, hole.wz);
        grp.add(rm);
    }
}

function buildFlatTop(W: number, L: number, skH: number, T: number, holes: any[], mat: THREE.Material, grp: THREE.Group) {
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2, -L / 2);
    shape.lineTo(W / 2, -L / 2);
    shape.lineTo(W / 2, L / 2);
    shape.lineTo(-W / 2, L / 2);
    shape.closePath();

    for (const h of holes) {
        const sx = h.wx, sy = -h.wz;
        const hp = new THREE.Path();
        for (let j = 0; j <= 32; j++) {
            const a = (j / 32) * Math.PI * 2;
            const hx = sx + Math.cos(a) * h.r, hy = sy + Math.sin(a) * h.r;
            j === 0 ? hp.moveTo(hx, hy) : hp.lineTo(hx, hy);
        }
        shape.holes.push(hp);
    }

    const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false, curveSegments: 32 });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = skH;
    m.castShadow = true;
    m.receiveShadow = true;
    grp.add(m);
}

function buildSlopedTop(W: number, L: number, skH: number, _T: number, SLOPE: number, holes: any[], mat: THREE.Material, grp: THREE.Group) {
    const hw = W / 2, hl = L / 2;
    const edgeY = skH;



    const thickness = 0.05; // Metal sheet thickness
    const pts = [
        // Top surface vertices
        0, edgeY + SLOPE, 0, // 0: Peak
        -hw, edgeY, -hl,     // 1: Top Left
        hw, edgeY, -hl,      // 2: Top Right
        hw, edgeY, hl,       // 3: Bottom Right
        -hw, edgeY, hl,      // 4: Bottom Left
        // Bottom surface vertices (shifted down by thickness)
        0, edgeY + SLOPE - thickness, 0, // 5: BPeak
        -hw, edgeY - thickness, -hl,     // 6: BTL
        hw, edgeY - thickness, -hl,      // 7: BTR
        hw, edgeY - thickness, hl,       // 8: BBR
        -hw, edgeY - thickness, hl       // 9: BBL
    ];

    const indices = [
        0, 2, 1, // Top Back
        0, 3, 2, // Top Right
        0, 4, 3, // Top Front
        0, 1, 4, // Top Left
        // Bottom faces
        5, 6, 7, // Bottom Back
        5, 7, 8, // Bottom Right
        5, 8, 9, // Bottom Front
        5, 9, 6, // Bottom Left
        // Side walls (closing the thin edge)
        1, 2, 7, 1, 7, 6,
        2, 3, 8, 2, 8, 7,
        3, 4, 9, 3, 9, 8,
        4, 1, 6, 4, 6, 9
    ];

    let topGeo = new THREE.BufferGeometry();
    topGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    topGeo.setIndex(indices);
    topGeo = topGeo.toNonIndexed();
    topGeo.computeVertexNormals();

    const baseMat = mat.clone();
    baseMat.side = THREE.DoubleSide; // Safe rendering for CSG output

    let csgTop = CSG.fromMesh(new THREE.Mesh(topGeo, baseMat));

    for (const h of holes) {
        if (h.r > 0) {
            // Cut hole. Make cylinder taller than roof height to ensure full cut
            const cylH = SLOPE + 10;
            const cylGeo = new THREE.CylinderGeometry(h.r, h.r, cylH, 64);
            const cylMesh = new THREE.Mesh(cylGeo);
            // ThreeJS shapes use -z for "up" in 2D to 3D mapping, but h.wx and h.wz are world coords.
            // Collar uses h.wz as its Z offset. Let's match collar's position exactly:
            cylMesh.position.set(h.wx, edgeY + SLOPE / 2, h.wz);
            cylMesh.updateMatrixWorld();

            const csgHole = CSG.fromMesh(cylMesh);
            csgTop = csgTop.subtract(csgHole);
        }
    }

    const finalTopMesh = CSG.toMesh(csgTop, new THREE.Matrix4(), baseMat);
    finalTopMesh.castShadow = true;
    finalTopMesh.receiveShadow = true;
    grp.add(finalTopMesh);
}
