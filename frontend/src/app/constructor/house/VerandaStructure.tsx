'use client';

import React from 'react';
import { VerandaDecking, VerandaPillars, VerandaRoofCover, VerandaFence, VerandaBase } from './parts/VerandaParts';

export interface VerandaProps {
  hasVeranda: boolean;
  material: string;
  fenceStyle: string;
  isBaseClosed: boolean;
  width: number;
  length: number;
}

export function VerandaStructure({ veranda, houseDepth }: { veranda: VerandaProps; houseDepth: number }) {
  if (!veranda.hasVeranda) return null;

  const vWidth = veranda.width;
  const vLength = veranda.length;
  const vHeight = 2.6;
  const frontZ = houseDepth / 2 + vLength / 2;

  return (
    <group position={[0, 0, frontZ]}>
      {veranda.isBaseClosed && <VerandaBase width={vWidth} length={vLength} material={veranda.material} />}
      <VerandaDecking width={vWidth} length={vLength} material={veranda.material} />
      <VerandaPillars width={vWidth} length={vLength} height={vHeight} material={veranda.material} />
      <VerandaRoofCover width={vWidth} length={vLength} height={vHeight} />
      <VerandaFence width={vWidth} length={vLength} style={veranda.fenceStyle} material={veranda.material} />
    </group>
  );
}