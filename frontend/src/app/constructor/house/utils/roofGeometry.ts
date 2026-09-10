import * as THREE from 'three';

export type Vec3 = [number, number, number];
export type Edge = [Vec3, Vec3];

export interface RoofShape {
  /** Скатные плоскости кровли */
  slopes: Vec3[][];
  /** Вертикальные фронтоны (зашиваются фасадным материалом) */
  gables: Vec3[][];
  /** Карнизные рёбра — по ним ставятся лобовые доски и водостоки */
  eaveEdges: Edge[];
  /** Коньковые рёбра */
  ridgeEdges: Edge[];
  /** Высота конька над отметкой верха стен */
  apex: number;
}

function vec(poly: Vec3): THREE.Vector3 {
  return new THREE.Vector3(poly[0], poly[1], poly[2]);
}

/**
 * Триангулирует выпуклые полигоны веером и раскладывает UV планарной
 * проекцией в плоскости каждого полигона, чтобы черепица не растягивалась.
 */
export function polygonsToGeometry(polygons: Vec3[][], textureWorldSize = 1.4) {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const uvScale = 1 / textureWorldSize;

  for (const polygon of polygons) {
    if (polygon.length < 3) continue;

    const origin = vec(polygon[0]);
    const edgeA = vec(polygon[1]).sub(origin);
    const edgeB = vec(polygon[2]).sub(origin);
    const normal = new THREE.Vector3().crossVectors(edgeA, edgeB).normalize();
    if (normal.y < 0) normal.negate();

    const tangent = edgeA.clone().normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

    const projected = polygon.map((point) => {
      const local = vec(point).sub(origin);
      return [local.dot(tangent) * uvScale, local.dot(bitangent) * uvScale];
    });

    for (let i = 1; i < polygon.length - 1; i += 1) {
      for (const index of [0, i, i + 1]) {
        positions.push(...polygon[index]);
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(projected[index][0], projected[index][1]);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();
  return geometry;
}

export interface RoofParams {
  width: number;
  depth: number;
  /** Уклон как отношение подъёма к заложению */
  pitch: number;
  /** Свес по карнизу */
  overhang: number;
  /** Свес по фронтону */
  rakeOverhang?: number;
}

export function buildGableRoof({
  width,
  depth,
  pitch,
  overhang,
  rakeOverhang = overhang,
}: RoofParams): RoofShape {
  const apex = (depth / 2) * pitch;
  const ew = width + rakeOverhang * 2;
  const ed = depth + overhang * 2;
  const ey = -overhang * pitch;

  return {
    slopes: [
      [
        [-ew / 2, ey, ed / 2],
        [ew / 2, ey, ed / 2],
        [ew / 2, apex, 0],
        [-ew / 2, apex, 0],
      ],
      [
        [ew / 2, ey, -ed / 2],
        [-ew / 2, ey, -ed / 2],
        [-ew / 2, apex, 0],
        [ew / 2, apex, 0],
      ],
    ],
    gables: [
      [
        [-width / 2, 0, -depth / 2],
        [-width / 2, 0, depth / 2],
        [-width / 2, apex, 0],
      ],
      [
        [width / 2, 0, depth / 2],
        [width / 2, 0, -depth / 2],
        [width / 2, apex, 0],
      ],
    ],
    eaveEdges: [
      [
        [-ew / 2, ey, ed / 2],
        [ew / 2, ey, ed / 2],
      ],
      [
        [-ew / 2, ey, -ed / 2],
        [ew / 2, ey, -ed / 2],
      ],
    ],
    ridgeEdges: [
      [
        [-ew / 2, apex, 0],
        [ew / 2, apex, 0],
      ],
    ],
    apex,
  };
}

export function buildHipRoof({ width, depth, pitch, overhang }: RoofParams): RoofShape {
  const ew = width + overhang * 2;
  const ed = depth + overhang * 2;
  const ey = -overhang * pitch;
  const run = Math.min(width, depth) / 2;
  const apexH = run * pitch;
  const ridgeLen = Math.max(Math.abs(width - depth), 0);
  const alongX = width >= depth;

  const eaveEdges: Edge[] = [
    [
      [-ew / 2, ey, ed / 2],
      [ew / 2, ey, ed / 2],
    ],
    [
      [ew / 2, ey, -ed / 2],
      [-ew / 2, ey, -ed / 2],
    ],
    [
      [ew / 2, ey, ed / 2],
      [ew / 2, ey, -ed / 2],
    ],
    [
      [-ew / 2, ey, -ed / 2],
      [-ew / 2, ey, ed / 2],
    ],
  ];

  if (ridgeLen < 0.08) {
    const peak: Vec3 = [0, apexH, 0];
    return {
      slopes: [
        [
          [-ew / 2, ey, ed / 2],
          [ew / 2, ey, ed / 2],
          peak,
        ],
        [
          [ew / 2, ey, -ed / 2],
          [-ew / 2, ey, -ed / 2],
          peak,
        ],
        [
          [ew / 2, ey, ed / 2],
          [ew / 2, ey, -ed / 2],
          peak,
        ],
        [
          [-ew / 2, ey, -ed / 2],
          [-ew / 2, ey, ed / 2],
          peak,
        ],
      ],
      gables: [],
      eaveEdges,
      ridgeEdges: [],
      apex: apexH,
    };
  }

  if (alongX) {
    const rx = ridgeLen / 2;
    const ridgeA: Vec3 = [-rx, apexH, 0];
    const ridgeB: Vec3 = [rx, apexH, 0];

    return {
      slopes: [
        [
          [-ew / 2, ey, ed / 2],
          [ew / 2, ey, ed / 2],
          ridgeB,
          ridgeA,
        ],
        [
          [ew / 2, ey, -ed / 2],
          [-ew / 2, ey, -ed / 2],
          ridgeA,
          ridgeB,
        ],
        [
          [ew / 2, ey, ed / 2],
          [ew / 2, ey, -ed / 2],
          ridgeB,
        ],
        [
          [-ew / 2, ey, -ed / 2],
          [-ew / 2, ey, ed / 2],
          ridgeA,
        ],
      ],
      gables: [],
      eaveEdges,
      ridgeEdges: [[ridgeA, ridgeB]],
      apex: apexH,
    };
  }

  const rz = ridgeLen / 2;
  const ridgeA: Vec3 = [0, apexH, -rz];
  const ridgeB: Vec3 = [0, apexH, rz];

  return {
    slopes: [
      [
        [-ew / 2, ey, ed / 2],
        [ew / 2, ey, ed / 2],
        ridgeB,
      ],
      [
        [ew / 2, ey, -ed / 2],
        [-ew / 2, ey, -ed / 2],
        ridgeA,
      ],
      [
        [ew / 2, ey, ed / 2],
        [ew / 2, ey, -ed / 2],
        ridgeA,
        ridgeB,
      ],
      [
        [-ew / 2, ey, -ed / 2],
        [-ew / 2, ey, ed / 2],
        ridgeB,
        ridgeA,
      ],
    ],
    gables: [],
    eaveEdges,
    ridgeEdges: [[ridgeA, ridgeB]],
    apex: apexH,
  };
}

export function buildShedRoof({ width, depth, pitch, overhang }: RoofParams): RoofShape {
  const apex = depth * pitch;
  const ew = width + overhang * 2;
  const ed = depth + overhang * 2;
  const low = -overhang * pitch;
  const high = apex + overhang * pitch;

  return {
    slopes: [
      [
        [-ew / 2, low, ed / 2],
        [ew / 2, low, ed / 2],
        [ew / 2, high, -ed / 2],
        [-ew / 2, high, -ed / 2],
      ],
    ],
    gables: [
      [
        [-width / 2, 0, depth / 2],
        [-width / 2, 0, -depth / 2],
        [-width / 2, apex, -depth / 2],
      ],
      [
        [width / 2, 0, -depth / 2],
        [width / 2, 0, depth / 2],
        [width / 2, apex, -depth / 2],
      ],
    ],
    eaveEdges: [
      [
        [-ew / 2, low, ed / 2],
        [ew / 2, low, ed / 2],
      ],
    ],
    ridgeEdges: [
      [
        [-ew / 2, high, -ed / 2],
        [ew / 2, high, -ed / 2],
      ],
    ],
    apex,
  };
}

export function buildMansardRoof({ width, depth, overhang }: RoofParams): RoofShape {
  const knee = Math.min(width, depth) * 0.24;
  const kneeHeight = knee * 1.9;
  const kw = width - knee * 2;
  const kd = depth - knee * 2;

  const ew = width + overhang * 2;
  const ed = depth + overhang * 2;
  const ey = -overhang * 1.9;

  const upper = buildHipRoof({
    width: kw,
    depth: kd,
    pitch: 0.5,
    overhang: 0.12,
  });

  const lift = (poly: Vec3[]): Vec3[] =>
    poly.map(([x, y, z]) => [x, y + kneeHeight, z] as Vec3);

  return {
    slopes: [
      [
        [-ew / 2, ey, ed / 2],
        [ew / 2, ey, ed / 2],
        [kw / 2, kneeHeight, kd / 2],
        [-kw / 2, kneeHeight, kd / 2],
      ],
      [
        [ew / 2, ey, -ed / 2],
        [-ew / 2, ey, -ed / 2],
        [-kw / 2, kneeHeight, -kd / 2],
        [kw / 2, kneeHeight, -kd / 2],
      ],
      [
        [ew / 2, ey, ed / 2],
        [ew / 2, ey, -ed / 2],
        [kw / 2, kneeHeight, -kd / 2],
        [kw / 2, kneeHeight, kd / 2],
      ],
      [
        [-ew / 2, ey, -ed / 2],
        [-ew / 2, ey, ed / 2],
        [-kw / 2, kneeHeight, kd / 2],
        [-kw / 2, kneeHeight, -kd / 2],
      ],
      ...upper.slopes.map(lift),
    ],
    gables: [],
    eaveEdges: [
      [
        [-ew / 2, ey, ed / 2],
        [ew / 2, ey, ed / 2],
      ],
      [
        [-ew / 2, ey, -ed / 2],
        [ew / 2, ey, -ed / 2],
      ],
      [
        [ew / 2, ey, ed / 2],
        [ew / 2, ey, -ed / 2],
      ],
      [
        [-ew / 2, ey, ed / 2],
        [-ew / 2, ey, -ed / 2],
      ],
    ],
    ridgeEdges: upper.ridgeEdges.map(
      ([a, b]) =>
        [
          [a[0], a[1] + kneeHeight, a[2]],
          [b[0], b[1] + kneeHeight, b[2]],
        ] as Edge,
    ),
    apex: kneeHeight + upper.apex,
  };
}

/** Длина ребра и его угол поворота вокруг оси Y — для лобовых досок и желобов */
export function edgeTransform(edge: Edge) {
  const [a, b] = edge;
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const length = Math.hypot(dx, dz);

  return {
    length,
    center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2] as Vec3,
    rotationY: Math.atan2(-dz, dx),
  };
}
