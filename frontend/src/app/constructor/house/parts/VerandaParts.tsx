'use client';

import React from 'react';

function getMaterialColor(material: string) {
  switch (material) {
    case 'metal':
      return { main: '#334155', accent: '#0f172a', roughness: 0.3 };
    case 'stone':
      return { main: '#64748b', accent: '#475569', roughness: 0.8 };
    case 'wood':
    default:
      return { main: '#b45309', accent: '#451a03', roughness: 0.7 };
  }
}

export function VerandaBase({ width, length, material }: { width: number; length: number; material: string }) {
  const colors = getMaterialColor(material);
  return (
    <mesh position={[0, -0.2, 0]} receiveShadow castShadow>
      <boxGeometry args={[width, 0.4, length]} />
      <meshStandardMaterial color={colors.accent} roughness={0.9} />
    </mesh>
  );
}

export function VerandaDecking({ width, length, material }: { width: number; length: number; material: string }) {
  const colors = getMaterialColor(material);
  return (
    <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
      <boxGeometry args={[width, 0.2, length]} />
      <meshStandardMaterial color={colors.main} roughness={colors.roughness} />
    </mesh>
  );
}

export function VerandaPillars({ width, length, height, material }: { width: number; length: number; height: number; material: string }) {
  const colors = getMaterialColor(material);
  return (
    <>
      {[-width / 2 + 0.1, width / 2 - 0.1].map((x, i) => (
        <mesh key={i} position={[x, height / 2 + 0.2, length / 2 - 0.1]} castShadow>
          <boxGeometry args={[0.12, height, 0.12]} />
          <meshStandardMaterial color={colors.accent} roughness={colors.roughness} />
        </mesh>
      ))}
    </>
  );
}

export function VerandaRoofCover({ width, length, height }: { width: number; length: number; height: number }) {
  return (
    <mesh position={[0, height + 0.2, 0]} castShadow>
      <boxGeometry args={[width + 0.2, 0.1, length + 0.2]} />
      <meshStandardMaterial color="#1e293b" roughness={0.4} />
    </mesh>
  );
}

export function VerandaFence({ width, length, style, material }: { width: number; length: number; style: string; material: string }) {
  if (style === 'none') return null;
  const colors = getMaterialColor(material);

  return (
    <group position={[0, 0.6, 0]}>
      <mesh position={[0, 0, length / 2 - 0.04]} castShadow>
        <boxGeometry args={[width - 0.2, 0.7, 0.03]} />
        <meshStandardMaterial color={colors.accent} wireframe={style === 'cross'} roughness={colors.roughness} />
      </mesh>
      <mesh position={[-width / 2 + 0.04, 0, 0]} castShadow>
        <boxGeometry args={[0.03, 0.7, length - 0.2]} />
        <meshStandardMaterial color={colors.accent} wireframe={style === 'cross'} roughness={colors.roughness} />
      </mesh>
      <mesh position={[width / 2 - 0.04, 0, 0]} castShadow>
        <boxGeometry args={[0.03, 0.7, length - 0.2]} />
        <meshStandardMaterial color={colors.accent} wireframe={style === 'cross'} roughness={colors.roughness} />
      </mesh>
    </group>
  );
}