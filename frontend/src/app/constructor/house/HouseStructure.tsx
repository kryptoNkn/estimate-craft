'use client';

import React from 'react';
import { FloorPart } from './parts/FloorPart';
import { RoofPart } from './parts/RoofPart';
import { GaragePart } from './parts/GaragePart';

interface HouseStructureProps {
  floors: number;
  width: number;
  depth: number;
  floorHeight: number;
  textureType: string;
  floorColors: string[];
  hasGarage: boolean;
  garageCars: number;
}

export function HouseStructure({
  floors,
  width,
  depth,
  floorHeight,
  textureType,
  floorColors,
  hasGarage,
  garageCars
}: HouseStructureProps) {
  return (
    <group position={[hasGarage ? -(garageCars * 3.4 + 0.6) / 2 : 0, 0, 0]}>
      {/* Плита основания дома */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[width + 0.4, 0.4, depth + 0.4]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Этажи */}
      {Array.from({ length: floors }).map((_, idx) => (
        <FloorPart
          key={idx}
          level={idx + 1}
          height={floorHeight}
          width={width}
          depth={depth}
          textureType={textureType}
          color={floorColors[idx] || '#D2C4B3'}
        />
      ))}

      {/* Крыша дома */}
      <RoofPart position={[0, floors * floorHeight + 1.1, 0]} width={width} />

      {/* Гараж */}
      {hasGarage && (
        <GaragePart
          houseWidth={width}
          depth={depth}
          textureType={textureType}
          color={floorColors[0] || '#D2C4B3'}
          carsCount={garageCars}
        />
      )}
    </group>
  );
}