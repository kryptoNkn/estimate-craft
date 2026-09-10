'use client';

import React, { useMemo } from 'react';
import type { OpeningItem } from '../OpeningsManager';
import { FloorPart } from './parts/FloorPart';
import { RoofPart, type RoofType } from './parts/RoofPart';
import { GaragePart } from './parts/GaragePart';
import { HiTechDetails } from './parts/HiTechDetails';
import { FoundationPart } from './parts/FoundationPart';
import { EntrancePorch } from './parts/EntrancePorch';
import { getOpeningSize } from './utils/openingDimensions';
import {
  getFootprintMetrics,
  getWallPositionAndRotation,
  type HouseDimensions,
} from './utils/perimeter';
import { getHouseStyleProfile } from './utils/houseStyleProfiles';
import { getMassingPlan } from './utils/houseMassing';
import { MassingVolumes, type MassingPalette } from './parts/MassingVolumes';

/** Превышение отметки чистого пола над уровнем земли */
export const GROUND_TO_FLOOR = 0.4;

interface HouseStructureProps {
  floors: number;
  width: number;
  depth: number;
  floorHeight: number;
  textureType: string;
  floorColors: string[];
  floorTextureTypes?: string[];
  jointColor?: string;
  hasGarage: boolean;
  garageCars: number;
  foundationType: string;
  roofType?: RoofType;
  architecturalStyle?: string;
  openings?: OpeningItem[];
}

export function HouseStructure({
  floors,
  width,
  depth,
  floorHeight,
  textureType,
  floorColors,
  floorTextureTypes,
  jointColor,
  hasGarage,
  garageCars,
  foundationType,
  roofType,
  architecturalStyle,
  openings = [],
}: HouseStructureProps) {
  const isHiTech = architecturalStyle === 'hi-tech';

  const profile = useMemo(
    () => getHouseStyleProfile(architecturalStyle, { roofType }),
    [architecturalStyle, roofType],
  );

  const houseDimensions: HouseDimensions = useMemo(
    () => ({ width, depth, hasGarage, garageCars }),
    [width, depth, hasGarage, garageCars],
  );

  const { garageWidth, groupShiftX } = getFootprintMetrics(houseDimensions);
  const wallTop = floors * floorHeight;

  // Входные группы строим только для дверей первого этажа.
  const entrances = useMemo(
    () =>
      openings
        .filter((item) => item.type === 'door' && item.floor === 1)
        .map((item) => {
          const { pos, rotY } = getWallPositionAndRotation(
            item.perimeterOffset,
            houseDimensions,
          );
          return {
            id: item.id,
            doorWidth: getOpeningSize(item).width,
            position: [pos[0] - groupShiftX, 0, pos[2]] as [number, number, number],
            rotationY: rotY,
          };
        }),
    [openings, houseDimensions, groupShiftX],
  );

  // Пристройки, формирующие силуэт стиля. Правые объёмы убираем, если там гараж.
  const volumes = useMemo(() => {
    const plan = getMassingPlan(architecturalStyle);
    return hasGarage ? plan.filter((volume) => volume.offset[0] < width / 2 - 1) : plan;
  }, [architecturalStyle, hasGarage, width]);

  const palette: MassingPalette = useMemo(
    () => ({
      textureType,
      primary: floorColors[0] || '#d2c4b3',
      secondary: floorColors[1] || floorColors[0] || '#d2c4b3',
      accent: profile.corniceColor,
      covering: profile.covering,
      roofColor: profile.roofColor,
      jointColor,
    }),
    [textureType, floorColors, profile, jointColor],
  );

  return (
    <group position={[groupShiftX, 0, 0]}>
      <MassingVolumes
        volumes={volumes}
        palette={palette}
        groundLevel={-GROUND_TO_FLOOR}
      />
      <FoundationPart
        width={width}
        depth={depth}
        foundationType={foundationType}
        accentColor={profile.plinthColor}
        hasGarage={hasGarage}
        garageWidth={garageWidth}
        floorToGround={GROUND_TO_FLOOR}
      />

      {Array.from({ length: floors }).map((_, idx) => (
        <FloorPart
          key={idx}
          level={idx + 1}
          height={floorHeight}
          width={width}
          depth={depth}
          textureType={floorTextureTypes?.[idx] ?? textureType}
          color={floorColors[idx] || '#D2C4B3'}
          secondaryColor={
            isHiTech
              ? idx === 0
                ? '#8B6914'
                : '#E7E5E4'
              : floorColors[idx + 1] || floorColors[idx]
          }
          jointColor={jointColor}
          openings={openings}
          houseDimensions={houseDimensions}
          floorHeight={floorHeight}
          hasPlinth={profile.plinth && idx === 0}
          plinthColor={profile.plinthColor}
          hasCornice={profile.cornice && idx === floors - 1}
          corniceColor={profile.corniceColor}
        />
      ))}

      {entrances.map((entrance) => (
        <group
          key={entrance.id}
          position={entrance.position}
          rotation={[0, entrance.rotationY, 0]}
        >
          <EntrancePorch
            doorWidth={entrance.doorWidth}
            rise={GROUND_TO_FLOOR}
            style={profile.windowTrim === 'classic' ? 'classic' : 'minimal'}
            color={profile.plinthColor}
            accentColor={profile.roofAccent}
            withCanopy={profile.roofType === 'flat'}
          />
        </group>
      ))}

      {isHiTech && (
        <HiTechDetails
          width={width}
          depth={depth}
          floorHeight={floorHeight}
          floors={floors}
          groundLevel={-GROUND_TO_FLOOR}
        />
      )}

      <RoofPart
        position={[0, wallTop, 0]}
        width={width}
        depth={depth}
        roofType={profile.roofType}
        covering={profile.covering}
        color={profile.roofColor}
        accentColor={profile.roofAccent}
        pitch={profile.pitch}
        overhang={profile.overhang}
        gableTextureType={floorTextureTypes?.[floors - 1] ?? textureType}
        gableColor={floorColors[floors - 1] || floorColors[0] || '#D2C4B3'}
        gableSecondaryColor={floorColors[0]}
        jointColor={jointColor}
        hasChimney={profile.chimney}
        downpipeHeight={wallTop + GROUND_TO_FLOOR}
      />

      {hasGarage && (
        <GaragePart
          houseWidth={width}
          depth={depth}
          textureType={textureType}
          color={floorColors[0] || '#D2C4B3'}
          secondaryColor={floorColors[1] || floorColors[0]}
          jointColor={jointColor}
          carsCount={garageCars}
          roofColor={profile.roofAccent}
          groundLevel={-GROUND_TO_FLOOR}
        />
      )}
    </group>
  );
}
