'use client';

import React from 'react';

interface GaragePartProps {
  houseWidth: number;
  depth: number;
  textureType: string;
  color: string;
  carsCount: number;
}

export function GaragePart({ houseWidth, depth, color, carsCount }: GaragePartProps) {
  const garageWidth = carsCount * 3.4 + 0.6;
  const garageHeight = 2.8;

  // Позиционирование справа от основного корпуса дома
  const posX = houseWidth / 2 + garageWidth / 2;

  return (
    <group position={[posX, 0, 0]}>
      {/* Фундамент гаража */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[garageWidth + 0.2, 0.4, depth + 0.2]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Основной корпус гаража */}
      <mesh position={[0, garageHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[garageWidth, garageHeight, depth]} />
        <meshStandardMaterial color={color || '#64748b'} roughness={0.5} />
      </mesh>

      {/* Крыша гаража */}
      <mesh position={[0, garageHeight + 0.15, 0]} castShadow>
        <boxGeometry args={[garageWidth + 0.3, 0.3, depth + 0.3]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} />
      </mesh>

      {/* Автоматические ворота */}
      {Array.from({ length: carsCount }).map((_, idx) => {
        const xPos = -garageWidth / 2 + 2.0 + idx * 3.4;
        return (
          <group key={idx} position={[xPos, 1.2, depth / 2 + 0.02]}>
            <mesh castShadow>
              <planeGeometry args={[2.8, 2.2]} />
              <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.5} />
            </mesh>
            {[-0.8, -0.3, 0.2, 0.7].map((y, sIdx) => (
              <mesh key={sIdx} position={[0, y, 0.01]}>
                <boxGeometry args={[2.76, 0.04, 0.01]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}