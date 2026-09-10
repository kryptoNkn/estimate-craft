'use client';

import React, { useMemo } from 'react';
import type { OpeningItem } from '../../OpeningsManager';
import { WallWithOpenings } from './WallWithOpenings';
import { getOpeningWallRect } from '../utils/openingDimensions';
import {
  projectOntoWall,
  resolveOpeningOnHouseWall,
  type HouseDimensions,
  type HouseWallFace,
} from '../utils/perimeter';

interface FloorPartProps {
  level: number;
  height: number;
  width: number;
  depth: number;
  textureType: string;
  color: string;
  secondaryColor?: string;
  jointColor?: string;
  openings?: OpeningItem[];
  houseDimensions: HouseDimensions;
  floorHeight: number;
  hasPlinth?: boolean;
  plinthColor?: string;
  hasCornice?: boolean;
  corniceColor?: string;
}

const WALL_THICKNESS = 0.24;

export function FloorPart({
  level,
  height,
  width,
  depth,
  textureType,
  color,
  secondaryColor,
  jointColor,
  openings,
  houseDimensions,
  floorHeight,
  hasPlinth = false,
  plinthColor,
  hasCornice = false,
  corniceColor,
}: FloorPartProps) {
  const sideWallLength = depth - WALL_THICKNESS * 2;
  const yBase = (level - 1) * height;

  const cutoutsByFace = useMemo(() => {
    const result: Record<HouseWallFace, ReturnType<typeof getOpeningWallRect>[]> = {
      front: [],
      back: [],
      left: [],
      right: [],
    };

    for (const opening of openings ?? []) {
      if (opening.floor !== level) continue;

      const resolved = resolveOpeningOnHouseWall(opening, houseDimensions);
      if (!resolved) continue;

      const along = projectOntoWall(resolved, houseDimensions, sideWallLength);
      const rect = getOpeningWallRect(opening, along, floorHeight);

      // Вырез строится в системе координат стены, поэтому смещаем по высоте
      // на отметку этажа.
      result[resolved.face].push({
        ...rect,
        bottom: rect.bottom - yBase,
        top: rect.top - yBase,
      });
    }

    return result;
  }, [openings, level, houseDimensions, sideWallLength, floorHeight, yBase]);

  const materialRoughness =
    textureType === 'stucco' ? 0.84 : textureType === 'wood' ? 0.7 : 0.74;

  const sharedWallProps = {
    wallHeight: height,
    thickness: WALL_THICKNESS,
    textureType,
    color,
    secondaryColor,
    jointColor,
    roughness: materialRoughness,
  };

  return (
    <group position={[0, yBase, 0]}>
      {/* Межэтажное перекрытие */}
      {level > 1 && (
        <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
          <boxGeometry args={[width - 0.1, 0.14, depth - 0.1]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
        </mesh>
      )}

      <WallWithOpenings
        {...sharedWallProps}
        position={[0, 0, depth / 2 - WALL_THICKNESS / 2]}
        wallLength={width}
        cutouts={cutoutsByFace.front}
        plinth={hasPlinth}
        plinthColor={plinthColor}
        cornice={hasCornice}
        corniceColor={corniceColor}
      />

      <WallWithOpenings
        {...sharedWallProps}
        position={[0, 0, -depth / 2 + WALL_THICKNESS / 2]}
        rotation={[0, Math.PI, 0]}
        wallLength={width}
        cutouts={cutoutsByFace.back}
        plinth={hasPlinth}
        plinthColor={plinthColor}
        cornice={hasCornice}
        corniceColor={corniceColor}
      />

      <WallWithOpenings
        {...sharedWallProps}
        position={[-width / 2 + WALL_THICKNESS / 2, 0, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        wallLength={sideWallLength}
        cutouts={cutoutsByFace.left}
        plinth={hasPlinth}
        plinthColor={plinthColor}
        cornice={hasCornice}
        corniceColor={corniceColor}
      />

      {!houseDimensions.hasGarage && (
        <WallWithOpenings
          {...sharedWallProps}
          position={[width / 2 - WALL_THICKNESS / 2, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          wallLength={sideWallLength}
          cutouts={cutoutsByFace.right}
          plinth={hasPlinth}
          plinthColor={plinthColor}
          cornice={hasCornice}
          corniceColor={corniceColor}
        />
      )}

      {/* Глухая стена под пристроенным гаражом */}
      {houseDimensions.hasGarage && (
        <WallWithOpenings
          {...sharedWallProps}
          position={[width / 2 - WALL_THICKNESS / 2, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          wallLength={sideWallLength}
          cutouts={[]}
        />
      )}

      {/* Чистовой пол этажа */}
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry
          args={[width - WALL_THICKNESS * 2, 0.05, depth - WALL_THICKNESS * 2]}
        />
        <meshStandardMaterial color="#d6d3d1" roughness={0.88} />
      </mesh>
    </group>
  );
}
