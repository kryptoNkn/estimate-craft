'use client';

import React from 'react';

interface HiTechDetailsProps {
  width: number;
  depth: number;
  floorHeight: number;
  floors: number;
  groundLevel?: number;
}

export function HiTechDetails({
  width,
  depth,
  floorHeight,
  floors,
  groundLevel = -0.4,
}: HiTechDetailsProps) {
  if (floors < 2) return null;

  const upperBaseY = floorHeight;
  const roofY = floors * floorHeight;
  const slatCount = Math.max(6, Math.round(width * 1.1));

  return (
    <group>
      {/* Консоль второго этажа — вынос над террасой */}
      <mesh
        position={[0, upperBaseY + floorHeight / 2, depth / 2 + 0.5]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[width + 0.6, floorHeight - 0.1, 0.24]} />
        <meshStandardMaterial color="#F5F5F0" roughness={0.36} />
      </mesh>

      {/* Нижняя плоскость консоли */}
      <mesh position={[0, upperBaseY - 0.06, depth / 2 + 0.32]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.6, 0.14, 0.72]} />
        <meshStandardMaterial color="#EDEBE5" roughness={0.42} />
      </mesh>

      {/* Балкон второго света */}
      <group position={[0, roofY - 0.2, depth / 2 + 0.62]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width * 0.58, 0.12, 1.5]} />
          <meshStandardMaterial color="#F5F5F0" roughness={0.32} />
        </mesh>
        <mesh position={[0, 0.5, 0.72]} castShadow>
          <boxGeometry args={[width * 0.56, 0.9, 0.025]} />
          <meshPhysicalMaterial
            color="#dbeafe"
            transparent
            opacity={0.3}
            transmission={0.9}
            ior={1.5}
            roughness={0.04}
          />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * (width * 0.28 - 0.04), 0.5, 0.72]}
            castShadow
          >
            <boxGeometry args={[0.05, 0.94, 0.05]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* Вертикальные ламели — солнцезащита западного фасада */}
      <group position={[-width * 0.26, upperBaseY + floorHeight / 2, depth / 2 + 0.15]}>
        {Array.from({ length: slatCount }).map((_, index) => (
          <mesh key={index} position={[(index - slatCount / 2) * 0.13, 0, 0]} castShadow>
            <boxGeometry args={[0.035, floorHeight - 0.5, 0.1]} />
            <meshStandardMaterial color="#FAFAF9" roughness={0.42} />
          </mesh>
        ))}
      </group>

      {/* Приватная стена, продолжающая объём в ландшафт */}
      <mesh
        position={[
          width / 2 + 2.6,
          (floors * floorHeight + groundLevel) / 2,
          0.6,
        ]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.16, floors * floorHeight - groundLevel, 7.2]} />
        <meshStandardMaterial color="#F5F5F0" roughness={0.36} />
      </mesh>
    </group>
  );
}
