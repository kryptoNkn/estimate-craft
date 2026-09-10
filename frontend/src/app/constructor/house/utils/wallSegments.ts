import * as THREE from 'three';

export interface WallCutout {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

export interface WallSegment {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TEXEL = 1.25;

/**
 * BoxGeometry UV: 6 граней по 4 вершины, порядок +x -x +y -y +z -z.
 * Раскладываем в метрах, чтобы кирпич не растягивался на узких простенках.
 */
export function createWorldUvBox(
  width: number,
  height: number,
  depth: number,
  u0: number,
  v0: number,
) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const uv = geometry.getAttribute('uv');
  const faces = [
    { fw: depth, fh: height },
    { fw: depth, fh: height },
    { fw: width, fh: depth },
    { fw: width, fh: depth },
    { fw: width, fh: height },
    { fw: width, fh: height },
  ];

  for (let face = 0; face < 6; face += 1) {
    const { fw, fh } = faces[face];
    for (let i = 0; i < 4; i += 1) {
      const index = face * 4 + i;
      const u = uv.getX(index);
      const v = uv.getY(index);
      uv.setXY(index, (u0 + u * fw) / TEXEL, (v0 + v * fh) / TEXEL);
    }
  }

  uv.needsUpdate = true;
  return geometry;
}

export function buildWallSegments(
  wallLength: number,
  wallHeight: number,
  cutouts: WallCutout[],
): WallSegment[] {
  if (cutouts.length === 0) {
    return [{ x: wallLength / 2, y: wallHeight / 2, width: wallLength, height: wallHeight }];
  }

  const sorted = [...cutouts]
    .map((cutout) => ({
      left: Math.max(0, cutout.left),
      right: Math.min(wallLength, cutout.right),
      bottom: Math.max(0, cutout.bottom),
      top: Math.min(wallHeight, cutout.top),
    }))
    .filter((cutout) => cutout.right > cutout.left && cutout.top > cutout.bottom)
    .sort((a, b) => a.left - b.left);

  const segments: WallSegment[] = [];
  let cursor = 0;

  for (const cutout of sorted) {
    if (cutout.left > cursor + 0.02) {
      segments.push({
        x: cursor + (cutout.left - cursor) / 2,
        y: wallHeight / 2,
        width: cutout.left - cursor,
        height: wallHeight,
      });
    }

    if (cutout.bottom > 0.02) {
      segments.push({
        x: (cutout.left + cutout.right) / 2,
        y: cutout.bottom / 2,
        width: cutout.right - cutout.left,
        height: cutout.bottom,
      });
    }

    if (cutout.top < wallHeight - 0.02) {
      segments.push({
        x: (cutout.left + cutout.right) / 2,
        y: cutout.top + (wallHeight - cutout.top) / 2,
        width: cutout.right - cutout.left,
        height: wallHeight - cutout.top,
      });
    }

    cursor = Math.max(cursor, cutout.right);
  }

  if (cursor < wallLength - 0.02) {
    segments.push({
      x: cursor + (wallLength - cursor) / 2,
      y: wallHeight / 2,
      width: wallLength - cursor,
      height: wallHeight,
    });
  }

  return segments.filter((segment) => segment.width > 0.02 && segment.height > 0.02);
}
