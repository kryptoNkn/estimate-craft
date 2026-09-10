'use client';

import React, { useMemo } from 'react';
import {
  getVerandaStyleProfile,
  type VerandaDeck,
  type VerandaPosts,
  type VerandaStyleProfile,
} from './utils/verandaStyleProfiles';

export interface VerandaProps {
  hasVeranda: boolean;
  material: string;
  fenceStyle: string;
  isBaseClosed: boolean;
  width: number;
  length: number;
  perimeterOffset?: number;
  baseColor?: string;
}

interface VerandaStructureProps {
  veranda: VerandaProps;
  houseDepth: number;
  groundLevel?: number;
  architecturalStyle?: string;
}

interface MaterialTone {
  main: string;
  accent: string;
  rough: number;
  metal: number;
}

function materialTone(material: string, baseColor?: string): MaterialTone {
  switch (material) {
    case 'metal':
      return { main: '#334155', accent: '#0f172a', rough: 0.32, metal: 0.65 };
    case 'wpc':
      return { main: '#4a3728', accent: '#261a10', rough: 0.52, metal: 0 };
    case 'wood_dark':
      return { main: '#3d2314', accent: '#1c1008', rough: 0.62, metal: 0 };
    default:
      return baseColor
        ? { main: '#b8956a', accent: '#8a6a3f', rough: 0.62, metal: 0 }
        : { main: '#c19a6b', accent: '#8b6f47', rough: 0.62, metal: 0 };
  }
}

/* ---------------------------------------------------------------- настил */

function Deck({
  width,
  length,
  deck,
  tone,
}: {
  width: number;
  length: number;
  deck: VerandaDeck;
  tone: MaterialTone;
}) {
  if (deck === 'stone') {
    const cols = Math.max(2, Math.round(width / 0.9));
    const rows = Math.max(2, Math.round(length / 0.9));
    const tileW = width / cols;
    const tileL = length / rows;

    return (
      <group>
        <mesh position={[0, -0.03, 0]} receiveShadow>
          <boxGeometry args={[width, 0.06, length]} />
          <meshStandardMaterial color="#8f8b84" roughness={0.9} />
        </mesh>
        {Array.from({ length: cols * rows }).map((_, idx) => {
          const cx = -width / 2 + tileW / 2 + (idx % cols) * tileW;
          const cz = -length / 2 + tileL / 2 + Math.floor(idx / cols) * tileL;
          const shade = (idx * 37) % 5;
          return (
            <mesh key={idx} position={[cx, 0.01, cz]} receiveShadow>
              <boxGeometry args={[tileW - 0.025, 0.05, tileL - 0.025]} />
              <meshStandardMaterial
                color={['#d6d2c8', '#cfcabf', '#dad6cc', '#c9c4b9', '#d2cec4'][shade]}
                roughness={0.72}
              />
            </mesh>
          );
        })}
      </group>
    );
  }

  const plankCount = Math.max(4, Math.floor(length / (deck === 'wpc' ? 0.16 : 0.14)));
  const step = length / plankCount;

  return (
    <group>
      {Array.from({ length: plankCount }).map((_, i) => (
        <mesh
          key={i}
          position={[0, 0, -length / 2 + step * i + step / 2]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[width - 0.04, 0.045, step - 0.012]} />
          <meshStandardMaterial
            color={tone.main}
            roughness={deck === 'wpc' ? 0.6 : tone.rough}
            metalness={tone.metal}
          />
        </mesh>
      ))}
      {/* Обвязка по краю настила */}
      <mesh position={[0, -0.035, length / 2 - 0.03]} castShadow>
        <boxGeometry args={[width, 0.11, 0.06]} />
        <meshStandardMaterial color={tone.accent} roughness={0.66} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- стойки */

function Post({
  height,
  kind,
  color,
  tone,
}: {
  height: number;
  kind: VerandaPosts;
  color: string;
  tone: MaterialTone;
}) {
  if (kind === 'none') return null;

  if (kind === 'round') {
    return (
      <group position={[0, height / 2, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.11, 0.13, height - 0.26, 20]} />
          <meshStandardMaterial color={color} roughness={0.58} />
        </mesh>
        <mesh position={[0, -height / 2 + 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.2, 0.14, 20]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0, height / 2 - 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.13, 0.16, 20]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>
    );
  }

  if (kind === 'metal') {
    return (
      <group position={[0, height / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.09, height, 0.09]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.85} />
        </mesh>
        <mesh position={[0, -height / 2 + 0.03, 0]}>
          <boxGeometry args={[0.16, 0.06, 0.16]} />
          <meshStandardMaterial color="#1e242b" roughness={0.24} metalness={0.9} />
        </mesh>
      </group>
    );
  }

  if (kind === 'timber') {
    return (
      <group position={[0, height / 2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.17, height, 0.17]} />
          <meshStandardMaterial color={color} roughness={0.76} />
        </mesh>
        {/* Подкосы */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * 0.16, height / 2 - 0.32, 0]}
            rotation={[0, 0, side * -Math.PI / 4]}
            castShadow
          >
            <boxGeometry args={[0.07, 0.44, 0.11]} />
            <meshStandardMaterial color={color} roughness={0.78} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group position={[0, height / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.14, height, 0.14]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={tone.metal} />
      </mesh>
      <mesh position={[0, -height / 2 + 0.06, 0]}>
        <boxGeometry args={[0.2, 0.11, 0.2]} />
        <meshStandardMaterial color={tone.accent} roughness={0.6} />
      </mesh>
      <mesh position={[0, height / 2 - 0.07, 0]}>
        <boxGeometry args={[0.2, 0.13, 0.2]} />
        <meshStandardMaterial color={tone.accent} roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- покрытие */

function VerandaRoofSlab({
  width,
  length,
  profile,
  lighting,
}: {
  width: number;
  length: number;
  profile: VerandaStyleProfile;
  lighting: boolean;
}) {
  const w = width + profile.overhang * 2;
  const d = length + profile.overhang;

  return (
    <group>
      <mesh position={[0, 0.11, -profile.overhang / 2]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.22, d]} />
        <meshStandardMaterial color={profile.roofColor} roughness={0.62} />
      </mesh>
      {/* Подшивка */}
      <mesh position={[0, -0.02, -profile.overhang / 2]}>
        <boxGeometry args={[w - 0.08, 0.04, d - 0.08]} />
        <meshStandardMaterial color="#d8cbb2" roughness={0.8} />
      </mesh>
      {lighting && (
        <>
          <mesh position={[0, -0.04, length / 2 - 0.12]}>
            <boxGeometry args={[w - 0.6, 0.035, 0.08]} />
            <meshStandardMaterial
              color="#ffe6bd"
              emissive="#ffbe6b"
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[0, -0.4, length / 2 - 0.4]}
            intensity={9}
            distance={7}
            color="#ffca85"
          />
        </>
      )}
    </group>
  );
}

function VerandaRoofGlass({
  width,
  length,
  profile,
}: {
  width: number;
  length: number;
  profile: VerandaStyleProfile;
}) {
  const w = width + profile.overhang * 2;
  const d = length + profile.overhang;
  const bays = Math.max(2, Math.round(w / 1.3));

  return (
    <group rotation={[-0.08, 0, 0]}>
      <mesh position={[0, 0.06, -profile.overhang / 2]} castShadow>
        <boxGeometry args={[w, 0.03, d]} />
        <meshPhysicalMaterial
          color="#cfe8f5"
          transparent
          opacity={0.34}
          roughness={0.05}
          metalness={0.1}
          envMapIntensity={1.6}
        />
      </mesh>
      {/* Стальные прогоны */}
      {Array.from({ length: bays + 1 }).map((_, idx) => (
        <mesh
          key={idx}
          position={[-w / 2 + (w / bays) * idx, 0.03, -profile.overhang / 2]}
          castShadow
        >
          <boxGeometry args={[0.07, 0.13, d]} />
          <meshStandardMaterial color={profile.postColor} roughness={0.3} metalness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 0.02, length / 2 - 0.06]} castShadow>
        <boxGeometry args={[w, 0.16, 0.1]} />
        <meshStandardMaterial color={profile.postColor} roughness={0.3} metalness={0.85} />
      </mesh>
    </group>
  );
}

function VerandaRoofPergola({
  width,
  length,
  profile,
}: {
  width: number;
  length: number;
  profile: VerandaStyleProfile;
}) {
  const w = width + profile.overhang * 2;
  const d = length + profile.overhang;
  const rafters = Math.max(5, Math.round(w / 0.42));

  return (
    <group>
      {/* Прогоны по краям */}
      {[-d / 2 + 0.09, d / 2 - 0.09].map((z) => (
        <mesh key={z} position={[0, 0.09, z - profile.overhang / 2]} castShadow>
          <boxGeometry args={[w, 0.2, 0.14]} />
          <meshStandardMaterial color={profile.roofColor} roughness={0.76} />
        </mesh>
      ))}
      {/* Стропильные ламели */}
      {Array.from({ length: rafters }).map((_, idx) => (
        <mesh
          key={idx}
          position={[-w / 2 + 0.14 + ((w - 0.28) / (rafters - 1)) * idx, 0.22, -profile.overhang / 2]}
          castShadow
        >
          <boxGeometry args={[0.07, 0.15, d]} />
          <meshStandardMaterial color={profile.roofColor} roughness={0.78} />
        </mesh>
      ))}
    </group>
  );
}

function VerandaRoofGable({
  width,
  length,
  profile,
}: {
  width: number;
  length: number;
  profile: VerandaStyleProfile;
}) {
  const w = width + profile.overhang * 2;
  const d = length + profile.overhang;
  const rise = d * 0.42;
  const slope = Math.sqrt((d / 2) ** 2 + rise ** 2);
  const angle = Math.atan2(rise, d / 2);

  return (
    <group position={[0, 0, -profile.overhang / 2]}>
      {/* Скат к дому и от дома */}
      <mesh position={[0, rise / 2, d / 4]} rotation={[angle, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.12, slope]} />
        <meshStandardMaterial color={profile.roofColor} roughness={0.66} />
      </mesh>
      <mesh position={[0, rise / 2, -d / 4]} rotation={[-angle, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.12, slope]} />
        <meshStandardMaterial color={profile.roofColor} roughness={0.66} />
      </mesh>
      {/* Конёк */}
      <mesh position={[0, rise + 0.05, 0]} castShadow>
        <boxGeometry args={[w + 0.04, 0.1, 0.18]} />
        <meshStandardMaterial color={profile.roofColor} roughness={0.6} />
      </mesh>
      {/* Фронтоны */}
      {[-w / 2 + 0.05, w / 2 - 0.05].map((x) => (
        <mesh key={x} position={[x, rise * 0.42, 0]} castShadow>
          <boxGeometry args={[0.1, rise * 0.84, d * 0.5]} />
          <meshStandardMaterial color={profile.postColor} roughness={0.68} />
        </mesh>
      ))}
      {/* Балка по стойкам */}
      <mesh position={[0, -0.09, d / 2 - 0.12]} castShadow>
        <boxGeometry args={[w, 0.2, 0.16]} />
        <meshStandardMaterial color={profile.postColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ---------------------------------------------------------------- ограждение */

function FenceRun({
  length,
  style,
  main,
  accent,
}: {
  length: number;
  style: string;
  main: string;
  accent: string;
}) {
  if (style === 'glass') {
    const panels = Math.max(1, Math.round(length / 1.3));
    return (
      <group>
        {Array.from({ length: panels }).map((_, idx) => {
          const panelW = length / panels;
          return (
            <mesh
              key={idx}
              position={[-length / 2 + panelW / 2 + panelW * idx, 0.5, 0]}
              castShadow
            >
              <boxGeometry args={[panelW - 0.1, 0.94, 0.022]} />
              <meshPhysicalMaterial
                color="#cfe8f5"
                transparent
                opacity={0.3}
                roughness={0.04}
                metalness={0.06}
                envMapIntensity={1.8}
              />
            </mesh>
          );
        })}
        {Array.from({ length: panels + 1 }).map((_, idx) => (
          <mesh key={`p${idx}`} position={[-length / 2 + (length / panels) * idx, 0.5, 0]} castShadow>
            <boxGeometry args={[0.05, 1.0, 0.05]} />
            <meshStandardMaterial color={accent} roughness={0.3} metalness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[length, 0.05, 0.06]} />
          <meshStandardMaterial color={accent} roughness={0.3} metalness={0.6} />
        </mesh>
      </group>
    );
  }

  if (style === 'vertical') {
    const count = Math.max(4, Math.floor((length - 0.3) / 0.15));
    return (
      <group>
        <mesh position={[0, 0.94, 0]} castShadow>
          <boxGeometry args={[length - 0.1, 0.06, 0.09]} />
          <meshStandardMaterial color={accent} roughness={0.42} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[length - 0.1, 0.06, 0.06]} />
          <meshStandardMaterial color={accent} roughness={0.42} />
        </mesh>
        {Array.from({ length: count }).map((_, index) => (
          <mesh
            key={index}
            position={[
              -length / 2 + 0.18 + index * ((length - 0.36) / Math.max(count - 1, 1)),
              0.5,
              0,
            ]}
            castShadow
          >
            <boxGeometry args={[0.035, 0.84, 0.035]} />
            <meshStandardMaterial color={main} roughness={0.55} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.94, 0]} castShadow>
        <boxGeometry args={[length - 0.1, 0.06, 0.09]} />
        <meshStandardMaterial color={accent} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[length - 0.1, 0.06, 0.06]} />
        <meshStandardMaterial color={accent} roughness={0.42} />
      </mesh>
      {style === 'cross' &&
        [0.6, -0.6].map((tilt) => (
          <mesh key={tilt} rotation={[0, 0, tilt]} position={[0, 0.52, 0]} castShadow>
            <boxGeometry args={[Math.min(length - 0.3, 1.6), 0.05, 0.035]} />
            <meshStandardMaterial color={main} roughness={0.55} />
          </mesh>
        ))}
    </group>
  );
}

/* ---------------------------------------------------------------- обстановка */

function Furniture({ kind, width }: { kind: 'lounge' | 'dining'; width: number }) {
  if (kind === 'lounge') {
    return (
      <group>
        {/* Модульный диван */}
        <mesh position={[-0.4, 0.2, -0.5]} castShadow receiveShadow>
          <boxGeometry args={[Math.min(2.4, width * 0.5), 0.32, 0.85]} />
          <meshStandardMaterial color="#5b6169" roughness={0.9} />
        </mesh>
        <mesh position={[-0.4, 0.46, -0.82]} castShadow>
          <boxGeometry args={[Math.min(2.4, width * 0.5), 0.44, 0.2]} />
          <meshStandardMaterial color="#5b6169" roughness={0.9} />
        </mesh>
        {[-1.0, -0.4, 0.2].map((x) => (
          <mesh key={x} position={[x, 0.44, -0.66]} rotation={[0.16, 0, 0]} castShadow>
            <boxGeometry args={[0.44, 0.42, 0.14]} />
            <meshStandardMaterial color="#8d9298" roughness={0.92} />
          </mesh>
        ))}
        {/* Журнальный столик */}
        <mesh position={[-0.4, 0.32, 0.5]} castShadow receiveShadow>
          <boxGeometry args={[1.0, 0.06, 0.55]} />
          <meshStandardMaterial color="#2c3035" roughness={0.4} metalness={0.35} />
        </mesh>
        {[
          [-0.82, 0.3],
          [0.02, 0.3],
          [-0.82, 0.7],
          [0.02, 0.7],
        ].map(([x, z], idx) => (
          <mesh key={idx} position={[x, 0.15, z + 0.2]} castShadow>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color="#22262b" roughness={0.4} metalness={0.5} />
          </mesh>
        ))}
      </group>
    );
  }

  const chairs: [number, number, number][] = [
    [-0.75, 0, 0],
    [0.75, 0, Math.PI],
    [0, -0.85, Math.PI / 2],
    [0, 0.85, -Math.PI / 2],
  ];

  return (
    <group>
      {/* Обеденный стол */}
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.06, 0.9]} />
        <meshStandardMaterial color="#7d5a35" roughness={0.6} />
      </mesh>
      {[
        [-0.75, -0.36],
        [0.75, -0.36],
        [-0.75, 0.36],
        [0.75, 0.36],
      ].map(([x, z], idx) => (
        <mesh key={idx} position={[x, 0.37, z]} castShadow>
          <boxGeometry args={[0.07, 0.74, 0.07]} />
          <meshStandardMaterial color="#5f4326" roughness={0.66} />
        </mesh>
      ))}
      {chairs.map(([x, z, ry], idx) => (
        <group key={idx} position={[x * 1.5, 0, z * 1.1]} rotation={[0, ry, 0]}>
          <mesh position={[0, 0.44, 0]} castShadow>
            <boxGeometry args={[0.44, 0.05, 0.44]} />
            <meshStandardMaterial color="#6b6f76" roughness={0.85} />
          </mesh>
          <mesh position={[-0.2, 0.68, 0]} castShadow>
            <boxGeometry args={[0.05, 0.48, 0.42]} />
            <meshStandardMaterial color="#6b6f76" roughness={0.85} />
          </mesh>
          {[
            [-0.18, -0.18],
            [0.18, -0.18],
            [-0.18, 0.18],
            [0.18, 0.18],
          ].map(([lx, lz], i) => (
            <mesh key={i} position={[lx, 0.22, lz]} castShadow>
              <boxGeometry args={[0.04, 0.44, 0.04]} />
              <meshStandardMaterial color="#4a4e54" roughness={0.6} metalness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

const PLANT_TONES = ['#4d7a3a', '#5d8c46', '#3f6b31', '#6b9152'];

function Planter({
  width,
  color,
  seed,
}: {
  width: number;
  color: string;
  seed: number;
}) {
  const plants = useMemo(() => {
    const count = Math.max(2, Math.round(width / 0.55));
    return Array.from({ length: count }).map((_, idx) => ({
      x: -width / 2 + 0.22 + ((width - 0.44) / Math.max(1, count - 1)) * idx,
      r: 0.15 + (((idx + seed) * 13) % 6) * 0.022,
      lift: (((idx + seed) * 7) % 4) * 0.03,
      tone: PLANT_TONES[(idx + seed) % PLANT_TONES.length],
    }));
  }, [width, seed]);

  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.44, 0.4]} />
        <meshStandardMaterial color={color} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.42, 0]} receiveShadow>
        <boxGeometry args={[width - 0.1, 0.05, 0.32]} />
        <meshStandardMaterial color="#3a2f26" roughness={0.96} />
      </mesh>
      {plants.map((plant, idx) => (
        <group key={idx} position={[plant.x, 0.5 + plant.r * 0.6 + plant.lift, 0]}>
          <mesh castShadow>
            <icosahedronGeometry args={[plant.r, 1]} />
            <meshStandardMaterial color={plant.tone} roughness={0.9} flatShading />
          </mesh>
          <mesh position={[plant.r * 0.5, plant.r * 0.3, plant.r * 0.2]} castShadow>
            <icosahedronGeometry args={[plant.r * 0.6, 0]} />
            <meshStandardMaterial color={plant.tone} roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- веранда */

export function VerandaStructure({
  veranda,
  groundLevel = -0.4,
  architecturalStyle,
}: VerandaStructureProps) {
  const profile = getVerandaStyleProfile(architecturalStyle);

  if (!veranda.hasVeranda) return null;

  const { width, length, fenceStyle, material, isBaseClosed, baseColor } = veranda;
  const halfLength = length / 2;
  const tone = materialTone(material, baseColor);

  const deckY = 0.06;
  const postH = profile.roofHeight;
  const baseH = deckY - groundLevel;
  const hasRoof = profile.roof !== 'none';

  const postPositions: [number, number][] =
    profile.posts === 'none' || !hasRoof
      ? []
      : [
          [-width / 2 + 0.16, length - 0.16],
          [width / 2 - 0.16, length - 0.16],
          ...(width > 6
            ? ([[0, length - 0.16]] as [number, number][])
            : ([] as [number, number][])),
        ];

  const stepCount = 3;
  const stepRise = baseH / stepCount;
  const stepWidth = Math.max(1.3, Math.min(width * 0.45, 2.6));

  return (
    <group>
      {/* Закрытое основание либо опорные тумбы */}
      {isBaseClosed ? (
        <mesh position={[0, groundLevel + baseH / 2, halfLength]} receiveShadow castShadow>
          <boxGeometry args={[width, baseH, length]} />
          <meshStandardMaterial color={baseColor ?? tone.accent} roughness={0.8} />
        </mesh>
      ) : (
        [
          [-width / 2 + 0.3, 0.35],
          [width / 2 - 0.3, 0.35],
          [-width / 2 + 0.3, length - 0.35],
          [width / 2 - 0.3, length - 0.35],
        ].map(([x, z], idx) => (
          <mesh key={idx} position={[x, groundLevel + baseH / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[0.36, baseH, 0.36]} />
            <meshStandardMaterial color="#9c9a94" roughness={0.88} />
          </mesh>
        ))
      )}

      {/* Настил */}
      <group position={[0, deckY, halfLength]}>
        <Deck width={width} length={length} deck={profile.deck} tone={tone} />
      </group>

      {/* Стойки */}
      {postPositions.map(([x, z], idx) => (
        <group key={idx} position={[x, deckY, z]}>
          <Post height={postH} kind={profile.posts} color={profile.postColor} tone={tone} />
        </group>
      ))}

      {/* Покрытие */}
      {hasRoof && (
        <group position={[0, deckY + postH, halfLength]}>
          {profile.roof === 'slab' && (
            <VerandaRoofSlab
              width={width}
              length={length}
              profile={profile}
              lighting={profile.lighting}
            />
          )}
          {profile.roof === 'glass' && (
            <VerandaRoofGlass width={width} length={length} profile={profile} />
          )}
          {profile.roof === 'pergola' && (
            <VerandaRoofPergola width={width} length={length} profile={profile} />
          )}
          {profile.roof === 'gable' && (
            <VerandaRoofGable width={width} length={length} profile={profile} />
          )}
        </group>
      )}

      {/* Ограждение по трём открытым сторонам, с проходом на лестницу */}
      {fenceStyle !== 'none' && (
        <group position={[0, deckY, 0]}>
          {(() => {
            const gap = stepWidth + 0.24;
            const run = (width - gap) / 2;
            if (run < 0.5) return null;
            return [-1, 1].map((side) => (
              <group key={side} position={[side * (gap / 2 + run / 2), 0, length - 0.06]}>
                <FenceRun length={run} style={fenceStyle} main={tone.main} accent={tone.accent} />
              </group>
            ));
          })()}
          <group position={[-width / 2 + 0.06, 0, halfLength]} rotation={[0, Math.PI / 2, 0]}>
            <FenceRun length={length - 0.16} style={fenceStyle} main={tone.main} accent={tone.accent} />
          </group>
          <group position={[width / 2 - 0.06, 0, halfLength]} rotation={[0, Math.PI / 2, 0]}>
            <FenceRun length={length - 0.16} style={fenceStyle} main={tone.main} accent={tone.accent} />
          </group>
        </group>
      )}

      {/* Мебель */}
      {profile.furniture !== 'none' && (
        <group position={[0, deckY + 0.02, halfLength]}>
          <Furniture kind={profile.furniture} width={width} />
        </group>
      )}

      {/* Кашпо по краям настила */}
      {profile.planters && (
        <>
          <group position={[-width / 2 + 0.9, deckY, length + 0.24]}>
            <Planter width={1.6} color={baseColor ?? '#b9b6ae'} seed={1} />
          </group>
          <group position={[width / 2 - 0.9, deckY, length + 0.24]}>
            <Planter width={1.6} color={baseColor ?? '#b9b6ae'} seed={4} />
          </group>
        </>
      )}

      {/* Ступени на грунт */}
      {Array.from({ length: stepCount }).map((_, index) => {
        const y = deckY - stepRise * (index + 1);
        return (
          <group key={index}>
            <mesh
              position={[0, y + stepRise / 2, length + 0.36 + index * 0.34]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[stepWidth - index * 0.05, stepRise, 0.34]} />
              <meshStandardMaterial
                color={profile.deck === 'stone' ? '#c9c4b9' : (baseColor ?? '#cbd5e1')}
                roughness={0.86}
              />
            </mesh>
            {profile.lighting && (
              <mesh position={[0, y + stepRise - 0.02, length + 0.53 + index * 0.34]}>
                <boxGeometry args={[stepWidth - index * 0.05 - 0.3, 0.025, 0.04]} />
                <meshStandardMaterial
                  color="#ffe6bd"
                  emissive="#ffbe6b"
                  emissiveIntensity={1.5}
                  toneMapped={false}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}
