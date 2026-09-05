import * as THREE from 'three';

export interface ColorPairOption {
  label: string;
  colors: [string, string];
}

export const FACADE_PRESETS: Record<string, { name: string; defaultColors: [string, string]; colorPairs: ColorPairOption[] }> = {
  plaster: {
    name: 'Штукатурка',
    defaultColors: ['#EAE3D2', '#606C38'],
    colorPairs: [
      { label: 'Беж & Оливковый', colors: ['#EAE3D2', '#606C38'] },
      { label: 'Слоновая кость & Терракот', colors: ['#F4F1DE', '#E07A5F'] }
    ]
  },
  amk: {
    name: 'Фасад AMK / Кирпич',
    defaultColors: ['#8C4333', '#4A3B32'],
    colorPairs: [
      { label: 'Однотонный клинкер', colors: ['#8C4333', '#4A3B32'] }
    ]
  },
  siding: {
    name: 'Сайдинг',
    defaultColors: ['#9A9EAB', '#2B3A42'],
    colorPairs: [{ label: 'Пепел', colors: ['#9A9EAB', '#2B3A42'] }]
  },
  vagonka: {
    name: 'Вагонка',
    defaultColors: ['#B87D4B', '#4A2E18'],
    colorPairs: [{ label: 'Дуб', colors: ['#B87D4B', '#4A2E18'] }]
  }
};

export function createFacadeTexture(type: string, primaryColor: string, secondaryColor: string) {
  const size = 512;
  const canvas = document.createElement('canvas');
  const normalCanvas = document.createElement('canvas');
  canvas.width = normalCanvas.width = size;
  canvas.height = normalCanvas.height = size;

  const ctx = canvas.getContext('2d')!;
  const normCtx = normalCanvas.getContext('2d')!;

  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, size, size);

  normCtx.fillStyle = 'rgb(128, 128, 255)';
  normCtx.fillRect(0, 0, size, size);

  const drawBump = (x: number, y: number, w: number, h: number) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  };

  if (type === 'amk' || type === 'brick') {
    const rowH = 32;
    const blockW = 64;
    ctx.fillStyle = primaryColor; // ОДНОРОДНЫЙ ЦВЕТ (без рандома)
    for (let y = 0; y < size; y += rowH) {
      const offset = (y / rowH) % 2 === 0 ? 0 : blockW / 2;
      for (let x = offset - blockW; x < size + blockW; x += blockW) {
        ctx.fillRect(x + 1, y + 1, blockW - 2, rowH - 2);
        drawBump(x, y, blockW, rowH);
      }
    }
  } else if (type === 'siding' || type === 'horizontal') {
    const rowH = 32;
    for (let y = 0; y < size; y += rowH) {
      ctx.fillRect(0, y, size, rowH);
      drawBump(0, y, size, rowH);
    }
  } else if (type === 'vagonka' || type === 'wood') {
    const rowH = 16;
    for (let y = 0; y < size; y += rowH) {
      ctx.fillRect(0, y, size, rowH);
      drawBump(0, y, size, rowH);
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.needsUpdate = true;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(2, 2);
  normalMap.needsUpdate = true;

  return { map, normalMap };
}