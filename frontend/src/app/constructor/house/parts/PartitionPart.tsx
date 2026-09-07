'use client';

import React from 'react';

interface PartitionPartProps {
  position: [number, number, number];
  size: [number, number, number];
  materialType: string;
}

export function PartitionPart({ position, size, materialType }: PartitionPartProps) {
  const getColor = () => {
    switch (materialType) {
      case 'brick': return '#8C4333';
      case 'gasblock': return '#94a3b8';
      case 'pzg': return '#e2e8f0';
      default: return '#f1f5f9'; // drywall
    }
  };

  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={getColor()} roughness={0.8} />
    </mesh>
  );
}