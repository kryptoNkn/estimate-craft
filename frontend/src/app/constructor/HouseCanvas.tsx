'use client';

import React, { useMemo, useState, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
import { HouseStructure, GROUND_TO_FLOOR } from './house/HouseStructure';
import { InteriorStructure } from './house/InteriorStructure';
import { VerandaStructure, VerandaProps } from './house/VerandaStructure';
import { OpeningItem } from './OpeningsManager';
import { OpeningModel } from './house/parts/OpeningModels';
import { getOpeningCenterY } from './house/utils/openingDimensions';
import {
  calculatePerimeterOffset,
  getWallPositionAndRotation,
  type HouseDimensions,
} from './house/utils/perimeter';
import { getHouseStyleProfile } from './house/utils/houseStyleProfiles';
import { SceneEnvironment, SceneLighting } from './house/parts/SceneEnvironment';
import { SportsCar } from './house/parts/SportsCar';
import type { RoofType } from './house/parts/RoofPart';

interface HouseCanvasProps {
  activeTab: string;
  floors: number;
  floorColors: string[];
  foundationType: string;
  rooms: number;
  partitionMaterial: string;
  hasGarage: boolean;
  garageCars: number;
  textureType: string;
  floorTextureTypes?: string[];
  roofType?: RoofType;
  architecturalStyle?: string;
  jointColor?: string;
  veranda: VerandaProps;
  setVeranda?: React.Dispatch<React.SetStateAction<VerandaProps>>;
  openings: OpeningItem[];
  setOpenings: React.Dispatch<React.SetStateAction<OpeningItem[]>>;
}

const HOUSE_WIDTH = 8;
const HOUSE_DEPTH = 8;
const FLOOR_HEIGHT = 2.9;

export default function HouseCanvas({
  activeTab,
  floors,
  floorColors,
  foundationType,
  rooms,
  partitionMaterial,
  hasGarage,
  garageCars,
  textureType,
  floorTextureTypes,
  roofType,
  architecturalStyle,
  jointColor,
  veranda,
  setVeranda,
  openings,
  setOpenings,
}: HouseCanvasProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDraggingVeranda, setIsDraggingVeranda] = useState(false);

  const houseDimensions: HouseDimensions = useMemo(
    () => ({
      width: HOUSE_WIDTH,
      depth: HOUSE_DEPTH,
      hasGarage,
      garageCars,
    }),
    [hasGarage, garageCars],
  );

  const profile = useMemo(
    () => getHouseStyleProfile(architecturalStyle, { roofType }),
    [architecturalStyle, roofType],
  );

  const handlePointerDown = (id: string, event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setDraggingId(id);
  };

  const handlePointerUp = () => {
    setDraggingId(null);
    setIsDraggingVeranda(false);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!event.point) return;

    if (draggingId) {
      event.stopPropagation();
      const newOffset = calculatePerimeterOffset(event.point.x, event.point.z, houseDimensions);
      setOpenings((prev) =>
        prev.map((item) =>
          item.id === draggingId ? { ...item, perimeterOffset: newOffset } : item,
        ),
      );
    }

    if (isDraggingVeranda && setVeranda) {
      event.stopPropagation();
      const newOffset = calculatePerimeterOffset(event.point.x, event.point.z, houseDimensions);
      setVeranda((prev) => ({ ...prev, perimeterOffset: newOffset }));
    }
  };

  const verandaTransform = getWallPositionAndRotation(
    veranda.perimeterOffset ?? HOUSE_WIDTH / 2,
    houseDimensions,
  );

  return (
    <div
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        gl={{
          powerPreference: 'high-performance',
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        style={{ width: '100%', height: '100%', background: '#cfe4f7' }}
      >
        <PerspectiveCamera makeDefault position={[23, 12.5, 27]} fov={35} near={0.3} far={400} />

        <SceneLighting />

        <Suspense fallback={null}>
          <Environment preset="park" environmentIntensity={0.55} />
          <SceneEnvironment drivewayX={hasGarage ? HOUSE_WIDTH / 2 : 0} />
        </Suspense>

        <SportsCar
          position={
            hasGarage
              ? [HOUSE_WIDTH / 2, 0, HOUSE_DEPTH / 2 + 3.7]
              : [0, 0, HOUSE_DEPTH / 2 + 6.4]
          }
          rotationY={hasGarage ? 0.11 : -0.16}
        />

        <group position={[0, GROUND_TO_FLOOR, 0]}>
          <HouseStructure
            floors={floors}
            width={HOUSE_WIDTH}
            depth={HOUSE_DEPTH}
            floorHeight={FLOOR_HEIGHT}
            textureType={textureType}
            floorColors={floorColors}
            floorTextureTypes={floorTextureTypes}
            jointColor={jointColor}
            hasGarage={hasGarage}
            garageCars={garageCars}
            foundationType={foundationType}
            roofType={roofType}
            architecturalStyle={architecturalStyle}
            openings={openings}
          />

          <InteriorStructure
            rooms={rooms}
            floors={floors}
            partitionMaterial={partitionMaterial}
            houseWidth={HOUSE_WIDTH}
            houseDepth={HOUSE_DEPTH}
            floorHeight={FLOOR_HEIGHT}
            activeTab={activeTab}
          />

          {openings.map((item) => {
            const { pos, rotY } = getWallPositionAndRotation(item.perimeterOffset, houseDimensions);

            return (
              <group
                key={item.id}
                position={[pos[0], getOpeningCenterY(item, FLOOR_HEIGHT), pos[2]]}
                rotation={[0, rotY, 0]}
                onPointerDown={(event) => handlePointerDown(item.id, event)}
                onPointerUp={handlePointerUp}
                onPointerMove={handlePointerMove}
              >
                <OpeningModel
                  item={item}
                  isSelected={draggingId === item.id}
                  wallThickness={0.24}
                  frameColor={profile.windowFrame}
                  trim={profile.windowTrim}
                  trimColor={profile.trimColor}
                />
              </group>
            );
          })}

          <group
            position={verandaTransform.pos}
            rotation={[0, verandaTransform.rotY, 0]}
            onPointerDown={(event) => {
              event.stopPropagation();
              setIsDraggingVeranda(true);
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <VerandaStructure
              veranda={veranda}
              houseDepth={HOUSE_DEPTH}
              groundLevel={-GROUND_TO_FLOOR}
              architecturalStyle={architecturalStyle}
            />
          </group>
        </group>

        <ContactShadows
          position={[0, 0.03, 0]}
          opacity={0.55}
          scale={40}
          blur={2.4}
          far={14}
          resolution={1024}
          color="#1f2a13"
        />

        <OrbitControls
          makeDefault
          enabled={!draggingId && !isDraggingVeranda}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          target={[0, 3, 0]}
          maxPolarAngle={Math.PI / 2 - 0.06}
          minDistance={11}
          maxDistance={70}
        />
      </Canvas>
    </div>
  );
}
