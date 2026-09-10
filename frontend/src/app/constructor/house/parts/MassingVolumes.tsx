'use client';

import * as THREE from 'three';
import { useMemo } from 'react';
import type { MassingVolume, VolumeTone } from '../utils/houseMassing';
import type { RoofCovering } from '@/utils/roofMaterials';
import { useFacadeMaterial } from './WallWithOpenings';
import { RoofPart } from './RoofPart';

export interface MassingPalette {
  textureType: string;
  primary: string;
  secondary: string;
  accent: string;
  covering: RoofCovering;
  roofColor: string;
  jointColor?: string;
}

interface MassingVolumesProps {
  volumes: MassingVolume[];
  palette: MassingPalette;
  /** Отметка земли относительно чистого пола (отрицательная) */
  groundLevel: number;
}

const TONE_COLORS: Record<Exclude<VolumeTone, 'primary' | 'secondary'>, string> = {
  accent: '#e8e4dc',
  dark: '#3a3d42',
  stone: '#b9b6ae',
  timber: '#a97f4f',
};

function toneColor(tone: VolumeTone | undefined, palette: MassingPalette) {
  if (!tone || tone === 'primary') return palette.primary;
  if (tone === 'secondary') return palette.secondary;
  return TONE_COLORS[tone];
}

function toneTexture(tone: VolumeTone | undefined, palette: MassingPalette) {
  if (tone === 'timber') return 'wood';
  if (tone === 'stone' || tone === 'dark') return 'stucco';
  return palette.textureType;
}

const GLASS_PROPS = {
  color: '#1d2b33',
  roughness: 0.06,
  metalness: 0.25,
  transparent: true,
  opacity: 0.62,
  envMapIntensity: 1.5,
} as const;

const METAL_PROPS = { color: '#4a4f57', roughness: 0.34, metalness: 0.82 } as const;

/** Ленточное или панорамное остекление на лицевой грани объёма */
function VolumeGlazing({
  width,
  height,
  depth,
  mode,
}: {
  width: number;
  height: number;
  depth: number;
  mode: 'strip' | 'panoramic';
}) {
  const glassH = mode === 'strip' ? Math.min(1.15, height * 0.42) : height - 0.72;
  const glassY = mode === 'strip' ? height * 0.62 : 0.36 + glassH / 2;
  const glassW = width - 0.7;
  const mullions = Math.max(1, Math.round(glassW / 1.5));

  return (
    <group position={[0, glassY, depth / 2 + 0.015]}>
      <mesh castShadow>
        <boxGeometry args={[glassW, glassH, 0.06]} />
        <meshPhysicalMaterial {...GLASS_PROPS} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[glassW + 0.12, glassH + 0.12, 0.05]} />
        <meshStandardMaterial color="#2b2f34" roughness={0.42} metalness={0.55} />
      </mesh>
      {Array.from({ length: mullions - 1 }).map((_, idx) => (
        <mesh key={idx} position={[-glassW / 2 + (glassW / mullions) * (idx + 1), 0, 0.05]}>
          <boxGeometry args={[0.06, glassH, 0.06]} />
          <meshStandardMaterial color="#2b2f34" roughness={0.42} metalness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

/** Стойки под навесной плитой */
function SlabColumns({
  width,
  depth,
  height,
  kind,
}: {
  width: number;
  depth: number;
  height: number;
  kind: 'metal' | 'round' | 'timber';
}) {
  const count = Math.max(2, Math.round(width / 3));
  const step = (width - 0.6) / (count - 1);

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => {
        const x = -(width - 0.6) / 2 + step * idx;
        const z = depth / 2 - 0.3;

        if (kind === 'round') {
          return (
            <group key={idx} position={[x, -height / 2, z]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.15, 0.17, height - 0.24, 20]} />
                <meshStandardMaterial color="#f4f2ec" roughness={0.6} />
              </mesh>
              <mesh position={[0, -height / 2 + 0.06, 0]} castShadow>
                <cylinderGeometry args={[0.22, 0.24, 0.12, 20]} />
                <meshStandardMaterial color="#f4f2ec" roughness={0.6} />
              </mesh>
              <mesh position={[0, height / 2 - 0.1, 0]} castShadow>
                <cylinderGeometry args={[0.21, 0.18, 0.14, 20]} />
                <meshStandardMaterial color="#f4f2ec" roughness={0.6} />
              </mesh>
            </group>
          );
        }

        if (kind === 'timber') {
          return (
            <mesh key={idx} position={[x, -height / 2, z]} castShadow>
              <boxGeometry args={[0.18, height, 0.18]} />
              <meshStandardMaterial color="#8b6438" roughness={0.78} />
            </mesh>
          );
        }

        return (
          <mesh key={idx} position={[x, -height / 2, z]} castShadow>
            <boxGeometry args={[0.1, height, 0.1]} />
            <meshStandardMaterial {...METAL_PROPS} />
          </mesh>
        );
      })}
    </>
  );
}

function BlockVolume({
  volume,
  palette,
}: {
  volume: MassingVolume;
  palette: MassingPalette;
}) {
  const [w, h, d] = volume.size;
  const material = useFacadeMaterial(
    toneTexture(volume.tone, palette),
    toneColor(volume.tone, palette),
    palette.secondary,
    palette.jointColor,
    volume.tone === 'timber' ? 0.7 : 0.78,
  );

  return (
    <>
      <mesh position={[0, h / 2, 0]} material={material} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>

      {volume.glazing && volume.glazing !== 'none' && (
        <VolumeGlazing width={w} height={h} depth={d} mode={volume.glazing} />
      )}

      {volume.roof === 'flat' && (
        <>
          <mesh position={[0, h + 0.11, 0]} castShadow receiveShadow>
            <boxGeometry args={[w + 0.5, 0.22, d + 0.5]} />
            <meshStandardMaterial color={palette.accent} roughness={0.7} />
          </mesh>
          <mesh position={[0, h + 0.34, 0]}>
            <boxGeometry args={[w + 0.2, 0.24, d + 0.2]} />
            <meshStandardMaterial color={palette.accent} roughness={0.72} />
          </mesh>
        </>
      )}

      {(volume.roof === 'gable' || volume.roof === 'shed') && (
        <RoofPart
          position={[0, h, 0]}
          width={w}
          depth={d}
          roofType={volume.roof}
          covering={palette.covering}
          color={palette.roofColor}
          accentColor={palette.accent}
          pitch={volume.roof === 'shed' ? 12 : 26}
          overhang={0.45}
          gableTextureType={toneTexture(volume.tone, palette)}
          gableColor={toneColor(volume.tone, palette)}
          gableSecondaryColor={palette.secondary}
          jointColor={palette.jointColor}
        />
      )}
    </>
  );
}

function TowerVolume({
  volume,
  palette,
}: {
  volume: MassingVolume;
  palette: MassingPalette;
}) {
  const [w, h] = volume.size;
  const r = w / 2;
  const material = useFacadeMaterial(
    toneTexture(volume.tone, palette),
    toneColor(volume.tone, palette),
    palette.secondary,
    palette.jointColor,
    0.78,
  );
  const bands = Math.max(2, Math.floor(h / 1.5));

  return (
    <>
      <mesh position={[0, h / 2, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, h, 48]} />
      </mesh>

      {volume.glazing === 'strip' &&
        Array.from({ length: bands }).map((_, idx) => (
          <mesh key={idx} position={[0, 0.9 + idx * 1.5, 0]} castShadow>
            <cylinderGeometry args={[r + 0.02, r + 0.02, 0.85, 48, 1, true]} />
            <meshPhysicalMaterial {...GLASS_PROPS} side={THREE.DoubleSide} />
          </mesh>
        ))}

      <mesh position={[0, h + 0.12, 0]} castShadow>
        <cylinderGeometry args={[r + 0.22, r + 0.22, 0.24, 48]} />
        <meshStandardMaterial color={palette.accent} roughness={0.7} />
      </mesh>
    </>
  );
}

function StackVolume({
  volume,
  palette,
  groundLevel,
}: {
  volume: MassingVolume;
  palette: MassingPalette;
  groundLevel: number;
}) {
  const [w, h, d] = volume.size;
  const isStone = volume.tone === 'stone';
  const material = useFacadeMaterial(
    'brick',
    isStone ? '#9d9890' : '#5c3a2c',
    isStone ? '#8b867e' : '#6e4636',
    isStone ? '#7a756e' : '#3f3a37',
    0.88,
  );
  const total = h - groundLevel;

  return (
    <>
      <mesh position={[0, groundLevel + total / 2, 0]} material={material} castShadow receiveShadow>
        <boxGeometry args={[w, total, d]} />
      </mesh>
      <mesh position={[0, h + 0.09, 0]} castShadow>
        <boxGeometry args={[w + 0.24, 0.18, d + 0.24]} />
        <meshStandardMaterial color="#8d8a83" roughness={0.82} />
      </mesh>
      <mesh position={[0, h + 0.3, 0]} castShadow>
        <boxGeometry args={[w * 0.5, 0.26, d * 0.5]} />
        <meshStandardMaterial color="#2f3238" roughness={0.6} metalness={0.4} />
      </mesh>
    </>
  );
}

function SlabVolume({
  volume,
  palette,
  columnHeight,
}: {
  volume: MassingVolume;
  palette: MassingPalette;
  columnHeight: number;
}) {
  const [w, h, d] = volume.size;
  const isTimber = volume.tone === 'timber';
  const planks = isTimber ? Math.max(3, Math.round(d / 0.22)) : 0;

  return (
    <>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={toneColor(volume.tone, palette)}
          roughness={isTimber ? 0.74 : 0.68}
          metalness={volume.tone === 'dark' ? 0.35 : 0.04}
        />
      </mesh>

      {isTimber &&
        Array.from({ length: planks }).map((_, idx) => (
          <mesh
            key={idx}
            position={[0, h + 0.005, -d / 2 + 0.11 + (d / planks) * idx]}
            receiveShadow
          >
            <boxGeometry args={[w - 0.05, 0.02, d / planks - 0.03]} />
            <meshStandardMaterial color="#9c7343" roughness={0.76} />
          </mesh>
        ))}

      {volume.columns && volume.columns !== 'none' && (
        <SlabColumns width={w} depth={d} height={columnHeight} kind={volume.columns} />
      )}
    </>
  );
}

function PergolaVolume({
  volume,
  palette,
  columnHeight,
}: {
  volume: MassingVolume;
  palette: MassingPalette;
  columnHeight: number;
}) {
  const [w, h, d] = volume.size;
  const beams = Math.max(4, Math.round(w / 0.55));
  const color = toneColor(volume.tone, palette);

  return (
    <>
      <mesh position={[0, h / 2, -d / 2 + 0.09]} castShadow>
        <boxGeometry args={[w, 0.22, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.76} />
      </mesh>
      <mesh position={[0, h / 2, d / 2 - 0.09]} castShadow>
        <boxGeometry args={[w, 0.22, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.76} />
      </mesh>

      {Array.from({ length: beams }).map((_, idx) => (
        <mesh
          key={idx}
          position={[-w / 2 + 0.2 + ((w - 0.4) / (beams - 1)) * idx, h / 2 + 0.14, 0]}
          castShadow
        >
          <boxGeometry args={[0.08, 0.16, d]} />
          <meshStandardMaterial color={color} roughness={0.78} />
        </mesh>
      ))}

      <SlabColumns width={w} depth={d} height={columnHeight} kind="timber" />
    </>
  );
}

const SHRUB_TONES = ['#4d7a3a', '#5d8c46', '#3f6b31'];

function PlanterVolume({
  volume,
  palette,
}: {
  volume: MassingVolume;
  palette: MassingPalette;
}) {
  const [w, h, d] = volume.size;
  const plants = useMemo(() => {
    const count = Math.max(2, Math.round(w / 0.8));
    return Array.from({ length: count }).map((_, idx) => ({
      x: -w / 2 + 0.32 + ((w - 0.64) / Math.max(1, count - 1)) * idx,
      z: ((idx % 3) - 1) * (d * 0.2),
      r: 0.2 + ((idx * 7) % 5) * 0.03,
      tone: SHRUB_TONES[idx % SHRUB_TONES.length],
    }));
  }, [w, d]);

  return (
    <>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={toneColor(volume.tone, palette)} roughness={0.85} />
      </mesh>
      <mesh position={[0, h - 0.04, 0]} receiveShadow>
        <boxGeometry args={[w - 0.16, 0.06, d - 0.16]} />
        <meshStandardMaterial color="#3a2f26" roughness={0.95} />
      </mesh>

      {plants.map((plant, idx) => (
        <group key={idx} position={[plant.x, h + plant.r * 0.6, plant.z]}>
          <mesh castShadow>
            <icosahedronGeometry args={[plant.r, 1]} />
            <meshStandardMaterial color={plant.tone} roughness={0.9} flatShading />
          </mesh>
          <mesh position={[plant.r * 0.5, plant.r * 0.35, plant.r * 0.3]} castShadow>
            <icosahedronGeometry args={[plant.r * 0.62, 0]} />
            <meshStandardMaterial color={plant.tone} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </>
  );
}

function ScreenVolume({
  volume,
  palette,
  groundLevel,
}: {
  volume: MassingVolume;
  palette: MassingPalette;
  groundLevel: number;
}) {
  const [w, h, d] = volume.size;
  const isTimber = volume.tone === 'timber';
  const slats = Math.max(6, Math.round(d / 0.32));

  if (isTimber) {
    return (
      <>
        {Array.from({ length: slats }).map((_, idx) => (
          <mesh
            key={idx}
            position={[0, groundLevel + (h - groundLevel) / 2, -d / 2 + 0.16 + ((d - 0.32) / (slats - 1)) * idx]}
            castShadow
          >
            <boxGeometry args={[Math.max(w, 0.08), h - groundLevel, 0.12]} />
            <meshStandardMaterial color="#96703f" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, h - 0.06, 0]} castShadow>
          <boxGeometry args={[Math.max(w, 0.08) + 0.06, 0.12, d]} />
          <meshStandardMaterial color="#7d5c33" roughness={0.78} />
        </mesh>
      </>
    );
  }

  return (
    <mesh position={[0, groundLevel + (h - groundLevel) / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[w, h - groundLevel, d]} />
      <meshStandardMaterial color={toneColor(volume.tone, palette)} roughness={0.8} />
    </mesh>
  );
}

/** Полностью остеклённый фронтон (барнхаус) */
function GlazingVolume({ volume }: { volume: MassingVolume }) {
  const [w, h, d] = volume.size;
  const cols = Math.max(2, Math.round(d / 1.5));
  const rows = Math.max(2, Math.round(h / 1.6));

  return (
    <>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial {...GLASS_PROPS} opacity={0.7} />
      </mesh>
      {Array.from({ length: cols - 1 }).map((_, idx) => (
        <mesh key={`c${idx}`} position={[0.02, h / 2, -d / 2 + (d / cols) * (idx + 1)]} castShadow>
          <boxGeometry args={[w + 0.08, h, 0.08]} />
          <meshStandardMaterial color="#26292e" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {Array.from({ length: rows - 1 }).map((_, idx) => (
        <mesh key={`r${idx}`} position={[0.02, (h / rows) * (idx + 1), 0]} castShadow>
          <boxGeometry args={[w + 0.08, 0.08, d]} />
          <meshStandardMaterial color="#26292e" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
    </>
  );
}

export function MassingVolumes({ volumes, palette, groundLevel }: MassingVolumesProps) {
  return (
    <>
      {volumes.map((volume, idx) => {
        // Стойки навесов и пергол опираются на грунт, а не висят под плитой.
        const columnHeight = volume.offset[1] - groundLevel;

        return (
        <group
          key={idx}
          position={volume.offset}
          rotation={[0, volume.rotationY ?? 0, 0]}
        >
          {volume.kind === 'block' && <BlockVolume volume={volume} palette={palette} />}
          {volume.kind === 'tower' && <TowerVolume volume={volume} palette={palette} />}
          {volume.kind === 'stack' && (
            <StackVolume volume={volume} palette={palette} groundLevel={groundLevel} />
          )}
          {volume.kind === 'slab' && (
            <SlabVolume volume={volume} palette={palette} columnHeight={columnHeight} />
          )}
          {volume.kind === 'pergola' && (
            <PergolaVolume volume={volume} palette={palette} columnHeight={columnHeight} />
          )}
          {volume.kind === 'planter' && <PlanterVolume volume={volume} palette={palette} />}
          {volume.kind === 'screen' && (
            <ScreenVolume volume={volume} palette={palette} groundLevel={groundLevel} />
          )}
          {volume.kind === 'glazing' && <GlazingVolume volume={volume} />}
        </group>
        );
      })}
    </>
  );
}
