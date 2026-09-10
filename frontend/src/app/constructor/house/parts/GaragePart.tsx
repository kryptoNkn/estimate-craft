'use client';

import React from 'react';
import { useFacadeMaterial } from './WallWithOpenings';

interface GaragePartProps {
  houseWidth: number;
  depth: number;
  textureType: string;
  color: string;
  secondaryColor?: string;
  jointColor?: string;
  carsCount: number;
  roofColor?: string;
  groundLevel?: number;
}

export function GaragePart({
  houseWidth,
  depth,
  textureType,
  color,
  secondaryColor,
  jointColor,
  carsCount,
  roofColor = '#1e293b',
  groundLevel = -0.4,
}: GaragePartProps) {
  const garageWidth = carsCount * 3.4 + 0.6;
  const garageHeight = 2.9;
  const posX = houseWidth / 2 + garageWidth / 2;
  const gateWidth = 2.8;
  const gateHeight = 2.35;
  const wallT = 0.24;

  const material = useFacadeMaterial(textureType, color, secondaryColor, jointColor, 0.74);

  return (
    <group position={[posX, 0, 0]}>
      <mesh position={[0, groundLevel / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[garageWidth + 0.24, Math.abs(groundLevel), depth + 0.24]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.86} />
      </mesh>

      <mesh position={[0, garageHeight / 2, -depth / 2 + wallT / 2]} castShadow receiveShadow material={material}>
        <boxGeometry args={[garageWidth, garageHeight, wallT]} />
      </mesh>
      <mesh
        position={[garageWidth / 2 - wallT / 2, garageHeight / 2, 0]}
        castShadow
        receiveShadow
        material={material}
      >
        <boxGeometry args={[wallT, garageHeight, depth - wallT * 2]} />
      </mesh>

      <mesh
        position={[0, gateHeight + (garageHeight - gateHeight) / 2, depth / 2 - wallT / 2]}
        castShadow
        receiveShadow
        material={material}
      >
        <boxGeometry args={[garageWidth, garageHeight - gateHeight, wallT]} />
      </mesh>

      {Array.from({ length: carsCount + 1 }).map((_, index) => {
        const isEnd = index === 0 || index === carsCount;
        const pierWidth = isEnd ? 0.5 : 0.6;
        const centerX =
          index === 0
            ? -garageWidth / 2 + pierWidth / 2
            : index === carsCount
              ? garageWidth / 2 - pierWidth / 2
              : -garageWidth / 2 + 0.5 + index * 3.4 - pierWidth / 2;

        return (
          <mesh
            key={index}
            position={[centerX, gateHeight / 2, depth / 2 - wallT / 2]}
            castShadow
            receiveShadow
            material={material}
          >
            <boxGeometry args={[pierWidth, gateHeight, wallT]} />
          </mesh>
        );
      })}

      <mesh position={[0, garageHeight + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[garageWidth + 0.36, 0.2, depth + 0.36]} />
        <meshStandardMaterial color={roofColor} roughness={0.35} metalness={0.08} />
      </mesh>

      {Array.from({ length: carsCount }).map((_, idx) => {
        const xPos = -garageWidth / 2 + 0.5 + gateWidth / 2 + idx * 3.4;
        const panels = 5;
        const band = 0.06;

        return (
          <group key={idx} position={[xPos, gateHeight / 2, depth / 2 - 0.04]}>
            {Array.from({ length: panels }).map((__, row) => (
              <mesh
                key={row}
                position={[0, -gateHeight / 2 + (row + 0.5) * (gateHeight / panels), 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[gateWidth - 0.08, gateHeight / panels - 0.018, 0.06]} />
                <meshStandardMaterial color="#1f2937" roughness={0.38} metalness={0.5} />
              </mesh>
            ))}

            <mesh position={[0, gateHeight / 2 - gateHeight / panels / 2, 0.04]}>
              <planeGeometry args={[gateWidth - 0.42, gateHeight / panels - 0.18]} />
              <meshPhysicalMaterial
                color="#cbd5e1"
                transparent
                opacity={0.4}
                roughness={0.15}
                transmission={0.7}
                ior={1.45}
              />
            </mesh>

            {[-1, 1].map((side) => (
              <mesh key={side} position={[side * (gateWidth / 2 - band / 2), 0, 0.04]} castShadow>
                <boxGeometry args={[band, gateHeight, 0.04]} />
                <meshStandardMaterial color="#64748b" roughness={0.42} metalness={0.3} />
              </mesh>
            ))}
            {[-1, 1].map((side) => (
              <mesh key={`h${side}`} position={[0, side * (gateHeight / 2 - band / 2), 0.04]} castShadow>
                <boxGeometry args={[gateWidth, band, 0.04]} />
                <meshStandardMaterial color="#64748b" roughness={0.42} metalness={0.3} />
              </mesh>
            ))}
          </group>
        );
      })}

      <mesh
        position={[0, groundLevel + 0.02, depth / 2 + 1.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[garageWidth + 0.4, 2.6]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.9} />
      </mesh>
    </group>
  );
}
