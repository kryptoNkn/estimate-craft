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

// 3D-модель реалистичного окна
function RealisticWindowModel({ isSelected }: { isSelected: boolean }) {
  const frameColor = isSelected ? '#d4af37' : '#1e293b';
  const width = 1.4;
  const height = 1.3;
  const sashWidth = width - 0.16;
  const sashHeight = height - 0.16;

  return (
    <group>
      {/* Наружный рамный профиль */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.14]} />
        <meshStandardMaterial color={frameColor} roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Внутренняя ниша рамы */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width - 0.12, height - 0.12, 0.15]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Створки окна */}
      <group position={[0, 0, 0.01]}>
        <mesh position={[-sashWidth / 4, 0, 0]} castShadow>
          <boxGeometry args={[sashWidth / 2 - 0.01, sashHeight, 0.08]} />
          <meshStandardMaterial color={frameColor} roughness={0.3} />
        </mesh>
        <mesh position={[sashWidth / 4, 0, 0]} castShadow>
          <boxGeometry args={[sashWidth / 2 - 0.01, sashHeight, 0.08]} />
          <meshStandardMaterial color={frameColor} roughness={0.3} />
        </mesh>
      </group>

      {/* Физическое стекло с преломлением и отражением */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[width - 0.2, height - 0.2]} />
        <meshPhysicalMaterial
          color="#bae6fd"
          transparent
          opacity={0.4}
          roughness={0.05}
          metalness={0.1}
          transmission={0.92}
          ior={1.52}
          thickness={0.05}
          reflectivity={0.9}
        />
      </mesh>

      {/* Наружный металлический отлив */}
      <mesh position={[0, -height / 2 - 0.02, 0.08]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[width + 0.06, 0.02, 0.12]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Подоконник */}
      <mesh position={[0, -height / 2 + 0.02, -0.08]} castShadow>
        <boxGeometry args={[width + 0.08, 0.03, 0.14]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} />
      </mesh>
    </group>
  );
}

// 3D-модель реалистичной двери
function RealisticDoorModel({ isSelected }: { isSelected: boolean }) {
  const frameColor = isSelected ? '#d4af37' : '#1e293b';
  const width = 1.1;
  const height = 2.1;

  return (
    <group>
      {/* Дверной короб */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.16]} />
        <meshStandardMaterial color={frameColor} roughness={0.4} />
      </mesh>

      {/* Дверное полотно */}
      <mesh position={[0, 0, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[width - 0.08, height - 0.06, 0.09]} />
        <meshStandardMaterial color="#27272a" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Декоративные филенки */}
      {[-0.4, 0.2].map((yOffset, i) => (
        <mesh key={i} position={[0, yOffset, 0.058]} castShadow>
          <boxGeometry args={[width - 0.3, 0.6, 0.01]} />
          <meshStandardMaterial color="#18181b" roughness={0.5} />
        </mesh>
      ))}

      {/* Замочная планка */}
      <mesh position={[width / 2 - 0.18, -0.05, 0.06]} castShadow>
        <boxGeometry args={[0.06, 0.22, 0.01]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Дверная ручка */}
      <group position={[width / 2 - 0.18, -0.02, 0.08]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.04, 16]} />
          <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[-0.05, 0, 0.02]} castShadow>
          <boxGeometry args={[0.12, 0.025, 0.02]} />
          <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// Вычисление мировых координат и ориентации фасада
function getWallPositionAndRotation(
  offset: number,
  baseWidth: number,
  depth: number,
  hasGarage: boolean,
  garageCars: number
) {
  const garageWidth = hasGarage ? garageCars * 3.4 + 0.6 : 0;
  const totalWidth = baseWidth + garageWidth;

  const halfW = totalWidth / 2;
  const halfD = depth / 2;
  const totalPerimeter = (totalWidth + depth) * 2;

  const norm = ((offset % totalPerimeter) + totalPerimeter) % totalPerimeter;

  if (norm < totalWidth) {
    return { pos: [-halfW + norm, 0, halfD] as [number, number, number], rotY: 0 };
  } else if (norm < totalWidth + depth) {
    const d = norm - totalWidth;
    return { pos: [halfW, 0, halfD - d] as [number, number, number], rotY: Math.PI / 2 };
  } else if (norm < totalWidth * 2 + depth) {
    const d = norm - (totalWidth + depth);
    return { pos: [halfW - d, 0, -halfD] as [number, number, number], rotY: Math.PI };
  } else {
    const d = norm - (totalWidth * 2 + depth);
    return { pos: [-halfW, 0, -halfD + d] as [number, number, number], rotY: -Math.PI / 2 };
  }
}

function calculatePerimeterOffset(
  x: number,
  z: number,
  baseWidth: number,
  depth: number,
  hasGarage: boolean,
  garageCars: number
) {
  const garageWidth = hasGarage ? garageCars * 3.4 + 0.6 : 0;
  const totalWidth = baseWidth + garageWidth;

  const halfW = totalWidth / 2;
  const halfD = depth / 2;
  const totalPerimeter = (totalWidth + depth) * 2;

  const distFront = Math.abs(z - halfD);
  const distRight = Math.abs(x - halfW);
  const distBack = Math.abs(z - (-halfD));
  const distLeft = Math.abs(x - (-halfW));

  const minDist = Math.min(distFront, distRight, distBack, distLeft);

  let offset = 0;
  if (minDist === distFront) {
    offset = x + halfW;
  } else if (minDist === distRight) {
    offset = totalWidth + (halfD - z);
  } else if (minDist === distBack) {
    offset = totalWidth + depth + (halfW - x);
  } else {
    offset = totalWidth * 2 + depth + (z + halfD);
  }

  return (offset + totalPerimeter) % totalPerimeter;
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
      const newOffset = calculatePerimeterOffset(
        e.point.x,
        e.point.z,
        houseWidth,
        houseDepth,
        hasGarage,
        garageCars
      );

      setOpenings((prev) =>
        prev.map((item) => (item.id === draggingId ? { ...item, perimeterOffset: newOffset } : item))
      );
    }

    if (isDraggingVeranda && setVeranda) {
      e.stopPropagation();
      const newOffset = calculatePerimeterOffset(
        e.point.x,
        e.point.z,
        houseWidth,
        houseDepth,
        hasGarage,
        garageCars
      );

      setVeranda((prev: VerandaProps) => ({
        ...prev,
        perimeterOffset: newOffset
      }));
    }
  };

  const verandaPerimeter = veranda.perimeterOffset ?? houseWidth / 2;
  const verandaTransform = getWallPositionAndRotation(
    verandaPerimeter,
    houseWidth,
    houseDepth,
    hasGarage,
    garageCars
  );

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

          {/* Реалистичные интерактивные оконные и дверные блоки */}
          {openings.map((item) => {
            const { pos, rotY } = getWallPositionAndRotation(
              item.perimeterOffset,
              houseWidth,
              houseDepth,
              hasGarage,
              garageCars
            );
            const posY = (item.floor - 1) * floorHeight + (item.type === 'window' ? 1.4 : 1.1);
            const isSelected = draggingId === item.id;

            return (
              <group
                key={item.id}
                position={[pos[0], posY, pos[2]]}
                rotation={[0, rotY, 0]}
                onPointerDown={(e) => handlePointerDown(item.id, e)}
                onPointerUp={handlePointerUp}
                onPointerMove={handlePointerMove}
              >
                {item.type === 'window' ? (
                  <RealisticWindowModel isSelected={isSelected} />
                ) : (
                  <RealisticDoorModel isSelected={isSelected} />
                )}
              </group>
            );
          })}

          {/* Интерактивная веранда */}
          <group
            position={verandaTransform.pos}
            rotation={[0, verandaTransform.rotY, 0]}
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsDraggingVeranda(true);
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
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