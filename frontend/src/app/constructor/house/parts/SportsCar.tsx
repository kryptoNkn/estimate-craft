'use client';

import * as THREE from 'three';
import { useMemo } from 'react';

/**
 * Lamborghini Revuelto — процедурная модель.
 * Габариты по заводским: 4947 × 2033 × 1160 мм, база 2779 мм.
 */

interface Station {
  z: number;
  /** Полуширина по низу */
  bottom: number;
  /** Максимальная полуширина (линия борта) */
  flank: number;
  /** Полуширина по верху */
  top: number;
  yBottom: number;
  yTop: number;
}

/** 8 точек сечения: низ, борт (две отметки), верх — обход против часовой из +Z */
function sectionPoints(s: Station): THREE.Vector3[] {
  const span = s.yTop - s.yBottom;
  const low = s.yBottom + span * 0.24;
  const high = s.yBottom + span * 0.72;

  return [
    new THREE.Vector3(-s.bottom, s.yBottom, s.z),
    new THREE.Vector3(s.bottom, s.yBottom, s.z),
    new THREE.Vector3(s.flank, low, s.z),
    new THREE.Vector3(s.flank, high, s.z),
    new THREE.Vector3(s.top, s.yTop, s.z),
    new THREE.Vector3(-s.top, s.yTop, s.z),
    new THREE.Vector3(-s.flank, high, s.z),
    new THREE.Vector3(-s.flank, low, s.z),
  ];
}

/** Сшивает сечения в замкнутую оболочку с усреднёнными нормалями */
function buildLoft(stations: Station[], capFront = true, capBack = true) {
  const RING = 8;
  const positions: number[] = [];
  const rings = stations.map(sectionPoints);

  rings.forEach((ring) => ring.forEach((p) => positions.push(p.x, p.y, p.z)));

  const indices: number[] = [];
  for (let s = 0; s < rings.length - 1; s += 1) {
    const a = s * RING;
    const b = (s + 1) * RING;
    for (let i = 0; i < RING; i += 1) {
      const j = (i + 1) % RING;
      indices.push(a + i, a + j, b + j);
      indices.push(a + i, b + j, b + i);
    }
  }

  const centroid = (ring: THREE.Vector3[]) =>
    ring.reduce((acc, p) => acc.add(p), new THREE.Vector3()).divideScalar(ring.length);

  if (capBack) {
    const c = centroid(rings[0]);
    const ci = positions.length / 3;
    positions.push(c.x, c.y, c.z);
    for (let i = 0; i < RING; i += 1) {
      indices.push(ci, (i + 1) % RING, i);
    }
  }

  if (capFront) {
    const last = rings.length - 1;
    const c = centroid(rings[last]);
    const ci = positions.length / 3;
    positions.push(c.x, c.y, c.z);
    for (let i = 0; i < RING; i += 1) {
      indices.push(ci, last * RING + i, last * RING + ((i + 1) % RING));
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const BODY_STATIONS: Station[] = [
  { z: -2.47, bottom: 0.7, flank: 0.88, top: 0.78, yBottom: 0.2, yTop: 0.8 },
  { z: -2.15, bottom: 0.85, flank: 0.99, top: 0.9, yBottom: 0.13, yTop: 0.85 },
  { z: -1.45, bottom: 0.92, flank: 1.014, top: 0.95, yBottom: 0.11, yTop: 0.89 },
  { z: -0.7, bottom: 0.94, flank: 1.016, top: 0.97, yBottom: 0.1, yTop: 0.85 },
  { z: 0.1, bottom: 0.94, flank: 1.016, top: 0.97, yBottom: 0.1, yTop: 0.8 },
  { z: 0.85, bottom: 0.92, flank: 1.014, top: 0.95, yBottom: 0.09, yTop: 0.76 },
  { z: 1.5, bottom: 0.88, flank: 1.0, top: 0.93, yBottom: 0.09, yTop: 0.66 },
  { z: 2.05, bottom: 0.76, flank: 0.93, top: 0.86, yBottom: 0.08, yTop: 0.54 },
  { z: 2.47, bottom: 0.5, flank: 0.64, top: 0.56, yBottom: 0.13, yTop: 0.42 },
];

const CABIN_STATIONS: Station[] = [
  { z: 0.95, bottom: 0.7, flank: 0.72, top: 0.46, yBottom: 0.72, yTop: 0.77 },
  { z: 0.45, bottom: 0.79, flank: 0.81, top: 0.58, yBottom: 0.76, yTop: 1.06 },
  { z: -0.25, bottom: 0.8, flank: 0.82, top: 0.56, yBottom: 0.8, yTop: 1.16 },
  { z: -0.85, bottom: 0.75, flank: 0.78, top: 0.42, yBottom: 0.83, yTop: 1.06 },
  { z: -1.45, bottom: 0.6, flank: 0.66, top: 0.28, yBottom: 0.86, yTop: 0.9 },
];

const CARBON = { color: '#191b1e', roughness: 0.38, metalness: 0.45 } as const;
const TRIM = { color: '#2b2e33', roughness: 0.5, metalness: 0.3 } as const;

function Wheel({
  x,
  z,
  radius,
  width,
}: {
  x: number;
  z: number;
  radius: number;
  width: number;
}) {
  const spokes = 10;

  return (
    <group position={[x, radius, z]} rotation={[0, 0, Math.PI / 2]}>
      {/* Покрышка */}
      <mesh castShadow>
        <cylinderGeometry args={[radius, radius, width, 36]} />
        <meshStandardMaterial color="#15161a" roughness={0.92} />
      </mesh>
      {/* Плечо протектора */}
      <mesh>
        <cylinderGeometry args={[radius * 0.995, radius * 0.995, width * 1.02, 36]} />
        <meshStandardMaterial color="#101114" roughness={0.98} />
      </mesh>

      {/* Диск */}
      <mesh position={[0, Math.sign(x) * (width / 2 - 0.03), 0]} castShadow>
        <cylinderGeometry args={[radius * 0.72, radius * 0.72, 0.05, 32]} />
        <meshStandardMaterial color="#2f3338" roughness={0.3} metalness={0.9} />
      </mesh>
      {Array.from({ length: spokes }).map((_, idx) => (
        <mesh
          key={idx}
          position={[0, Math.sign(x) * (width / 2 - 0.02), 0]}
          rotation={[0, (idx / spokes) * Math.PI * 2, 0]}
        >
          <boxGeometry args={[radius * 1.34, 0.03, 0.055]} />
          <meshStandardMaterial color="#3d4248" roughness={0.28} metalness={0.92} />
        </mesh>
      ))}
      {/* Центральная гайка */}
      <mesh position={[0, Math.sign(x) * (width / 2 + 0.01), 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 12]} />
        <meshStandardMaterial color="#b08a2e" roughness={0.32} metalness={0.95} />
      </mesh>

      {/* Тормозной диск и суппорт */}
      <mesh position={[0, Math.sign(x) * (width / 2 - 0.09), 0]}>
        <cylinderGeometry args={[radius * 0.6, radius * 0.6, 0.035, 28]} />
        <meshStandardMaterial color="#6b6f74" roughness={0.36} metalness={0.85} />
      </mesh>
      <mesh position={[radius * 0.42, Math.sign(x) * (width / 2 - 0.1), 0.02]}>
        <boxGeometry args={[0.16, 0.05, 0.11]} />
        <meshStandardMaterial color="#c8552b" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

/** Y-образная оптика — визитная карточка Revuelto */
function YLight({
  color,
  intensity,
  scale = 1,
}: {
  color: string;
  intensity: number;
  scale?: number;
}) {
  return (
    <group scale={scale}>
      <mesh rotation={[0, 0, 0.62]} position={[-0.09, 0.08, 0]}>
        <boxGeometry args={[0.03, 0.2, 0.03]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[0, 0, -0.62]} position={[0.09, 0.08, 0]}>
        <boxGeometry args={[0.03, 0.2, 0.03]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -0.09, 0]}>
        <boxGeometry args={[0.03, 0.19, 0.03]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

interface SportsCarProps {
  position?: [number, number, number];
  rotationY?: number;
  /** Verde Mantis по умолчанию */
  color?: string;
}

export function SportsCar({
  position = [0, 0, 0],
  rotationY = 0,
  color = '#7cb518',
}: SportsCarProps) {
  const bodyGeometry = useMemo(() => buildLoft(BODY_STATIONS), []);
  const cabinGeometry = useMemo(() => buildLoft(CABIN_STATIONS), []);

  const frontR = 0.34;
  const rearR = 0.36;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Кузов */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={color}
          roughness={0.2}
          metalness={0.5}
          clearcoat={1}
          clearcoatRoughness={0.04}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Остекление салона */}
      <mesh geometry={cabinGeometry} castShadow>
        <meshPhysicalMaterial
          color="#0d1418"
          roughness={0.05}
          metalness={0.2}
          transparent
          opacity={0.82}
          envMapIntensity={2}
        />
      </mesh>

      {/* Стойки крыши и кант остекления */}
      <mesh position={[0, 1.19, -0.25]} castShadow>
        <boxGeometry args={[1.02, 0.05, 1.1]} />
        <meshStandardMaterial {...CARBON} />
      </mesh>
      {/* Воздухозаборник на крыше */}
      <mesh position={[0, 1.22, -0.55]} castShadow>
        <boxGeometry args={[0.42, 0.09, 0.6]} />
        <meshStandardMaterial {...CARBON} />
      </mesh>

      {/* Передний сплиттер */}
      <mesh position={[0, 0.09, 2.3]} castShadow>
        <boxGeometry args={[1.86, 0.07, 0.42]} />
        <meshStandardMaterial {...CARBON} />
      </mesh>
      {/* Нижняя губа и воздуховоды */}
      <mesh position={[0, 0.22, 2.34]}>
        <boxGeometry args={[1.3, 0.16, 0.12]} />
        <meshStandardMaterial color="#0e0f12" roughness={0.85} />
      </mesh>
      {[-0.68, 0.68].map((x) => (
        <mesh key={x} position={[x, 0.26, 2.28]}>
          <boxGeometry args={[0.4, 0.22, 0.14]} />
          <meshStandardMaterial color="#0e0f12" roughness={0.85} />
        </mesh>
      ))}

      {/* Фары */}
      {[-0.63, 0.63].map((x) => (
        <group key={x} position={[x, 0.5, 2.24]} rotation={[0.3, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.46, 0.2, 0.08]} />
            <meshStandardMaterial color="#0c0e11" roughness={0.28} metalness={0.5} />
          </mesh>
          <group position={[0, 0, 0.05]}>
            <YLight color="#eaf4ff" intensity={2.4} scale={0.9} />
          </group>
        </group>
      ))}

      {/* Капот: вентиляционные прорези */}
      {[-0.42, 0, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.66, 1.62]} rotation={[0.22, 0, 0]}>
          <boxGeometry args={[0.26, 0.03, 0.34]} />
          <meshStandardMaterial color="#141619" roughness={0.7} />
        </mesh>
      ))}

      {/* Колёсные арки */}
      {[
        [-0.87, 1.39, frontR],
        [0.87, 1.39, frontR],
        [-0.86, -1.39, rearR],
        [0.86, -1.39, rearR],
      ].map(([x, z, r], idx) => (
        <mesh
          key={idx}
          position={[x as number, (r as number) + 0.02, z as number]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <torusGeometry args={[(r as number) + 0.03, 0.035, 8, 24, Math.PI]} />
          <meshStandardMaterial {...CARBON} />
        </mesh>
      ))}

      <Wheel x={-0.87} z={1.39} radius={frontR} width={0.265} />
      <Wheel x={0.87} z={1.39} radius={frontR} width={0.265} />
      <Wheel x={-0.86} z={-1.39} radius={rearR} width={0.345} />
      <Wheel x={0.86} z={-1.39} radius={rearR} width={0.345} />

      {/* Пороги */}
      {[-0.99, 0.99].map((x) => (
        <mesh key={x} position={[x, 0.15, 0.05]} castShadow>
          <boxGeometry args={[0.09, 0.14, 2.1]} />
          <meshStandardMaterial {...CARBON} />
        </mesh>
      ))}

      {/* Воздухозаборники перед задними колёсами */}
      {[-1.0, 1.0].map((x) => (
        <mesh key={x} position={[x, 0.56, -0.72]}>
          <boxGeometry args={[0.05, 0.3, 0.72]} />
          <meshStandardMaterial color="#101216" roughness={0.82} />
        </mesh>
      ))}

      {/* Зеркала */}
      {[-1.05, 1.05].map((x) => (
        <group key={x} position={[x, 0.82, 0.92]}>
          <mesh castShadow rotation={[0, 0, Math.sign(x) * -0.3]}>
            <boxGeometry args={[0.2, 0.04, 0.06]} />
            <meshStandardMaterial {...CARBON} />
          </mesh>
          <mesh position={[Math.sign(x) * 0.13, 0.05, 0]} castShadow>
            <boxGeometry args={[0.06, 0.11, 0.19]} />
            <meshStandardMaterial {...CARBON} />
          </mesh>
        </group>
      ))}

      {/* Крышка моторного отсека: решётка */}
      {Array.from({ length: 7 }).map((_, idx) => (
        <mesh key={idx} position={[0, 0.9 - idx * 0.006, -1.02 - idx * 0.085]} castShadow>
          <boxGeometry args={[1.32, 0.03, 0.055]} />
          <meshStandardMaterial color="#171a1d" roughness={0.55} metalness={0.35} />
        </mesh>
      ))}

      {/* Заднее антикрыло */}
      <mesh position={[0, 1.02, -2.02]} rotation={[-0.1, 0, 0]} castShadow>
        <boxGeometry args={[1.62, 0.05, 0.28]} />
        <meshStandardMaterial {...CARBON} />
      </mesh>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.94, -1.98]} castShadow>
          <boxGeometry args={[0.05, 0.2, 0.34]} />
          <meshStandardMaterial {...CARBON} />
        </mesh>
      ))}

      {/* Задняя панель */}
      <mesh position={[0, 0.62, -2.44]}>
        <boxGeometry args={[1.66, 0.34, 0.08]} />
        <meshStandardMaterial color="#121417" roughness={0.6} />
      </mesh>
      {/* Фонари */}
      {[-0.56, 0.56].map((x) => (
        <group key={x} position={[x, 0.65, -2.49]} rotation={[0, Math.PI, 0]}>
          <YLight color="#ff2d2d" intensity={2.8} scale={1} />
        </group>
      ))}

      {/* Верхние центральные выхлопы */}
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.83, -2.4]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.16, 16]} />
          <meshStandardMaterial color="#3c3f44" roughness={0.35} metalness={0.9} />
        </mesh>
      ))}

      {/* Диффузор */}
      <mesh position={[0, 0.22, -2.36]} rotation={[0.24, 0, 0]} castShadow>
        <boxGeometry args={[1.72, 0.34, 0.4]} />
        <meshStandardMaterial {...CARBON} />
      </mesh>
      {[-0.62, -0.31, 0, 0.31, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.2, -2.44]}>
          <boxGeometry args={[0.05, 0.26, 0.3]} />
          <meshStandardMaterial color="#0b0c0e" roughness={0.9} />
        </mesh>
      ))}

      {/* Номерной знак */}
      <mesh position={[0, 0.44, -2.5]}>
        <boxGeometry args={[0.44, 0.13, 0.02]} />
        <meshStandardMaterial color="#e8e8e4" roughness={0.7} />
      </mesh>

      {/* Мягкая тень под днищем */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.1, 4.9]} />
        <meshBasicMaterial color="#0b0f06" transparent opacity={0.32} depthWrite={false} />
      </mesh>

      {/* Днище */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.78, 0.04, 4.2]} />
        <meshStandardMaterial {...TRIM} />
      </mesh>
    </group>
  );
}
