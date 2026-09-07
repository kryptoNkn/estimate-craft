'use client';

import React from 'react';
import { PartitionPart } from './parts/PartitionPart';

interface InteriorStructureProps {
  rooms: number;
  floors: number;
  partitionMaterial: string;
  houseWidth: number;
  houseDepth: number;
  floorHeight: number;
  activeTab: string;
}

export function InteriorStructure({
  rooms,
  floors,
  partitionMaterial,
  houseWidth,
  houseDepth,
  floorHeight,
  activeTab
}: InteriorStructureProps) {
  // Перегородки показываются при активной вкладке "interior"
  if (activeTab !== 'interior') return null;

  return (
    <group>
      {Array.from({ length: floors }).map((_, floorIdx) => {
        const yOffset = floorIdx * floorHeight + floorHeight / 2;

        return (
          <group key={floorIdx}>
            {/* Главная продольная перегородка */}
            <PartitionPart
              position={[0, yOffset, 0]}
              size={[0.15, floorHeight - 0.1, houseDepth - 0.4]}
              materialType={partitionMaterial}
            />

            {/* Поперечные перегородки в зависимости от числа комнат */}
            {rooms >= 2 && (
              <PartitionPart
                position={[-houseWidth / 4, yOffset, 0]}
                size={[houseWidth / 2 - 0.2, floorHeight - 0.1, 0.15]}
                materialType={partitionMaterial}
              />
            )}

            {rooms >= 3 && (
              <PartitionPart
                position={[houseWidth / 4, yOffset, 1]}
                size={[houseWidth / 2 - 0.2, floorHeight - 0.1, 0.15]}
                materialType={partitionMaterial}
              />
            )}

            {rooms >= 4 && (
              <PartitionPart
                position={[houseWidth / 4, yOffset, -1]}
                size={[houseWidth / 2 - 0.2, floorHeight - 0.1, 0.15]}
                materialType={partitionMaterial}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}