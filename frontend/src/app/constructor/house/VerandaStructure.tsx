'use client';

import React from 'react';
import { VerandaProps } from './VerandaStructure';

interface VerandaStructureProps {
  veranda: VerandaProps;
  houseDepth: number;
}

export function VerandaStructure({ veranda }: VerandaStructureProps) {
  if (!veranda.hasVeranda) return null;

  const { width, length, fenceStyle, material, isBaseClosed } = veranda;
  const halfLength = length / 2;

  // Текстурные параметры и оттенки материалов
  const getMaterialDetails = () => {
    switch (material) {
      case 'metal':
        return { main: '#334155', accent: '#0f172a', rough: 0.3, metal: 0.7 };
      case 'wpc':
        return { main: '#4a3728', accent: '#261a10', rough: 0.5, metal: 0.0 };
      case 'wood_dark':
        return { main: '#3d2314', accent: '#1c1008', rough: 0.6, metal: 0.0 };
      case 'wood_light':
      default:
        return { main: '#b45309', accent: '#78350f', rough: 0.6, metal: 0.0 };
    }
  };

  const mat = getMaterialDetails();
  const plankCount = Math.floor(length / 0.15); // Нарезка террасных досок

  return (
    <group position={[0, 0, halfLength]}>
      {/* Закрытый цоколь */}
      {isBaseClosed && (
        <mesh position={[0, -0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[width, 0.4, length]} />
          <meshStandardMaterial color={mat.accent} roughness={0.8} />
        </mesh>
      )}

      {/* Настил из отдельных террасных досок (Decking) */}
      <group position={[0, 0.1, 0]}>
        {Array.from({ length: plankCount }).map((_, i) => {
          const zPos = -halfLength + i * 0.15 + 0.075;
          return (
            <mesh key={i} position={[0, 0, zPos]} receiveShadow castShadow>
              <boxGeometry args={[width - 0.02, 0.04, 0.14]} />
              <meshStandardMaterial
                color={mat.main}
                roughness={mat.rough}
                metalness={mat.metal}
              />
            </mesh>
          );
        })}
      </group>

      {/* Несущие опорные столбы */}
      {[
        [-width / 2 + 0.1, length / 2 - 0.1],
        [width / 2 - 0.1, length / 2 - 0.1],
        [-width / 2 + 0.1, -length / 2 + 0.1],
        [width / 2 - 0.1, -length / 2 + 0.1]
      ].map(([x, z], idx) => (
        <group key={idx} position={[x, 1.35, z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.14, 2.5, 0.14]} />
            <meshStandardMaterial color={mat.accent} roughness={0.5} />
          </mesh>
          {/* Декоративный металлический бандаж/оклад столба */}
          <mesh position={[0, -1.2, 0]}>
            <boxGeometry args={[0.16, 0.1, 0.16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Навес / Крыша веранды */}
      <group position={[0, 2.6, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[width + 0.2, 0.12, length + 0.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} />
        </mesh>
        {/* Стропильная подшивка */}
        <mesh position={[0, -0.07, 0]}>
          <boxGeometry args={[width + 0.1, 0.02, length + 0.1]} />
          <meshStandardMaterial color={mat.accent} roughness={0.6} />
        </mesh>
      </group>

      {/* Ограждение веранды */}
      {fenceStyle !== 'none' && (
        <group position={[0, 0.6, 0]}>
          {fenceStyle === 'glass' ? (
            /* Стекло панорамное */
            <mesh position={[0, 0, length / 2 - 0.04]} castShadow>
              <boxGeometry args={[width - 0.2, 0.8, 0.02]} />
              <meshPhysicalMaterial
                color="#bae6fd"
                transparent
                opacity={0.4}
                transmission={0.85}
                ior={1.5}
                roughness={0.1}
              />
            </mesh>
          ) : (
            /* Крестообразные или балясинные секции */
            <group>
              {/* Поручень */}
              <mesh position={[0, 0.4, length / 2 - 0.04]} castShadow>
                <boxGeometry args={[width - 0.2, 0.06, 0.08]} />
                <meshStandardMaterial color={mat.accent} roughness={0.4} />
              </mesh>
              {/* Заполнение крестом */}
              {fenceStyle === 'cross' && (
                <group position={[0, 0, length / 2 - 0.04]}>
                  <mesh rotation={[0, 0, 0.6]} castShadow>
                    <boxGeometry args={[width - 0.4, 0.04, 0.03]} />
                    <meshStandardMaterial color={mat.main} />
                  </mesh>
                  <mesh rotation={[0, 0, -0.6]} castShadow>
                    <boxGeometry args={[width - 0.4, 0.04, 0.03]} />
                    <meshStandardMaterial color={mat.main} />
                  </mesh>
                </group>
              )}
            </group>
          )}
        </group>
      )}
    </group>
  );
}