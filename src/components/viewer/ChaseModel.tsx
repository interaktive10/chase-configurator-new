import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useConfigStore } from '../../store/configStore';
import { buildScene } from '../../utils/geometry';

export function ChaseModel() {
    const groupRef = useRef<THREE.Group>(null);

    // Notice we watch all configuration properties that dictate shape or material
    // Zustand's hook lets us just subscribe to the entire state since we want 
    // to rebuild geometry whenever any config property changes
    const config = useConfigStore(state => state);

    useEffect(() => {
        const grp = groupRef.current;
        if (!grp) return;

        // Clean up old geometry and materials
        grp.traverse(c => {
            const mesh = c as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });

        // Remove old children
        while (grp.children.length) {
            grp.remove(grp.children[0]);
        }

        // Rebuild full procedural geometry and attach to group
        try {
            buildScene(grp, config);
            (window as any).__chaseGroup = grp;
        } catch (e) {
            console.error("Failed to build geometry", e);
        }
    }, [
        config.w, config.l, config.sk, config.drip, config.diag, config.mat, config.gauge,
        config.pc, config.pcCol, config.holes,
        config.collarA, config.collarB, config.collarC
    ]);

    return <group ref={groupRef} />;
}
