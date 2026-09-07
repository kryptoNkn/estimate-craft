'use client';

import React, { useState } from 'react';
import * as THREE from 'three';
import { OpeningItem } from '../OpeningsManager';

interface InteractiveOpeningsProps {
  openings: OpeningItem[];
  setOpenings: React.Dispatch<React.SetStateAction<OpeningItem[]>>;
  houseWidth: number;
  houseDepth: number;
  floorHeight: number;
}

function WindowModel({ isSelected }: { isSelected: boolean }) {
  return (
    <group>
      {/* Рама */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.4, 0.12]} />
        <meshStandardMaterial color={isSelected ? '#3b82f6' : '#1e293b'} roughness={0.3} />
      </mesh>
      {/* Внутренний импост */}
      <mesh position={[0, 0, 0.02]} castShadow>
        <boxGeometry args={[0.08, 1.24, 0.1]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Физическое стекло */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshPhysicalMaterial
          color="#bae6fd"
          transparent={true}
          opacity={0.35}
          roughness={0.05}
          transmission={0.9}
          ior={1.5}
        />
      </mesh>
    </group>
  );
}

function DoorModel({ isSelected }: { isSelected: boolean }) {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.1, 2.15, 0.14]} />
        <meshStandardMaterial color={isSelected ? '#3b82f6' : '#0f172a'} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.01]} castShadow>
        <boxGeometry args={[1.0, 2.05, 0.09]} />
        <meshStandardMaterial color="#27272a" roughness={0.5} />
      </mesh>
      {/* Металлическая ручка */}
      <mesh position={[0.4, -0.05, 0.08]} castShadow>
        <boxGeometry args={[0.04, 0.18, 0.06]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}

export function InteractiveOpenings({
  openings,
  setOpenings,
  houseWidth,
  houseDepth,
  floorHeight
}: InteractiveOpeningsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const totalPerimeter = (houseWidth + houseDepth) * 2;

  // Вычисление позиции по периметру
  const getCoordinates = (offset: number, floor: number, type: string) => {
    let normOffset = offset % totalPerimeter;
    if (normOffset < 0) normOffset += totalPerimeter;

    const yPos = (floor - 1) * floorHeight + (type === 'door' ? 1.05 : 1.5);
    let pos: [number, number, number] = [0, yPos, 0];
    let rot: [number, number, number] = [0, 0, 0];

    if (normOffset <= houseWidth) {
      pos = [normOffset - houseWidth / 2, yPos, houseDepth / 2 + 0.02];
      rot = [0, 0, 0];
    } else if (normOffset <= houseWidth + houseDepth) {
      const side = normOffset - houseWidth;
      pos = [houseWidth / 2 + 0.02, yPos, houseDepth / 2 - side];
      rot = [0, Math.PI / 2, 0];
    } else if (normOffset <= houseWidth * 2 + houseDepth) {
      const back = normOffset - (houseWidth + houseDepth);
      pos = [houseWidth / 2 - back, yPos, -houseDepth / 2 - 0.02];
      rot = [0, Math.PI, 0];
    } else {
      const left = normOffset - (houseWidth * 2 + houseDepth);
      pos = [-houseWidth / 2 - 0.02, yPos, -houseDepth / 2 + left];
      rot = [0, -Math.PI / 2, 0];
    }

    return { pos, rot };
  };

  return (
    <group>
      {/* Невидимая плоскость перехвата клика/перетаскивания по стенам */}
      <mesh
        visible={false}
        onPointerMove={(e) => {
          if (!activeId) return;
          e.stopPropagation();
          const p = e.point;

          // Рассчитываем прямой офсет клика по периметру фасада
          let newOffset = 0;
          if (Math.abs(p.z - houseDepth / 2) < 0.5) {
            newOffset = p.x + houseWidth / 2;
          } else if (Math.abs(p.x - houseWidth / 2) < 0.5) {
            newOffset = houseWidth + (houseDepth / 2 - p.z);
          } else if (Math.abs(p.z + houseDepth / 2) < 0.5) {
            newOffset = houseWidth + houseDepth + (houseWidth / 2 - p.x);
          } else if (Math.abs(p.x + houseWidth / 2) < 0.5) {
            newOffset = houseWidth * 2 + houseDepth + (p.z + houseDepth / 2);
          }

          setOpenings((prev) =>
            prev.map((item) => (item.id === activeId ? { ...item, perimeterOffset: newOffset } : item))
          );
        }}
        onPointerUp={() => setActiveId(null)}
      >
        <boxGeometry args={[houseWidth + 1, floorHeight * 5, houseDepth + 1]} />
        <meshBasicMaterial />
      </mesh>

      {/* Окна и двери */}
      {openings.map((item) => {
        const { pos, rot } = getCoordinates(item.perimeterOffset, item.floor, item.type);
        const isSelected = activeId === item.id;

        return (
          <group
            key={item.id}
            position={pos}
            rotation={rot}
            onPointerDown={(e) => {
              e.stopPropagation();
              setActiveId(item.id);
            }}
          >
            {item.type === 'window' ? (
              <WindowModel isSelected={isSelected} />
            ) : (
              <DoorModel isSelected={isSelected} />
            )}
          </group>
        );
      })}
    </group>
  );
}