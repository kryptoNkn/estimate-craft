'use client';

import React from 'react';
import { getOpeningSize } from '../utils/openingDimensions';
import type { OpeningItem } from '../../OpeningsManager';

interface OpeningModelProps {
  item: OpeningItem;
  isSelected?: boolean;
  /** Толщина стены — по ней строится глубина откосов */
  wallThickness?: number;
  frameColor?: string;
  trim?: 'none' | 'classic';
  trimColor?: string;
}

const GLASS = {
  color: '#cfe4f7',
  transparent: true,
  opacity: 0.3,
  roughness: 0.02,
  transmission: 0.94,
  ior: 1.52,
  thickness: 0.05,
  reflectivity: 0.9,
} as const;

export function OpeningModel({
  item,
  isSelected = false,
  wallThickness = 0.22,
  frameColor,
  trim = 'none',
  trimColor = '#f8fafc',
}: OpeningModelProps) {
  const size = getOpeningSize(item);
  const accent = isSelected ? '#d4af37' : frameColor ?? '#2f3640';

  return (
    <group>
      <OpeningReveal size={size} wallThickness={wallThickness} isDoor={item.type === 'door'} />

      {trim === 'classic' && <ClassicTrim size={size} color={trimColor} />}

      {item.type === 'window' ? (
        item.variant === 'panoramic' ? (
          <PanoramicSash size={size} accent={accent} />
        ) : (
          <CasementSash size={size} accent={accent} />
        )
      ) : item.variant === 'minimal' ? (
        <GlassLeaf size={size} accent={accent} />
      ) : (
        <PanelLeaf size={size} accent={accent} />
      )}
    </group>
  );
}

type Size = ReturnType<typeof getOpeningSize>;

/** Четверти и откосы — благодаря им в проёме читается толщина стены */
function OpeningReveal({
  size,
  wallThickness,
  isDoor,
}: {
  size: Size;
  wallThickness: number;
  isDoor: boolean;
}) {
  const jamb = 0.07;
  const inner = wallThickness + 0.02;

  return (
    <group position={[0, 0, -wallThickness / 2 + 0.02]}>
      {/* Боковые откосы */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (size.width / 2 - jamb / 2), 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[jamb, size.height, inner]} />
          <meshStandardMaterial color="#eef2f7" roughness={0.62} />
        </mesh>
      ))}

      {/* Верхний откос / перемычка */}
      <mesh position={[0, size.height / 2 - jamb / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[size.width, jamb, inner]} />
        <meshStandardMaterial color="#eef2f7" roughness={0.62} />
      </mesh>

      {/* Нижний откос — для окон это подоконная четверть */}
      {!isDoor && (
        <mesh position={[0, -size.height / 2 + jamb / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[size.width, jamb, inner]} />
          <meshStandardMaterial color="#eef2f7" roughness={0.62} />
        </mesh>
      )}

      {/* Тёмная глубина помещения за проёмом */}
      <mesh position={[0, 0, -inner / 2 - 0.01]}>
        <planeGeometry args={[size.width, size.height]} />
        <meshStandardMaterial color="#0b1220" roughness={0.95} />
      </mesh>
    </group>
  );
}

function ClassicTrim({ size, color }: { size: Size; color: string }) {
  const band = 0.13;

  return (
    <group position={[0, 0, 0.06]}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (size.width / 2 + band / 2), 0, 0]} castShadow>
          <boxGeometry args={[band, size.height + band * 2, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, size.height / 2 + band / 2, 0]} castShadow>
        <boxGeometry args={[size.width + band * 2 + 0.1, band, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, -size.height / 2 - band / 2, 0]} castShadow>
        <boxGeometry args={[size.width + band * 2, band * 0.8, 0.07]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

function CasementSash({ size, accent }: { size: Size; accent: string }) {
  const frame = 0.06;
  const sashWidth = (size.width - frame * 3) / 2;

  return (
    <group>
      {/* Коробка */}
      <FrameRing width={size.width} height={size.height} band={frame} depth={0.09} color={accent} />

      {/* Импост */}
      <mesh position={[0, 0, 0.005]} castShadow>
        <boxGeometry args={[frame, size.height - frame * 2, 0.085]} />
        <meshStandardMaterial color={accent} roughness={0.3} metalness={0.15} />
      </mesh>

      {/* Створки со стеклопакетом */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (sashWidth / 2 + frame / 2), 0, 0.02]}>
          <FrameRing
            width={sashWidth}
            height={size.height - frame * 2}
            band={0.045}
            depth={0.06}
            color={accent}
          />
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[sashWidth - 0.09, size.height - frame * 2 - 0.09]} />
            <meshPhysicalMaterial {...GLASS} />
          </mesh>
        </group>
      ))}

      {/* Отлив и подоконник */}
      <mesh position={[0, -size.height / 2 - 0.03, 0.08]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[size.width + 0.12, 0.025, 0.14]} />
        <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.25} />
      </mesh>
      <mesh position={[0, -size.height / 2 + 0.02, -0.1]} castShadow>
        <boxGeometry args={[size.width + 0.1, 0.035, 0.16]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.28} />
      </mesh>
    </group>
  );
}

function PanoramicSash({ size, accent }: { size: Size; accent: string }) {
  const mullions = 2;

  return (
    <group>
      <FrameRing width={size.width} height={size.height} band={0.05} depth={0.07} color={accent} />

      {Array.from({ length: mullions }).map((_, index) => {
        const x = -size.width / 2 + ((index + 1) * size.width) / (mullions + 1);
        return (
          <mesh key={index} position={[x, 0, 0.005]} castShadow>
            <boxGeometry args={[0.035, size.height - 0.1, 0.065]} />
            <meshStandardMaterial color={accent} roughness={0.2} metalness={0.4} />
          </mesh>
        );
      })}

      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[size.width - 0.11, size.height - 0.11]} />
        <meshPhysicalMaterial {...GLASS} opacity={0.26} />
      </mesh>

      <mesh position={[0, -size.height / 2 - 0.02, 0.07]} castShadow>
        <boxGeometry args={[size.width + 0.08, 0.03, 0.13]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function GlassLeaf({ size, accent }: { size: Size; accent: string }) {
  return (
    <group>
      <FrameRing width={size.width} height={size.height} band={0.055} depth={0.08} color={accent} />
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[size.width - 0.12, size.height - 0.12]} />
        <meshPhysicalMaterial {...GLASS} opacity={0.24} />
      </mesh>

      {/* Вертикальная ручка-штанга */}
      <mesh position={[size.width / 2 - 0.16, 0, 0.07]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, size.height * 0.42, 12]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.12} />
      </mesh>

      <mesh position={[0, -size.height / 2 - 0.01, 0.05]} castShadow>
        <boxGeometry args={[size.width + 0.06, 0.03, 0.14]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.35} metalness={0.3} />
      </mesh>
    </group>
  );
}

function PanelLeaf({ size, accent }: { size: Size; accent: string }) {
  return (
    <group>
      <FrameRing width={size.width} height={size.height} band={0.07} depth={0.11} color={accent} />

      {/* Полотно */}
      <mesh position={[0, 0, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[size.width - 0.14, size.height - 0.14, 0.08]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Филёнки */}
      {[-0.44, 0.2].map((y, index) => (
        <mesh key={index} position={[0, y, 0.055]} castShadow>
          <boxGeometry args={[size.width - 0.34, 0.56, 0.015]} />
          <meshStandardMaterial color="#27272a" roughness={0.5} />
        </mesh>
      ))}

      {/* Фурнитура */}
      <mesh position={[size.width / 2 - 0.17, -0.03, 0.06]} castShadow>
        <boxGeometry args={[0.05, 0.2, 0.02]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.12} />
      </mesh>
      <group position={[size.width / 2 - 0.17, -0.01, 0.08]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.045, 12]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.08} />
        </mesh>
        <mesh position={[-0.05, 0, 0.018]} castShadow>
          <boxGeometry args={[0.12, 0.024, 0.02]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.08} />
        </mesh>
      </group>

      {/* Порог */}
      <mesh position={[0, -size.height / 2, 0.04]} castShadow>
        <boxGeometry args={[size.width + 0.04, 0.05, 0.2]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.45} metalness={0.25} />
      </mesh>
    </group>
  );
}

/** Замкнутая рамка из четырёх брусков — не перекрывает стекло по центру */
function FrameRing({
  width,
  height,
  band,
  depth,
  color,
}: {
  width: number;
  height: number;
  band: number;
  depth: number;
  color: string;
}) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh key={`v${side}`} position={[side * (width / 2 - band / 2), 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[band, height, depth]} />
          <meshStandardMaterial color={color} roughness={0.28} metalness={0.2} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={`h${side}`}
          position={[0, side * (height / 2 - band / 2), 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width - band * 2, band, depth]} />
          <meshStandardMaterial color={color} roughness={0.28} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

export { getOpeningSize };
