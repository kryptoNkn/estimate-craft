import type { OpeningItem } from '../../OpeningsManager';

export type HouseWallFace = 'front' | 'right' | 'back' | 'left';

export interface HouseDimensions {
  width: number;
  depth: number;
  hasGarage: boolean;
  garageCars: number;
}

export function getFootprintMetrics({
  width,
  depth,
  hasGarage,
  garageCars,
}: HouseDimensions) {
  const garageWidth = hasGarage ? garageCars * 3.4 + 0.6 : 0;
  const totalWidth = width + garageWidth;
  const halfW = totalWidth / 2;
  const halfD = depth / 2;
  const totalPerimeter = (totalWidth + depth) * 2;
  // Корпус дома смещён влево, чтобы гараж пристроился справа, а весь
  // объём остался отцентрованным относительно сцены.
  const groupShiftX = -garageWidth / 2;

  return {
    garageWidth,
    totalWidth,
    halfW,
    halfD,
    totalPerimeter,
    groupShiftX,
  };
}

export function getWallPositionAndRotation(offset: number, dims: HouseDimensions) {
  const { totalWidth, halfW, halfD, totalPerimeter } = getFootprintMetrics(dims);
  const norm = ((offset % totalPerimeter) + totalPerimeter) % totalPerimeter;

  if (norm < totalWidth) {
    return {
      pos: [-halfW + norm, 0, halfD] as [number, number, number],
      rotY: 0,
      face: 'front' as const,
    };
  }

  if (norm < totalWidth + dims.depth) {
    const d = norm - totalWidth;
    return {
      pos: [halfW, 0, halfD - d] as [number, number, number],
      rotY: Math.PI / 2,
      face: 'right' as const,
    };
  }

  if (norm < totalWidth * 2 + dims.depth) {
    const d = norm - (totalWidth + dims.depth);
    return {
      pos: [halfW - d, 0, -halfD] as [number, number, number],
      rotY: Math.PI,
      face: 'back' as const,
    };
  }

  const d = norm - (totalWidth * 2 + dims.depth);
  return {
    pos: [-halfW, 0, -halfD + d] as [number, number, number],
    rotY: -Math.PI / 2,
    face: 'left' as const,
  };
}

export function calculatePerimeterOffset(x: number, z: number, dims: HouseDimensions) {
  const { totalWidth, halfW, halfD, totalPerimeter } = getFootprintMetrics(dims);

  const distFront = Math.abs(z - halfD);
  const distRight = Math.abs(x - halfW);
  const distBack = Math.abs(z + halfD);
  const distLeft = Math.abs(x + halfW);

  const minDist = Math.min(distFront, distRight, distBack, distLeft);

  let offset = 0;
  if (minDist === distFront) {
    offset = x + halfW;
  } else if (minDist === distRight) {
    offset = totalWidth + (halfD - z);
  } else if (minDist === distBack) {
    offset = totalWidth + dims.depth + (halfW - x);
  } else {
    offset = totalWidth * 2 + dims.depth + (z + halfD);
  }

  return (offset + totalPerimeter) % totalPerimeter;
}

export interface ResolvedHouseOpening {
  opening: OpeningItem;
  face: HouseWallFace;
  /** Координаты в системе координат корпуса дома (без учёта гаража) */
  localX: number;
  localZ: number;
}

/**
 * Переводит позицию проёма на общем периметре застройки в локальные координаты
 * корпуса дома. Возвращает null, если проём попал на гараж, а не на дом.
 */
export function resolveOpeningOnHouseWall(
  opening: OpeningItem,
  dims: HouseDimensions,
): ResolvedHouseOpening | null {
  const { groupShiftX } = getFootprintMetrics(dims);
  const { pos, face } = getWallPositionAndRotation(opening.perimeterOffset, dims);

  const localX = pos[0] - groupShiftX;
  const localZ = pos[2];

  const halfWidth = dims.width / 2;
  const halfDepth = dims.depth / 2;
  const tolerance = 0.05;

  if (face === 'front' || face === 'back') {
    if (localX < -halfWidth - tolerance || localX > halfWidth + tolerance) {
      return null;
    }
  } else if (face === 'right' && dims.hasGarage) {
    // Правая стена дома закрыта пристроенным гаражом.
    return null;
  } else if (localZ < -halfDepth - tolerance || localZ > halfDepth + tolerance) {
    return null;
  }

  return { opening, face, localX, localZ };
}

/** Позиция проёма вдоль стены, отсчитанная от её левого края */
export function projectOntoWall(
  resolved: ResolvedHouseOpening,
  dims: HouseDimensions,
  sideWallLength: number,
) {
  switch (resolved.face) {
    case 'front':
      return resolved.localX + dims.width / 2;
    case 'back':
      return dims.width / 2 - resolved.localX;
    case 'left':
      return sideWallLength / 2 - resolved.localZ;
    default:
      return sideWallLength / 2 - resolved.localZ;
  }
}

export function getWallLength(face: HouseWallFace, dims: HouseDimensions) {
  return face === 'front' || face === 'back' ? dims.width : dims.depth;
}
