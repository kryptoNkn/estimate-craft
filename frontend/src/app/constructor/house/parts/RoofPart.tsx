'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createFacadeTexture } from '@/utils/facadeMaterials';
import {
  createRoofTexture,
  roofSurfaceProps,
  type RoofCovering,
} from '@/utils/roofMaterials';
import {
  buildGableRoof,
  buildHipRoof,
  buildMansardRoof,
  buildShedRoof,
  edgeTransform,
  polygonsToGeometry,
  type RoofShape,
} from '../utils/roofGeometry';

export type RoofType = 'flat' | 'hip' | 'gable' | 'shed' | 'mansard' | 'chalet';

interface RoofPartProps {
  position: [number, number, number];
  width: number;
  depth: number;
  roofType?: RoofType;
  covering?: RoofCovering;
  color?: string;
  accentColor?: string;
  pitch?: number;
  overhang?: number;
  gableTextureType?: string;
  gableColor?: string;
  gableSecondaryColor?: string;
  jointColor?: string;
  hasChimney?: boolean;
  /** Высота стен — по ней прокладываются водосточные трубы */
  downpipeHeight?: number;
}

const TEXTURE_WORLD_SIZE = 1.4;

function useRoofMaterial(covering: RoofCovering, color: string) {
  return useMemo(() => {
    const { map, normalMap } = createRoofTexture(covering, color);
    const surface = roofSurfaceProps(covering);

    return new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map,
      normalMap,
      side: THREE.FrontSide,
      ...surface,
    });
  }, [covering, color]);
}

function useGableMaterial(
  textureType: string,
  color: string,
  secondaryColor?: string,
  jointColor?: string,
) {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return new THREE.MeshStandardMaterial({ color, roughness: 0.78 });
    }

    try {
      const result = createFacadeTexture(textureType, color, secondaryColor || color, jointColor);
      // UV уже разложены в метрах, поэтому сбрасываем повтор текстуры.
      result.map?.repeat.set(1, 1);
      result.normalMap?.repeat.set(1, 1);

      return new THREE.MeshStandardMaterial({
        color: '#ffffff',
        map: result.map,
        normalMap: result.normalMap,
        roughness: 0.78,
        side: THREE.DoubleSide,
      });
    } catch {
      return new THREE.MeshStandardMaterial({ color, roughness: 0.78 });
    }
  }, [textureType, color, secondaryColor, jointColor]);
}

function buildShape(
  roofType: RoofType,
  width: number,
  depth: number,
  pitch: number,
  overhang: number,
): RoofShape {
  switch (roofType) {
    case 'gable':
      return buildGableRoof({ width, depth, pitch, overhang });
    case 'chalet':
      return buildGableRoof({ width, depth, pitch, overhang, rakeOverhang: overhang * 1.15 });
    case 'shed':
      return buildShedRoof({ width, depth, pitch, overhang });
    case 'mansard':
      return buildMansardRoof({ width, depth, pitch, overhang });
    default:
      return buildHipRoof({ width, depth, pitch, overhang });
  }
}

export function RoofPart({
  position,
  width,
  depth,
  roofType = 'hip',
  covering = 'tile',
  color = '#334155',
  accentColor = '#1e293b',
  pitch,
  overhang,
  gableTextureType = 'stucco',
  gableColor = '#D2C4B3',
  gableSecondaryColor,
  jointColor,
  hasChimney = false,
  downpipeHeight = 0,
}: RoofPartProps) {
  const resolvedPitch = pitch ?? (roofType === 'chalet' ? 0.62 : roofType === 'shed' ? 0.18 : 0.85);
  const resolvedOverhang = overhang ?? (roofType === 'chalet' ? 1.15 : 0.5);

  const slopeMaterial = useRoofMaterial(covering, color);
  const gableMaterial = useGableMaterial(
    gableTextureType,
    gableColor,
    gableSecondaryColor,
    jointColor,
  );

  const shape = useMemo(
    () => buildShape(roofType, width, depth, resolvedPitch, resolvedOverhang),
    [roofType, width, depth, resolvedPitch, resolvedOverhang],
  );

  const slopeGeometry = useMemo(
    () => polygonsToGeometry(shape.slopes, TEXTURE_WORLD_SIZE),
    [shape],
  );

  const soffitGeometry = useMemo(
    () => polygonsToGeometry(shape.slopes.map((poly) => [...poly].reverse()), TEXTURE_WORLD_SIZE),
    [shape],
  );

  const gableGeometry = useMemo(
    () => (shape.gables.length ? polygonsToGeometry(shape.gables, 1) : null),
    [shape],
  );

  if (roofType === 'flat') {
    return (
      <FlatRoof
        position={position}
        width={width}
        depth={depth}
        color={color}
        accentColor={accentColor}
        overhang={resolvedOverhang * 0.7}
      />
    );
  }

  return (
    <group position={position}>
      <mesh geometry={slopeGeometry} material={slopeMaterial} castShadow receiveShadow />

      <mesh geometry={soffitGeometry} castShadow>
        <meshStandardMaterial color="#d6c4a8" roughness={0.82} side={THREE.FrontSide} />
      </mesh>

      {gableGeometry && (
        <mesh geometry={gableGeometry} material={gableMaterial} castShadow receiveShadow />
      )}

      {/* Лобовая доска и водосточный жёлоб по карнизу */}
      {shape.eaveEdges.map((edge, index) => {
        const { length, center, rotationY } = edgeTransform(edge);

        return (
          <group key={`eave-${index}`} position={center} rotation={[0, rotationY, 0]}>
            <mesh castShadow receiveShadow position={[0, -0.09, 0]}>
              <boxGeometry args={[length, 0.2, 0.05]} />
              <meshStandardMaterial color={accentColor} roughness={0.45} metalness={0.15} />
            </mesh>
            <mesh position={[0, -0.24, 0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, length, 12, 1, false, 0, Math.PI]} />
              <meshStandardMaterial
                color={accentColor}
                roughness={0.35}
                metalness={0.55}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* Водосточные трубы по углам главного карниза */}
      {downpipeHeight > 0 &&
        shape.eaveEdges.slice(0, 1).map((edge) => {
          const { length, center, rotationY } = edgeTransform(edge);
          return [-1, 1].map((side) => (
            <group
              key={`downpipe-${side}`}
              position={center}
              rotation={[0, rotationY, 0]}
            >
              <mesh
                position={[side * (length / 2 - 0.25), -downpipeHeight / 2 - 0.3, 0.05]}
                castShadow
              >
                <cylinderGeometry args={[0.05, 0.05, downpipeHeight, 10]} />
                <meshStandardMaterial color={accentColor} roughness={0.4} metalness={0.5} />
              </mesh>
            </group>
          ));
        })}

      {shape.ridgeEdges
        .map((edge, index) => ({ edge, index, ...edgeTransform(edge) }))
        .filter((item) => item.length > 0.2)
        .map(({ index, length, center, rotationY }) => (
          <mesh
            key={`ridge-${index}`}
            position={[center[0], center[1] + 0.06, center[2]]}
            rotation={[0, rotationY, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.11, 0.11, length + 0.12, 10, 1, false, 0, Math.PI]} />
            <meshStandardMaterial
              color={accentColor}
              roughness={0.55}
              metalness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}

      {roofType === 'chalet' && <ChaletBeams width={width} depth={depth} shape={shape} />}

      {hasChimney && (
        <Chimney
          apex={shape.apex}
          width={width}
          depth={depth}
          roofType={roofType}
          color={accentColor}
        />
      )}
    </group>
  );
}

function ChaletBeams({
  width,
  depth,
  shape,
}: {
  width: number;
  depth: number;
  shape: RoofShape;
}) {
  const beamCount = Math.max(3, Math.round(width / 1.6));

  return (
    <group>
      {Array.from({ length: beamCount }).map((_, index) => {
        const x = -width / 2 + (index + 0.5) * (width / beamCount);
        return (
          <React.Fragment key={index}>
            <mesh position={[x, -0.05, depth / 2 + 0.4]} castShadow>
              <boxGeometry args={[0.12, 0.16, 1.5]} />
              <meshStandardMaterial color="#5B3A21" roughness={0.8} />
            </mesh>
            <mesh position={[x, -0.05, -depth / 2 - 0.4]} castShadow>
              <boxGeometry args={[0.12, 0.16, 1.5]} />
              <meshStandardMaterial color="#5B3A21" roughness={0.8} />
            </mesh>
          </React.Fragment>
        );
      })}

      {/* Подконьковая балка на фронтоне */}
      <mesh position={[0, shape.apex - 0.35, 0]} castShadow>
        <boxGeometry args={[width + 1.8, 0.18, 0.18]} />
        <meshStandardMaterial color="#5B3A21" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Chimney({
  apex,
  width,
  depth,
  roofType,
  color,
}: {
  apex: number;
  width: number;
  depth: number;
  roofType: RoofType;
  color: string;
}) {
  // Труба ставится у конька, а её высота считается от отметки скатов
  // в этой точке — иначе на вальмовых крышах она превращается в башню.
  const x = width * 0.2;
  const z = -depth * 0.14;
  const alongRidge = roofType === 'gable' || roofType === 'chalet';
  const t = alongRidge
    ? Math.abs(z) / (depth / 2)
    : Math.max(Math.abs(x) / (width / 2), Math.abs(z) / (depth / 2));
  const surfaceY = apex * (1 - t);
  const shaft = surfaceY + 0.5;
  const top = shaft + 0.62;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, (top - 0.5) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.58, top + 0.5, 0.58]} />
        <meshStandardMaterial color={color} roughness={0.88} />
      </mesh>
      {/* Отлив по примыканию к скату */}
      <mesh position={[0, surfaceY + 0.04, 0]} castShadow>
        <boxGeometry args={[0.74, 0.08, 0.74]} />
        <meshStandardMaterial color="#6b6864" roughness={0.6} metalness={0.35} />
      </mesh>
      {/* Оголовок */}
      <mesh position={[0, top - 0.2, 0]} castShadow>
        <boxGeometry args={[0.76, 0.1, 0.76]} />
        <meshStandardMaterial color="#57534e" roughness={0.65} />
      </mesh>
      <mesh position={[0, top - 0.04, 0]} castShadow>
        <boxGeometry args={[0.44, 0.22, 0.44]} />
        <meshStandardMaterial color="#292524" roughness={0.85} />
      </mesh>
    </group>
  );
}

function FlatRoof({
  position,
  width,
  depth,
  color,
  accentColor,
  overhang,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  color: string;
  accentColor: string;
  overhang: number;
}) {
  const material = useRoofMaterial('membrane', color);
  const rw = width + overhang * 2;
  const rd = depth + overhang * 2;
  const parapet = 0.36;

  return (
    <group position={position}>
      {/* Плита покрытия с выносом */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[rw, 0.22, rd]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.06} />
      </mesh>

      {/* Кровельная мембрана */}
      <mesh position={[0, 0.12, 0]} receiveShadow material={material}>
        <boxGeometry args={[width - 0.1, 0.03, depth - 0.1]} />
      </mesh>

      {/* Теневой шов под плитой — читается вынос консоли */}
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[width - 0.12, 0.08, depth - 0.12]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>

      {/* Парапет */}
      {([
        [0, parapet / 2 + 0.11, depth / 2 - 0.06, width, parapet, 0.12],
        [0, parapet / 2 + 0.11, -depth / 2 + 0.06, width, parapet, 0.12],
        [width / 2 - 0.06, parapet / 2 + 0.11, 0, 0.12, parapet, depth],
        [-width / 2 + 0.06, parapet / 2 + 0.11, 0, 0.12, parapet, depth],
      ] as const).map(([x, y, z, w, h, d], index) => (
        <mesh key={index} position={[x, y, z]} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.34} metalness={0.05} />
        </mesh>
      ))}

      {/* Воронки внутреннего водостока */}
      {[
        [width / 2 - 0.7, depth / 2 - 0.7],
        [-width / 2 + 0.7, -depth / 2 + 0.7],
      ].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.14, z]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.16, 16]} />
          <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.6} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
