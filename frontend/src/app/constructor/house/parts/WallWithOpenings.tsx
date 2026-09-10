'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createFacadeTexture } from '@/utils/facadeMaterials';
import { buildWallSegments, createWorldUvBox } from '../utils/wallSegments';
import type { WallCutout } from '../utils/wallSegments';

interface WallWithOpeningsProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  wallLength: number;
  wallHeight: number;
  thickness: number;
  cutouts?: WallCutout[];
  textureType: string;
  color: string;
  secondaryColor?: string;
  jointColor?: string;
  roughness?: number;
  plinth?: boolean;
  plinthColor?: string;
  cornice?: boolean;
  corniceColor?: string;
}

export function useFacadeMaterial(
  textureType: string,
  color: string,
  secondaryColor?: string,
  jointColor?: string,
  roughness = 0.74,
) {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return new THREE.MeshStandardMaterial({ color, roughness });
    }

    try {
      const result = createFacadeTexture(
        textureType,
        color,
        secondaryColor || color,
        jointColor,
      );

      return new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: result?.map ?? null,
        normalMap: result?.normalMap ?? null,
        roughnessMap: result?.roughnessMap ?? null,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness,
        metalness: textureType === 'horizontal' ? 0.1 : 0.02,
      });
    } catch {
      return new THREE.MeshStandardMaterial({ color, roughness });
    }
  }, [textureType, color, secondaryColor, jointColor, roughness]);
}

function WallSegmentMesh({
  segment,
  wallLength,
  thickness,
  material,
}: {
  segment: { x: number; y: number; width: number; height: number };
  wallLength: number;
  thickness: number;
  material: THREE.MeshStandardMaterial;
}) {
  const geometry = useMemo(
    () =>
      createWorldUvBox(
        segment.width,
        segment.height,
        thickness,
        segment.x - segment.width / 2,
        segment.y - segment.height / 2,
      ),
    [segment.x, segment.y, segment.width, segment.height, thickness],
  );

  return (
    <mesh
      position={[segment.x - wallLength / 2, segment.y, 0]}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
    />
  );
}

export function WallWithOpenings({
  position,
  rotation = [0, 0, 0],
  wallLength,
  wallHeight,
  thickness,
  cutouts = [],
  textureType,
  color,
  secondaryColor,
  jointColor,
  roughness = 0.74,
  plinth = false,
  plinthColor = '#8a8f98',
  cornice = false,
  corniceColor = '#e7e5e4',
}: WallWithOpeningsProps) {
  const segments = useMemo(
    () => buildWallSegments(wallLength, wallHeight, cutouts),
    [wallLength, wallHeight, cutouts],
  );

  const material = useFacadeMaterial(
    textureType,
    color,
    secondaryColor,
    jointColor,
    roughness,
  );

  return (
    <group position={position} rotation={rotation}>
      {segments.map((segment, index) => (
        <WallSegmentMesh
          key={`${segment.x.toFixed(3)}-${segment.y.toFixed(3)}-${index}`}
          segment={segment}
          wallLength={wallLength}
          thickness={thickness}
          material={material}
        />
      ))}

      {plinth && (
        <mesh position={[0, 0.22, thickness / 2 + 0.03]} castShadow receiveShadow>
          <boxGeometry args={[wallLength + 0.02, 0.44, 0.07]} />
          <meshStandardMaterial color={plinthColor} roughness={0.86} />
        </mesh>
      )}

      {cornice && (
        <group position={[0, wallHeight - 0.16, thickness / 2 + 0.05]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[wallLength + 0.16, 0.2, 0.12]} />
            <meshStandardMaterial color={corniceColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.16, -0.02]} castShadow>
            <boxGeometry args={[wallLength + 0.08, 0.11, 0.07]} />
            <meshStandardMaterial color={corniceColor} roughness={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}
