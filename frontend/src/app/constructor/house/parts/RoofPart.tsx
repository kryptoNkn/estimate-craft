'use client';

import React from 'react';

export function RoofPart({ position, width }: { position: [number, number, number]; width: number }) {
  return (
    <mesh position={position} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[width * 0.85, 2.2, 4]} />
      <meshStandardMaterial color="#1e293b" roughness={0.3} />
    </mesh>
  );
}