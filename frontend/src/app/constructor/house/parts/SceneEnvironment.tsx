'use client';

import React, { useMemo } from 'react';
import { Sky, Clouds, Cloud } from '@react-three/drei';

interface SceneEnvironmentProps {
  /** Радиус участка */
  plotRadius?: number;
  /** Ось подъездной площадки — совпадает с гаражом, если он есть */
  drivewayX?: number;
}

/** Валуны в ландшафте — как на референсе */
const ROCKS: Array<{ position: [number, number]; scale: number; rot: number }> = [
  { position: [-9.8, 6.2], scale: 0.9, rot: 0.6 },
  { position: [-11.2, 3.4], scale: 0.62, rot: 2.1 },
  { position: [9.6, 7.8], scale: 0.75, rot: 1.2 },
  { position: [11.4, 4.6], scale: 0.5, rot: 0.3 },
  { position: [-7.6, 9.4], scale: 0.55, rot: 2.6 },
  { position: [7.2, 10.6], scale: 0.42, rot: 1.7 },
  { position: [-13.4, -2.2], scale: 1.05, rot: 0.9 },
];

const TREES: Array<{ position: [number, number]; scale: number; kind: 'conifer' | 'broadleaf' }> = [
  { position: [-13, -6], scale: 1.25, kind: 'conifer' },
  { position: [-15.5, 3], scale: 1.0, kind: 'broadleaf' },
  { position: [13.5, -8], scale: 1.15, kind: 'broadleaf' },
  { position: [16, 2.5], scale: 0.9, kind: 'conifer' },
  { position: [-9, -14], scale: 1.05, kind: 'broadleaf' },
  { position: [8, -15], scale: 1.2, kind: 'conifer' },
];

const SHRUBS: Array<[number, number, number]> = [
  [-8.6, 7.4, 0.55],
  [-7.4, 7.9, 0.42],
  [9.4, 7.6, 0.5],
  [10.6, 7.2, 0.38],
  [-10.2, 4.5, 0.46],
];

export function SceneEnvironment({
  plotRadius = 30,
  drivewayX = 0,
}: SceneEnvironmentProps) {
  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[20, 26, 10]}
        inclination={0.52}
        azimuth={0.22}
        mieCoefficient={0.005}
        mieDirectionalG={0.82}
        rayleigh={0.5}
        turbidity={7}
      />

      <Clouds limit={80}>
        <Cloud
          seed={4}
          opacity={0.24}
          speed={0.14}
          bounds={[16, 3, 6]}
          volume={9}
          segments={24}
          position={[-10, 16, -16]}
        />
        <Cloud
          seed={9}
          opacity={0.18}
          speed={0.1}
          bounds={[12, 3, 5]}
          volume={7}
          segments={18}
          position={[13, 18, -20]}
        />
      </Clouds>

      <Ground plotRadius={plotRadius} drivewayX={drivewayX} />

      {TREES.map((tree, index) => (
        <Tree
          key={index}
          position={[tree.position[0], 0, tree.position[1]]}
          scale={tree.scale}
          kind={tree.kind}
        />
      ))}

      {SHRUBS.map(([x, z, size], index) => (
        <mesh key={index} position={[x, size * 0.7, z]} castShadow receiveShadow>
          <sphereGeometry args={[size, 10, 8]} />
          <meshStandardMaterial color="#3f6212" roughness={0.95} flatShading />
        </mesh>
      ))}

      {ROCKS.map((rock, index) => (
        <mesh
          key={index}
          position={[rock.position[0], rock.scale * 0.42, rock.position[1]]}
          rotation={[rock.rot * 0.3, rock.rot, rock.rot * 0.2]}
          scale={[rock.scale, rock.scale * 0.68, rock.scale * 0.85]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#6f6b66" roughness={0.94} flatShading />
        </mesh>
      ))}
    </>
  );
}

function Ground({ plotRadius, drivewayX }: { plotRadius: number; drivewayX: number }) {
  return (
    <group>
      {/* Газон участка */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[plotRadius, 72]} />
        <meshStandardMaterial color="#4d7c0f" roughness={0.98} metalness={0} />
      </mesh>

      {/* Тёмный подлесок по краю участка */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <ringGeometry args={[plotRadius - 5, plotRadius + 12, 72]} />
        <meshStandardMaterial color="#365314" roughness={0.98} />
      </mesh>

      {/* Отмостка вокруг дома */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <ringGeometry args={[0, 9.4, 4, 1, Math.PI / 4, Math.PI * 2]} />
        <meshStandardMaterial color="#a8a29e" roughness={0.92} />
      </mesh>

      {/* Подъездная площадка перед воротами */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[drivewayX, 0.02, 11]} receiveShadow>
        <planeGeometry args={[7.2, 14]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.88} />
      </mesh>
      {/* Швы бетонных плит */}
      {Array.from({ length: 6 }).map((_, index) => (
        <mesh
          key={index}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[drivewayX, 0.023, 6 + index * 2.1]}
          receiveShadow
        >
          <planeGeometry args={[7.2, 0.06]} />
          <meshStandardMaterial color="#7e848c" roughness={0.9} />
        </mesh>
      ))}

      {/* Пешеходная дорожка к входу */}
      {Array.from({ length: 7 }).map((_, index) => (
        <mesh
          key={index}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.024, 8.4 + index * 0.95]}
          receiveShadow
        >
          <planeGeometry args={[1.6, 0.72]} />
          <meshStandardMaterial color="#d6d3d1" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({
  position,
  scale,
  kind,
}: {
  position: [number, number, number];
  scale: number;
  kind: 'conifer' | 'broadleaf';
}) {
  const foliage = useMemo(() => {
    if (kind === 'conifer') {
      return [
        { y: 3.0, radius: 1.5, height: 2.6 },
        { y: 4.4, radius: 1.15, height: 2.2 },
        { y: 5.6, radius: 0.8, height: 1.8 },
      ];
    }
    return [
      { y: 3.4, radius: 1.9, height: 0 },
      { y: 4.5, radius: 1.45, height: 0 },
      { y: 3.9, radius: 1.3, height: 0 },
    ];
  }, [kind]);

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.26, 3, 8]} />
        <meshStandardMaterial color="#57402c" roughness={0.95} />
      </mesh>

      {foliage.map((blob, index) => (
        <mesh
          key={index}
          position={[index === 2 ? 0.6 : 0, blob.y, index === 2 ? -0.4 : 0]}
          castShadow
          receiveShadow
        >
          {kind === 'conifer' ? (
            <coneGeometry args={[blob.radius, blob.height, 9]} />
          ) : (
            <icosahedronGeometry args={[blob.radius, 1]} />
          )}
          <meshStandardMaterial
            color={kind === 'conifer' ? '#2f5115' : '#4a7c1a'}
            roughness={0.96}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}

export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.32} />
      <hemisphereLight args={['#cfe6ff', '#3f5b16', 0.5]} />
      <directionalLight
        castShadow
        position={[18, 24, 12]}
        intensity={2.1}
        color="#fff6e6"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={70}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={24}
        shadow-camera-bottom={-16}
        shadow-normalBias={0.03}
        shadow-bias={-0.0002}
      />
      {/* Заполняющий свет с теневой стороны */}
      <directionalLight position={[-14, 9, -10]} intensity={0.35} color="#c7dcff" />
    </>
  );
}
