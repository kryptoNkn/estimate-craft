import type { OpeningItem } from '../../OpeningsManager';

export interface OpeningSize {
  width: number;
  height: number;
  depth: number;
  /** Отметка центра проёма от уровня пола этажа */
  centerY: number;
}

export function getOpeningSize(item: OpeningItem): OpeningSize {
  if (item.type === 'window') {
    if (item.variant === 'panoramic') {
      return { width: 2.52, height: 2.42, depth: 0.14, centerY: 1.28 };
    }
    return { width: 1.42, height: 1.32, depth: 0.16, centerY: 1.5 };
  }

  if (item.variant === 'minimal') {
    return { width: 1.18, height: 2.42, depth: 0.14, centerY: 1.24 };
  }

  return { width: 1.12, height: 2.12, depth: 0.18, centerY: 1.09 };
}

export function getOpeningCenterY(item: OpeningItem, floorHeight: number): number {
  return (item.floor - 1) * floorHeight + getOpeningSize(item).centerY;
}

/**
 * Прямоугольник выреза в стене. Дверные проёмы продлеваются ниже отметки пола,
 * чтобы под полотном не оставалась полоска кладки.
 */
export function getOpeningWallRect(
  item: OpeningItem,
  positionAlongWall: number,
  floorHeight: number,
) {
  const size = getOpeningSize(item);
  const centerY = getOpeningCenterY(item, floorHeight);
  const floorBase = (item.floor - 1) * floorHeight;
  const rawBottom = centerY - size.height / 2;

  return {
    left: positionAlongWall - size.width / 2,
    right: positionAlongWall + size.width / 2,
    bottom: item.type === 'door' ? floorBase - 0.1 : rawBottom,
    top: centerY + size.height / 2,
  };
}
