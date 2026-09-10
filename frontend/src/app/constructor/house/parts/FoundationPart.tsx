'use client';

import React from 'react';

interface FoundationPartProps {
  width: number;
  depth: number;
  foundationType: string;
  accentColor?: string;
  hasGarage?: boolean;
  garageWidth?: number;
  floorToGround?: number;
}

export function FoundationPart({
  width,
  depth,
  foundationType,
  accentColor = '#334155',
  hasGarage = false,
  garageWidth = 0,
  floorToGround = 0.4,
}: FoundationPartProps) {
  const totalWidth = width + (hasGarage ? garageWidth : 0);
  const offsetX = hasGarage ? garageWidth / 2 : 0;
  const drop = floorToGround;
  const buried = 0.35;

  if (foundationType === 'pile') {
    const pilePositions: [number, number][] = [
      [-totalWidth / 2 + 0.55, -depth / 2 + 0.55],
      [totalWidth / 2 - 0.55, -depth / 2 + 0.55],
      [-totalWidth / 2 + 0.55, depth / 2 - 0.55],
      [totalWidth / 2 - 0.55, depth / 2 - 0.55],
      [0, 0],
      [-totalWidth / 4, depth / 4],
      [totalWidth / 4, -depth / 4],
    ];
    const pileH = drop + buried + 0.2;

    return (
      <group position={[-offsetX, 0, 0]}>
        {pilePositions.map(([x, z], index) => (
          <mesh key={index} position={[x, -drop / 2 - buried / 2, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.13, 0.16, pileH, 12]} />
            <meshStandardMaterial color="#64748b" roughness={0.55} metalness={0.15} />
          </mesh>
        ))}
        <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
          <boxGeometry args={[totalWidth + 0.2, 0.16, depth + 0.2]} />
          <meshStandardMaterial color={accentColor} roughness={0.82} />
        </mesh>
      </group>
    );
  }

  if (foundationType === 'tape') {
    const stripW = 0.5;
    const stripH = drop + buried;

    return (
      <group position={[-offsetX, 0, 0]}>
        <mesh position={[0, -stripH / 2 + 0.04, depth / 2 - stripW / 2]} castShadow receiveShadow>
          <boxGeometry args={[totalWidth + stripW, stripH, stripW]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        <mesh position={[0, -stripH / 2 + 0.04, -depth / 2 + stripW / 2]} castShadow receiveShadow>
          <boxGeometry args={[totalWidth + stripW, stripH, stripW]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        <mesh position={[-totalWidth / 2 + stripW / 2, -stripH / 2 + 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[stripW, stripH, depth]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        <mesh position={[totalWidth / 2 - stripW / 2, -stripH / 2 + 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[stripW, stripH, depth]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.02, 0]} receiveShadow>
          <boxGeometry args={[totalWidth + 0.12, 0.1, depth + 0.12]} />
          <meshStandardMaterial color={accentColor} roughness={0.75} />
        </mesh>
      </group>
    );
  }

  const slabH = drop + buried;

  return (
    <group position={[-offsetX, 0, 0]}>
      <mesh position={[0, -slabH / 2 + 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[totalWidth + 0.45, slabH, depth + 0.45]} />
        <meshStandardMaterial color="#64748b" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[totalWidth + 0.28, 0.12, depth + 0.28]} />
        <meshStandardMaterial color={accentColor} roughness={0.7} />
      </mesh>
    </group>
  );
}
