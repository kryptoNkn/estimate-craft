import * as THREE from 'three';

export type RoofCovering = 'tile' | 'seam' | 'shingle' | 'membrane' | 'slate';

function noise(x: number, y: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function shade(hex: string, amount: number) {
  const int = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((int >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((int >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (int & 0xff) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Процедурное кровельное покрытие. Возвращает albedo и normal, рассчитанные
 * так, чтобы одна плитка текстуры соответствовала ~1.4 м кровли.
 */
export function createRoofTexture(covering: RoofCovering, color: string) {
  if (typeof document === 'undefined') {
    return { map: null, normalMap: null };
  }

  const size = 512;
  const canvas = document.createElement('canvas');
  const normalCanvas = document.createElement('canvas');
  canvas.width = normalCanvas.width = size;
  canvas.height = normalCanvas.height = size;

  const ctx = canvas.getContext('2d');
  const nctx = normalCanvas.getContext('2d');
  if (!ctx || !nctx) return { map: null, normalMap: null };

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  nctx.fillStyle = 'rgb(128, 128, 255)';
  nctx.fillRect(0, 0, size, size);

  const groove = (x: number, y: number, w: number, h: number) => {
    nctx.fillStyle = 'rgb(96, 128, 255)';
    nctx.fillRect(x, y, w, 2);
    nctx.fillStyle = 'rgb(160, 128, 255)';
    nctx.fillRect(x, y + h - 2, w, 2);
  };

  if (covering === 'tile') {
    const rowH = 42;
    const tileW = 56;
    for (let y = 0; y < size; y += rowH) {
      const stagger = (y / rowH) % 2 === 0 ? 0 : tileW / 2;
      for (let x = -tileW; x < size + tileW; x += tileW) {
        const px = x + stagger;
        const tint = Math.round((noise(px, y) - 0.5) * 26);
        ctx.fillStyle = shade(color, tint);
        ctx.fillRect(px + 1, y + 1, tileW - 3, rowH - 3);

        // Продольная волна керамической черепицы
        ctx.fillStyle = shade(color, tint + 18);
        ctx.fillRect(px + 4, y + 1, tileW - 26, rowH - 3);
        ctx.fillStyle = shade(color, -34);
        ctx.fillRect(px + 1, y + rowH - 5, tileW - 3, 3);
        groove(px + 1, y + 1, tileW - 3, rowH - 3);
      }
    }
  } else if (covering === 'seam') {
    const seamW = 64;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    for (let x = 0; x < size; x += seamW) {
      ctx.fillStyle = shade(color, 14);
      ctx.fillRect(x + 4, 0, seamW - 8, size);
      ctx.fillStyle = shade(color, -30);
      ctx.fillRect(x, 0, 4, size);

      nctx.fillStyle = 'rgb(210, 128, 255)';
      nctx.fillRect(x, 0, 3, size);
      nctx.fillStyle = 'rgb(46, 128, 255)';
      nctx.fillRect(x + seamW - 4, 0, 3, size);
    }
  } else if (covering === 'shingle') {
    const rowH = 34;
    const tabW = 48;
    for (let y = 0; y < size; y += rowH) {
      const stagger = (y / rowH) % 2 === 0 ? 0 : tabW / 2;
      for (let x = -tabW; x < size + tabW; x += tabW) {
        const px = x + stagger;
        const tint = Math.round((noise(px * 3, y * 7) - 0.5) * 40);
        ctx.fillStyle = shade(color, tint);
        ctx.fillRect(px, y, tabW - 2, rowH - 2);
        ctx.fillStyle = shade(color, -46);
        ctx.fillRect(px, y + rowH - 4, tabW - 2, 3);
        groove(px, y, tabW - 2, rowH - 2);
      }
    }
  } else if (covering === 'slate') {
    const rowH = 38;
    const slateW = 44;
    for (let y = 0; y < size; y += rowH) {
      const stagger = (y / rowH) % 2 === 0 ? 0 : slateW / 2;
      for (let x = -slateW; x < size + slateW; x += slateW) {
        const px = x + stagger;
        const tint = Math.round((noise(px * 5, y * 2) - 0.5) * 34);
        ctx.fillStyle = shade(color, tint);
        ctx.fillRect(px + 1, y + 1, slateW - 3, rowH - 3);
        groove(px + 1, y + 1, slateW - 3, rowH - 3);
      }
    }
  } else {
    for (let y = 0; y < size; y += 16) {
      for (let x = 0; x < size; x += 16) {
        ctx.fillStyle = shade(color, Math.round((noise(x, y) - 0.5) * 10));
        ctx.fillRect(x, y, 16, 16);
      }
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.needsUpdate = true;

  return { map, normalMap };
}

export function roofSurfaceProps(covering: RoofCovering) {
  switch (covering) {
    case 'seam':
      return { roughness: 0.32, metalness: 0.72 };
    case 'membrane':
      return { roughness: 0.55, metalness: 0.05 };
    case 'slate':
      return { roughness: 0.62, metalness: 0.06 };
    case 'shingle':
      return { roughness: 0.85, metalness: 0.02 };
    default:
      return { roughness: 0.74, metalness: 0.04 };
  }
}
