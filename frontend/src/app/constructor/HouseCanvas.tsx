'use client';

import React, { useState, Suspense } from 'react';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import { HouseStructure } from './house/HouseStructure';
import { InteriorStructure } from './house/InteriorStructure';
import { VerandaStructure, VerandaProps } from './house/VerandaStructure';
import { OpeningItem } from './OpeningsManager';

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
  veranda: VerandaProps;
  setVeranda?: React.Dispatch<React.SetStateAction<VerandaProps>>;
  openings: OpeningItem[];
  setOpenings: React.Dispatch<React.SetStateAction<OpeningItem[]>>;
}

function getWallPositionAndRotation(offset: number, width: number, depth: number) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const total = (width + depth) * 2;
  const norm = ((offset % total) + total) % total;

  if (norm < width) {
    return { pos: [-halfW + norm, 0, halfD] as [number, number, number], rotY: 0 };
  } else if (norm < width + depth) {
    const d = norm - width;
    return { pos: [halfW, 0, halfD - d] as [number, number, number], rotY: -Math.PI / 2 };
  } else if (norm < width * 2 + depth) {
    const d = norm - (width + depth);
    return { pos: [halfW - d, 0, -halfD] as [number, number, number], rotY: Math.PI };
  } else {
    const d = norm - (width * 2 + depth);
    return { pos: [-halfW, 0, -halfD + d] as [number, number, number], rotY: Math.PI / 2 };
  }
}

function calculatePerimeterOffset(x: number, z: number, width: number, depth: number) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const total = (width + depth) * 2;

  const distFront = Math.abs(z - halfD);
  const distRight = Math.abs(x - halfW);
  const distBack = Math.abs(z - (-halfD));
  const distLeft = Math.abs(x - (-halfW));

  const minDist = Math.min(distFront, distRight, distBack, distLeft);

  let offset = 0;
  if (minDist === distFront) {
    offset = x + halfW;
  } else if (minDist === distRight) {
    offset = width + (halfD - z);
  } else if (minDist === distBack) {
    offset = width + depth + (halfW - x);
  } else {
    offset = width * 2 + depth + (z + halfD);
  }

  return (offset + total) % total;
}

export default function HouseCanvas({
  activeTab,
  floors,
  floorColors,
  rooms,
  partitionMaterial,
  hasGarage,
  garageCars,
  textureType,
  veranda,
  setVeranda,
  openings,
  setOpenings
}: HouseCanvasProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDraggingVeranda, setIsDraggingVeranda] = useState(false);

  const houseWidth = 8;
  const houseDepth = 8;
  const floorHeight = 2.8;

  const handlePointerDown = (id: string, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setDraggingId(id);
  };

  const handlePointerUp = () => {
    setDraggingId(null);
    setIsDraggingVeranda(false);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!e.point) return;

    if (draggingId) {
      e.stopPropagation();
      const localX = e.point.x + (hasGarage ? (garageCars * 3.4 + 0.6) / 2 : 0);
      const localZ = e.point.z;
      const newOffset = calculatePerimeterOffset(localX, localZ, houseWidth, houseDepth);

      setOpenings((prev) =>
        prev.map((item) => (item.id === draggingId ? { ...item, perimeterOffset: newOffset } : item))
      );
    }

    if (isDraggingVeranda && setVeranda) {
      e.stopPropagation();
      const computedLength = e.point.z - houseDepth / 2;
      const clampedLength = Math.max(1.0, Math.min(5.0, computedLength));
      setVeranda((prev) => ({
        ...prev,
        length: Number(clampedLength.toFixed(1))
      }));
    }
  };

  return (
    <div 
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'hidden' }}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Canvas
        shadows
        gl={{ powerPreference: 'high-performance', antialias: true, preserveDrawingBuffer: true }}
        camera={{ position: [12, 8, 14], fov: 45 }}
        style={{ width: '100%', height: '100%', background: '#0f172a' }}
      >
        <ambientLight intensity={0.7} />
        <hemisphereLight intensity={0.4} groundColor="#0f172a" />
        <directionalLight position={[15, 20, 10]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />

        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>

        <group position={[0, -1, 0]}>
          <HouseStructure
            floors={floors}
            width={houseWidth}
            depth={houseDepth}
            floorHeight={floorHeight}
            textureType={textureType}
            floorColors={floorColors}
            hasGarage={hasGarage}
            garageCars={garageCars}
          />

          <InteriorStructure
            rooms={rooms}
            floors={floors}
            partitionMaterial={partitionMaterial}
            houseWidth={houseWidth}
            houseDepth={houseDepth}
            floorHeight={floorHeight}
            activeTab={activeTab}
          />

          {openings.map((item) => {
            const { pos, rotY } = getWallPositionAndRotation(item.perimeterOffset, houseWidth, houseDepth);
            const posY = (item.floor - 1) * floorHeight + (item.type === 'window' ? 1.4 : 1.1);
            const isSelected = draggingId === item.id;

            return (
              <group
                key={item.id}
                position={[
                  pos[0] - (hasGarage ? (garageCars * 3.4 + 0.6) / 2 : 0),
                  posY,
                  pos[2]
                ]}
                rotation={[0, rotY, 0]}
                onPointerDown={(e) => handlePointerDown(item.id, e)}
                onPointerUp={handlePointerUp}
                onPointerMove={handlePointerMove}
              >
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[item.type === 'window' ? 1.4 : 1.1, item.type === 'window' ? 1.3 : 2.1, 0.22]} />
                  <meshStandardMaterial
                    color={item.type === 'window' ? '#38bdf8' : '#78350f'}
                    roughness={0.2}
                    metalness={0.8}
                    emissive={isSelected ? '#d4af37' : '#000000'}
                    emissiveIntensity={isSelected ? 0.6 : 0}
                  />
                </mesh>
              </group>
            );
          })}

          <group
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsDraggingVeranda(true);
            }}
            onPointerMove={handlePointerMove}
          >
            <VerandaStructure veranda={veranda} houseDepth={houseDepth} />
          </group>

          <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={25} blur={1.5} far={8} />
        </group>

        <OrbitControls
          makeDefault
          enabled={!draggingId && !isDraggingVeranda}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
}