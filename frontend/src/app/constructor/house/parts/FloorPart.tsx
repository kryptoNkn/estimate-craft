'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createFacadeTexture } from '@/utils/facadeMaterials';

interface FloorPartProps {
  level: number;
  height: number;
  width: number;
  depth: number;
  textureType: string;
  color: string;
  secondaryColor?: string; // Добавили проп акцентного/второстепенного цвета
}

export function FloorPart({ 
  level, 
  height, 
  width, 
  depth, 
  textureType, 
  color, 
  secondaryColor 
}: FloorPartProps) {
  const wallThickness = 0.2;

  // Безопасное получение текстур с передачей primaryColor и secondaryColor
  const { map, normalMap } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { map: null, normalMap: null };
    }
    try {
      // Передаем secondaryColor из пропсов.
      // Если secondaryColor не задан, прокидываем color (для создания однотонного или мягко-автоматического градиента)
      const targetSecondary = secondaryColor || color;
      
      const result = createFacadeTexture(textureType, color, targetSecondary);
      return {
        map: result?.map || null,
        normalMap: result?.normalMap || null,
      };
    } catch (e) {
      console.error('Ошибка генерации текстуры:', e);
      return { map: null, normalMap: null };
    }
  }, [textureType, color, secondaryColor]);

  return (
    <group position={[0, (level - 1) * height, 0]}>
      {/* Передняя стена */}
      <mesh position={[0, height / 2, depth / 2 - wallThickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color="#ffffff" map={map} normalMap={normalMap} roughness={0.6} />
      </mesh>
      
      {/* Задняя стена */}
      <mesh position={[0, height / 2, -depth / 2 + wallThickness / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, wallThickness]} />
        <meshStandardMaterial color="#ffffff" map={map} normalMap={normalMap} roughness={0.6} />
      </mesh>
      
      {/* Левая стена */}
      <mesh position={[-width / 2 + wallThickness / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, depth - wallThickness * 2]} />
        <meshStandardMaterial color="#ffffff" map={map} normalMap={normalMap} roughness={0.6} />
      </mesh>
      
      {/* Правая стена */}
      <mesh position={[width / 2 - wallThickness / 2, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[wallThickness, height, depth - wallThickness * 2]} />
        <meshStandardMaterial color="#ffffff" map={map} normalMap={normalMap} roughness={0.6} />
      </mesh>
    </group>
  );
}