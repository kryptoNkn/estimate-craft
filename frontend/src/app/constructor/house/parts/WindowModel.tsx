'use client';

import React from 'react';

interface WindowModelProps {
  isSelected?: boolean;
  width?: number;
  height?: number;
}

export function WindowModel({ isSelected = false, width = 1.4, height = 1.3 }: WindowModelProps) {
  const frameColor = isSelected ? '#3b82f6' : '#1e293b';
  const sashWidth = width - 0.16;
  const sashHeight = height - 0.16;

  return (
    <group>
      {/* Наружный рамный профиль */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.14]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Вырез рамы (внутренняя ниша) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width - 0.12, height - 0.12, 0.15]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Подвижные открывающиеся створки */}
      <group position={[0, 0, 0.01]}>
        {/* Левая створка */}
        <mesh position={[-sashWidth / 4, 0, 0]} castShadow>
          <boxGeometry args={[sashWidth / 2 - 0.01, sashHeight, 0.08]} />
          <meshStandardMaterial color={frameColor} roughness={0.3} />
        </mesh>
        {/* Правая створка */}
        <mesh position={[sashWidth / 4, 0, 0]} castShadow>
          <boxGeometry args={[sashWidth / 2 - 0.01, sashHeight, 0.08]} />
          <meshStandardMaterial color={frameColor} roughness={0.3} />
        </mesh>
      </group>

      {/* Реалистичный стеклопакет с отражениями и преломлением */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[width - 0.2, height - 0.2]} />
        <meshPhysicalMaterial
          color="#bae6fd"
          transparent
          opacity={0.4}
          roughness={0.05}
          metalness={0.1}
          transmission={0.92}
          ior={1.52}
          thickness={0.05}
          reflectivity={0.9}
        />
      </mesh>

      {/* Внешний металлический водоотлив (отлив) */}
      <mesh position={[0, -height / 2 - 0.02, 0.08]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.06, 0.02, 0.12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Внутренний подоконник */}
      <mesh position={[0, -height / 2 + 0.02, -0.08]} castShadow>
        <boxGeometry args={[width + 0.08, 0.03, 0.14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
    </group>
  );
}