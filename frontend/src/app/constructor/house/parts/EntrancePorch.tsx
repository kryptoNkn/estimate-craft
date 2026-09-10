'use client';

import React from 'react';

interface EntrancePorchProps {
  doorWidth: number;
  rise: number;
  style?: 'minimal' | 'classic';
  color?: string;
  accentColor?: string;
  withCanopy?: boolean;
}

export function EntrancePorch({
  doorWidth,
  rise,
  style = 'minimal',
  color = '#cbd5e1',
  accentColor = '#94a3b8',
  withCanopy = false,
}: EntrancePorchProps) {
  const platformWidth = doorWidth + 1.05;
  const stepCount = Math.max(2, Math.round(rise / 0.16));
  const stepHeight = rise / stepCount;
  const stepDepth = 0.3;

  return (
    <group>
      <mesh position={[0, 0.03, 0.38]} castShadow receiveShadow>
        <boxGeometry args={[platformWidth, 0.08, 0.76]} />
        <meshStandardMaterial color={color} roughness={0.78} />
      </mesh>

      {Array.from({ length: stepCount }).map((_, index) => {
        const y = -((index + 0.5) * stepHeight);
        const z = 0.76 + (index + 0.5) * stepDepth;
        const shrink = index * 0.05;

        return (
          <mesh key={index} position={[0, y, z]} castShadow receiveShadow>
            <boxGeometry args={[platformWidth - shrink, stepHeight, stepDepth]} />
            <meshStandardMaterial color={color} roughness={0.82} />
          </mesh>
        );
      })}

      {style === 'classic' && (
        <>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * (platformWidth / 2 - 0.18), 0, 0.7]}>
              <mesh position={[0, 1.28, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.12, 0.14, 2.56, 16]} />
                <meshStandardMaterial color="#fafaf9" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.05, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.2, 0.12, 16]} />
                <meshStandardMaterial color="#f5f5f4" roughness={0.6} />
              </mesh>
              <mesh position={[0, 2.52, 0]} castShadow>
                <boxGeometry args={[0.34, 0.12, 0.34]} />
                <meshStandardMaterial color="#f5f5f4" roughness={0.6} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 2.66, 0.5]} castShadow receiveShadow>
            <boxGeometry args={[platformWidth + 0.18, 0.22, 1.2]} />
            <meshStandardMaterial color="#fafaf9" roughness={0.58} />
          </mesh>
        </>
      )}

      {style === 'minimal' && withCanopy && (
        <group position={[0, 2.48, 0.52]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[platformWidth + 0.45, 0.1, 1.35]} />
            <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.25} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * (platformWidth / 2 - 0.12), 0.28, -0.45]}
              rotation={[0.48, 0, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.016, 0.016, 1.15, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
