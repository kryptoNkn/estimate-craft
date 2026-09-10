export type VolumeTone = 'primary' | 'secondary' | 'accent' | 'dark' | 'stone' | 'timber';

export interface MassingVolume {
  kind: 'block' | 'slab' | 'tower' | 'stack' | 'pergola' | 'planter' | 'screen' | 'glazing';
  /** Основание объёма относительно центра корпуса, y = отметка чистого пола */
  offset: [number, number, number];
  /** Габариты: ширина, высота, глубина */
  size: [number, number, number];
  tone?: VolumeTone;
  roof?: 'flat' | 'gable' | 'shed' | 'none';
  glazing?: 'none' | 'strip' | 'panoramic';
  rotationY?: number;
  /** Стойки под плитой навеса */
  columns?: 'none' | 'metal' | 'round' | 'timber';
}

const H = 2.9;

/**
 * Дополнительные объёмы, формирующие силуэт дома. Основной корпус 8×8
 * остаётся неизменным (на нём живут перетаскиваемые проёмы), а характер
 * стиля задают пристройки, консоли, террасные плиты и вертикали.
 */
const PLANS: Record<string, MassingVolume[]> = {
  'hi-tech': [
    {
      kind: 'block',
      offset: [-6.3, 0, -0.6],
      size: [4.6, H, 6.2],
      tone: 'primary',
      roof: 'flat',
      glazing: 'strip',
    },
    { kind: 'slab', offset: [-6.2, -0.14, 6.0], size: [6.8, 0.26, 4.2], tone: 'stone' },
    { kind: 'planter', offset: [-6.2, 0.02, 7.6], size: [3.4, 0.6, 1.2], tone: 'stone' },
    { kind: 'screen', offset: [6.0, 0, 1.2], size: [0.18, H * 1.7, 6.4], tone: 'primary' },
  ],

  modern: [
    {
      kind: 'block',
      offset: [5.7, 0, 1.5],
      size: [3.8, H * 2, 6.6],
      tone: 'secondary',
      roof: 'flat',
      glazing: 'panoramic',
    },
    { kind: 'slab', offset: [0, H * 2, 5.6], size: [9.6, 0.3, 2.8], tone: 'accent', columns: 'metal' },
    { kind: 'slab', offset: [0, -0.14, 5.9], size: [10.4, 0.26, 3.6], tone: 'stone' },
    { kind: 'planter', offset: [4.0, 0.02, 6.2], size: [2.8, 0.55, 1.1], tone: 'stone' },
  ],

  constructivism: [
    {
      kind: 'tower',
      offset: [-5.6, 0, 2.4],
      size: [3.2, H * 2 + 0.9, 3.2],
      tone: 'secondary',
      glazing: 'strip',
    },
    {
      kind: 'block',
      offset: [5.5, 0, -1.4],
      size: [3.2, H, 5.2],
      tone: 'primary',
      roof: 'flat',
      glazing: 'strip',
    },
    // Консольный козырёк без стоек — характерный приём конструктивизма
    { kind: 'slab', offset: [0, H * 2 - 0.4, 5.2], size: [9.2, 0.26, 2.4], tone: 'accent' },
  ],

  loft: [
    { kind: 'stack', offset: [-4.8, 0, -2.8], size: [1.4, H * 2.9, 1.4], tone: 'dark' },
    {
      kind: 'block',
      offset: [5.6, 0, -0.6],
      size: [3.4, H * 1.2, 5.2],
      tone: 'dark',
      roof: 'flat',
      glazing: 'strip',
    },
    { kind: 'screen', offset: [-4.9, 0, 2.6], size: [0.22, H * 1.4, 4.4], tone: 'dark' },
  ],

  barnhouse: [
    {
      kind: 'block',
      offset: [-6.1, 0, 0],
      size: [4.4, H * 1.1, 6.4],
      tone: 'timber',
      roof: 'shed',
      glazing: 'strip',
    },
    { kind: 'glazing', offset: [4.03, 0.1, 0], size: [0.12, H * 2 - 0.4, 6.2], tone: 'dark' },
    { kind: 'slab', offset: [0, -0.14, 5.6], size: [8.6, 0.24, 3.0], tone: 'timber' },
  ],

  chalet: [
    { kind: 'slab', offset: [0, -0.42, 0], size: [10.6, 0.44, 10.6], tone: 'stone' },
    { kind: 'slab', offset: [0, H, 4.8], size: [8.8, 0.24, 1.8], tone: 'timber' },
    {
      kind: 'block',
      offset: [-5.9, 0, -1.1],
      size: [3.8, H, 5.2],
      tone: 'timber',
      roof: 'shed',
    },
    { kind: 'stack', offset: [3.0, 0, -4.4], size: [1.5, H * 2.6, 1.5], tone: 'stone' },
  ],

  wright: [
    {
      kind: 'block',
      offset: [-6.2, 0, 0],
      size: [4.4, H * 0.92, 7.0],
      tone: 'primary',
      roof: 'none',
      glazing: 'strip',
    },
    {
      kind: 'block',
      offset: [6.2, 0, 0],
      size: [4.4, H * 0.92, 7.0],
      tone: 'primary',
      roof: 'none',
      glazing: 'strip',
    },
    { kind: 'slab', offset: [-6.2, H * 0.92, 0], size: [6.2, 0.26, 9.0], tone: 'accent' },
    { kind: 'slab', offset: [6.2, H * 0.92, 0], size: [6.2, 0.26, 9.0], tone: 'accent' },
    { kind: 'stack', offset: [0, 0, -1.2], size: [1.8, H + 2.4, 1.8], tone: 'stone' },
  ],

  japanese: [
    { kind: 'slab', offset: [0, -0.1, 5.4], size: [10.0, 0.18, 2.6], tone: 'timber' },
    {
      kind: 'block',
      offset: [-7.4, 0, -2.2],
      size: [3.2, H * 0.85, 3.2],
      tone: 'timber',
      roof: 'flat',
    },
    { kind: 'slab', offset: [-7.4, H * 0.85, -2.2], size: [4.6, 0.2, 4.6], tone: 'dark' },
    { kind: 'screen', offset: [6.4, 0, 1.0], size: [0.16, 2.3, 6.2], tone: 'timber' },
    { kind: 'planter', offset: [4.8, 0.02, 6.4], size: [2.2, 0.4, 1.6], tone: 'stone' },
  ],

  classic: [
    {
      kind: 'block',
      offset: [-5.7, 0, 0],
      size: [3.4, H, 6.6],
      tone: 'primary',
      roof: 'gable',
      glazing: 'strip',
    },
    {
      kind: 'block',
      offset: [5.7, 0, 0],
      size: [3.4, H, 6.6],
      tone: 'primary',
      roof: 'gable',
      glazing: 'strip',
    },
  ],

  neoclassic: [
    {
      kind: 'block',
      offset: [-5.7, 0, -0.4],
      size: [3.4, H * 1.6, 6.2],
      tone: 'primary',
      roof: 'flat',
      glazing: 'strip',
    },
    {
      kind: 'block',
      offset: [5.7, 0, -0.4],
      size: [3.4, H * 1.6, 6.2],
      tone: 'primary',
      roof: 'flat',
      glazing: 'strip',
    },
    { kind: 'slab', offset: [0, H * 2, 5.0], size: [6.0, 0.3, 2.2], tone: 'accent', columns: 'round' },
  ],

  // Крытое крыльцо у американского дома делает веранда, поэтому в массинге
  // только боковое крыло и эркер второго света.
  american: [
    {
      kind: 'block',
      offset: [-5.7, 0, -1.0],
      size: [3.4, H, 5.2],
      tone: 'primary',
      roof: 'gable',
    },
    {
      kind: 'block',
      offset: [-2.6, 0, 4.6],
      size: [2.6, H * 2, 1.3],
      tone: 'primary',
      roof: 'gable',
      glazing: 'strip',
    },
  ],

  european: [
    {
      kind: 'block',
      offset: [-2.8, 0, 4.7],
      size: [2.8, H * 2, 1.5],
      tone: 'primary',
      roof: 'flat',
      glazing: 'panoramic',
    },
    {
      kind: 'block',
      offset: [5.5, 0, -1.3],
      size: [3.0, H, 4.8],
      tone: 'primary',
      roof: 'shed',
      glazing: 'strip',
    },
  ],

  scandinavian: [
    {
      kind: 'block',
      offset: [-5.6, 0, 1.3],
      size: [3.2, H, 4.8],
      tone: 'timber',
      roof: 'gable',
      glazing: 'strip',
    },
    { kind: 'slab', offset: [0, -0.12, 5.5], size: [7.8, 0.2, 2.8], tone: 'timber' },
    { kind: 'planter', offset: [-3.6, 0.02, 6.2], size: [2.2, 0.45, 0.9], tone: 'timber' },
  ],

  provence: [
    {
      kind: 'block',
      offset: [-5.5, 0, 0.9],
      size: [3.2, H, 5.4],
      tone: 'primary',
      roof: 'shed',
      glazing: 'strip',
    },
    { kind: 'pergola', offset: [4.6, H - 0.3, 5.3], size: [3.4, 0.22, 2.4], tone: 'timber' },
    { kind: 'planter', offset: [-1.4, 0.02, 4.9], size: [2.6, 0.5, 0.8], tone: 'stone' },
  ],

  country: [
    {
      kind: 'block',
      offset: [-5.5, 0, 0],
      size: [3.4, H * 0.95, 5.2],
      tone: 'timber',
      roof: 'shed',
    },
    { kind: 'stack', offset: [2.4, 0, -4.3], size: [1.3, H * 2.1, 1.3], tone: 'stone' },
    { kind: 'planter', offset: [-2.4, 0.02, 4.9], size: [2.8, 0.45, 0.8], tone: 'timber' },
  ],
};

export function getMassingPlan(architecturalStyle?: string): MassingVolume[] {
  if (!architecturalStyle) return [];
  return PLANS[architecturalStyle] ?? [];
}
