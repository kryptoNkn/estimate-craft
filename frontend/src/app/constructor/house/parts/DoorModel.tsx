'use client';

import React from 'react';

interface DoorModelProps {
  isSelected?: boolean;
  width?: number;
  height?: number;
}

export function DoorModel({ isSelected = false, width = 1.1, height = 2.15 }: DoorModelProps) {
  const frameColor = isSelected ? '#3b82f6' : '#1e293b';

  return (
    <group>
      {/* Дверной короб */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.16]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} />
      </mesh>

      {/* Дверное полотно */}
      <mesh position={[0, 0, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[width - 0.08, height - 0.06, 0.09]} />
        <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* В декоративные филенки на двери */}
      {[-0.4, 0.2].map((yOffset, i) => (
        <mesh key={i} position={[0, yOffset, 0.058]} castShadow>
          <boxGeometry args={[width - 0.3, 0.6, 0.01]} />
          <meshStandardMaterial color="#18181b" roughness={0.5} />
        </mesh>
      ))}

      {/* Замочная скважина и накладка */}
      <mesh position={[width / 2 - 0.18, -0.05, 0.06]} castShadow>
        <boxGeometry args={[0.06, 0.22, 0.01]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Металлическая ручка */}
      <group position={[width / 2 - 0.18, -0.02, 0.08]}>
        {/* Основание */}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.04, 16]} />
          <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Ручка-рычаг */}
        <mesh position={[-0.05, 0, 0.02]} rotation={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.025, 0.02]} />
          <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}