import * as THREE from 'three';

function pseudoRandom(x: number, y: number): number {
  const dot = x * 12.9898 + y * 78.233;
  const sn = Math.sin(dot) * 43758.5453;
  return sn - Math.floor(sn);
}

function getLuminance(hex: string): number {
  const c = parseInt(hex.replace('#', ''), 16);
  const r = (c >> 16) & 0xff;
  const g = (c >> 8) & 0xff;
  const b = c & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function blendColors(col1: string, col2: string, factor: number): string {
  const c1 = parseInt(col1.replace('#', ''), 16);
  const c2 = parseInt(col2.replace('#', ''), 16);

  const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function createFacadeTexture(
  type: string, 
  primaryColor: string, 
  secondaryColor?: string, 
  jointColor?: string
) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  const normalCanvas = document.createElement('canvas');
  const roughCanvas = document.createElement('canvas');
  canvas.width = normalCanvas.width = roughCanvas.width = size;
  canvas.height = normalCanvas.height = roughCanvas.height = size;

  const ctx = canvas.getContext('2d')!;
  const normCtx = normalCanvas.getContext('2d')!;
  const roughCtx = roughCanvas.getContext('2d')!;

  const mainLum = getLuminance(primaryColor);
  const isVeryDark = mainLum < 45;

  // Если цвет темный — рисуем светлый контрастный шов (затирку)
  const defaultJoint = isVeryDark ? '#6E727A' : '#3A3A3C';
  const activeJoint = jointColor || defaultJoint;

  ctx.fillStyle = activeJoint;
  ctx.fillRect(0, 0, size, size);

  normCtx.fillStyle = 'rgb(128, 128, 255)';
  normCtx.fillRect(0, 0, size, size);
  roughCtx.fillStyle = '#b8b8b8';
  roughCtx.fillRect(0, 0, size, size);

  const drawBump = (x: number, y: number, w: number, h: number, roughness = 0.55) => {
    normCtx.fillStyle = 'rgb(255, 128, 128)';
    normCtx.fillRect(x, y, 3, h);
    normCtx.fillStyle = 'rgb(0, 128, 128)';
    normCtx.fillRect(x + w - 3, y, 3, h);
    normCtx.fillStyle = 'rgb(128, 255, 128)';
    normCtx.fillRect(x, y, w, 3);
    normCtx.fillStyle = 'rgb(128, 0, 128)';
    normCtx.fillRect(x, y + h - 3, w, 3);

    const roughVal = Math.round((1 - roughness) * 255);
    roughCtx.fillStyle = `rgb(${roughVal}, ${roughVal}, ${roughVal})`;
    roughCtx.fillRect(x, y, w, h);
  };

  // Гарантированный видимый контраст акцентных кирпичей
  let activeSecondary = secondaryColor;
  if (!activeSecondary || activeSecondary.toLowerCase() === primaryColor.toLowerCase()) {
    const targetTone = isVeryDark ? '#8A8A8A' : '#1A1A1A';
    activeSecondary = blendColors(primaryColor, targetTone, 0.4);
  } else if (isVeryDark && getLuminance(activeSecondary) < 45) {
    // Если акцент тоже темный — подтягиваем его яркость вверх
    activeSecondary = blendColors(activeSecondary, '#B5B5B5', 0.35);
  }

  if (type === 'amk' || type === 'brick') {
    const rowH = 64;       
    const blockW = 128;    
    const jointGap = 6;    

    for (let y = 0; y < size; y += rowH) {
      const rowIndex = Math.floor(y / rowH);
      const offset = rowIndex % 2 === 0 ? 0 : blockW / 2;

      for (let x = offset - blockW; x < size + blockW; x += blockW) {
        const wrappedX = ((x % size) + size) % size;
        const wrappedY = ((y % size) + size) % size;
        const randVal = pseudoRandom(wrappedX + 101, wrappedY + 503);

        // Градация оттенка кирпича для меланж-эффекта
        const brickColor = blendColors(primaryColor, activeSecondary, randVal);

        const bx = x + jointGap / 2;
        const by = y + jointGap / 2;
        const bw = blockW - jointGap;
        const bh = rowH - jointGap;

        ctx.fillStyle = brickColor;
        ctx.fillRect(bx, by, bw, bh);

        drawBump(bx, by, bw, bh);
      }
    }
  } else if (type === 'siding' || type === 'horizontal') {
    const rowH = 64;
    for (let y = 0; y < size; y += rowH) {
      const randVal = pseudoRandom(0, y);
      ctx.fillStyle = blendColors(primaryColor, activeSecondary, randVal * 0.3);
      ctx.fillRect(0, y, size, rowH - 4);
      drawBump(0, y, size, rowH - 4);
    }
  } else if (type === 'wood' || type === 'vertical') {
    const plankW = 52;
    for (let x = 0; x < size; x += plankW) {
      const randVal = pseudoRandom(x, 17);
      ctx.fillStyle = blendColors(primaryColor, activeSecondary, randVal * 0.22);
      ctx.fillRect(x + 2, 0, plankW - 5, size);
      drawBump(x + 2, 0, plankW - 5, size);
    }
  } else if (type === 'stucco') {
    for (let y = 0; y < size; y += 24) {
      for (let x = 0; x < size; x += 24) {
        const randVal = pseudoRandom(x, y);
        ctx.fillStyle = blendColors(primaryColor, activeSecondary, randVal * 0.12);
        ctx.fillRect(x, y, 24, 24);
        const roughVal = Math.round((0.78 + randVal * 0.12) * 255);
        roughCtx.fillStyle = `rgb(${roughVal}, ${roughVal}, ${roughVal})`;
        roughCtx.fillRect(x, y, 24, 24);
      }
    }
  } else {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, size, size);
    roughCtx.fillStyle = '#a8a8a8';
    roughCtx.fillRect(0, 0, size, size);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 1);
  map.anisotropy = 8;
  // Canvas отдаёт данные в sRGB. Без этой пометки three трактует их как
  // линейные и выводит фасад заметно светлее выбранного цвета.
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(1, 1);
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(1, 1);
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.needsUpdate = true;

  return { map, normalMap, roughnessMap };
}