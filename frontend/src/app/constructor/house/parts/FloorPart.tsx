'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createFacadeTexture } from '@/utils/facadeMaterials';

interface FloorPartProps {
  level: number;
  height: number;
  width: number;
  depth: number;
  textureType: string;
  color: string;
}

export function FloorPart({ level, height, width, depth, textureType, color }: FloorPartProps) {
  const wallThickness = 0.2;

  const { map, normalMap } = useMemo(() => {
    return createFacadeTexture(textureType, color, '#333333');
  }, [textureType, color]);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map, normalMap, roughness: 0.6 }), [map, normalMap]);

  return (
    <group position={[0, (level - 1) * height, 0]}>
      {/* Передняя стена */}
      <mesh position={[0, height / 2, depth / 2 - wallThickness / 2]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
      </mesh>
      {/* Задняя стена */}
      <mesh position={[0, height / 2, -depth / 2 + wallThickness / 2]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
      </mesh>
      {/* Левая стена */}
      <mesh position={[-width / 2 + wallThickness / 2, height / 2, 0]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, depth - wallThickness * 2]} />
      </mesh>
      {/* Правая стена */}
      <mesh position={[width / 2 - wallThickness / 2, height / 2, 0]} material={mat} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, depth - wallThickness * 2]} />
      </mesh>
    </group>
  );
}