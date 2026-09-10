export type VerandaRoof = 'slab' | 'pergola' | 'gable' | 'glass' | 'none';
export type VerandaPosts = 'square' | 'round' | 'metal' | 'timber' | 'none';
export type VerandaDeck = 'plank' | 'stone' | 'wpc';
export type VerandaFurniture = 'lounge' | 'dining' | 'none';

export interface VerandaStyleProfile {
  roof: VerandaRoof;
  posts: VerandaPosts;
  deck: VerandaDeck;
  /** Кашпо с зеленью по внешнему краю */
  planters: boolean;
  /** Скрытая подсветка ступеней и подшивки */
  lighting: boolean;
  furniture: VerandaFurniture;
  roofColor: string;
  postColor: string;
  /** Высота низа перекрытия над настилом */
  roofHeight: number;
  /** Вынос перекрытия за габарит настила */
  overhang: number;
}

const DEFAULT_PROFILE: VerandaStyleProfile = {
  roof: 'slab',
  posts: 'square',
  deck: 'plank',
  planters: true,
  lighting: false,
  furniture: 'dining',
  roofColor: '#e9e6df',
  postColor: '#7c5a34',
  roofHeight: 2.55,
  overhang: 0.3,
};

const PROFILES: Record<string, Partial<VerandaStyleProfile>> = {
  'hi-tech': {
    roof: 'slab',
    posts: 'metal',
    deck: 'plank',
    lighting: true,
    furniture: 'lounge',
    roofColor: '#f2f1ec',
    postColor: '#3f444b',
    roofHeight: 2.75,
    overhang: 0.55,
  },
  modern: {
    roof: 'slab',
    posts: 'metal',
    deck: 'wpc',
    lighting: true,
    furniture: 'lounge',
    roofColor: '#dcd9d2',
    postColor: '#33383e',
    roofHeight: 2.7,
    overhang: 0.5,
  },
  constructivism: {
    roof: 'glass',
    posts: 'metal',
    deck: 'wpc',
    planters: false,
    lighting: true,
    furniture: 'lounge',
    roofColor: '#cfd6dc',
    postColor: '#2f353b',
    roofHeight: 2.8,
    overhang: 0.35,
  },
  loft: {
    roof: 'glass',
    posts: 'metal',
    deck: 'plank',
    planters: false,
    lighting: true,
    furniture: 'dining',
    roofColor: '#b9c0c6',
    postColor: '#22262b',
    roofHeight: 2.85,
    overhang: 0.3,
  },
  barnhouse: {
    roof: 'slab',
    posts: 'metal',
    deck: 'plank',
    planters: false,
    lighting: true,
    furniture: 'dining',
    roofColor: '#2f3336',
    postColor: '#26292c',
    roofHeight: 2.65,
    overhang: 0.45,
  },
  chalet: {
    roof: 'gable',
    posts: 'timber',
    deck: 'plank',
    lighting: true,
    furniture: 'dining',
    roofColor: '#4a2f1c',
    postColor: '#5c3a1f',
    roofHeight: 2.5,
    overhang: 0.6,
  },
  wright: {
    roof: 'slab',
    posts: 'square',
    deck: 'stone',
    lighting: true,
    furniture: 'lounge',
    roofColor: '#c8b89a',
    postColor: '#8a7355',
    roofHeight: 2.45,
    overhang: 0.8,
  },
  japanese: {
    roof: 'none',
    posts: 'none',
    deck: 'plank',
    planters: true,
    lighting: false,
    furniture: 'none',
    postColor: '#7a5c33',
    roofHeight: 2.4,
    overhang: 0,
  },
  classic: {
    roof: 'gable',
    posts: 'round',
    deck: 'stone',
    furniture: 'dining',
    roofColor: '#6b7280',
    postColor: '#f6f4ee',
    roofHeight: 2.9,
    overhang: 0.4,
  },
  neoclassic: {
    roof: 'gable',
    posts: 'round',
    deck: 'stone',
    lighting: true,
    furniture: 'dining',
    roofColor: '#5c6470',
    postColor: '#faf8f3',
    roofHeight: 3.0,
    overhang: 0.45,
  },
  american: {
    roof: 'gable',
    posts: 'round',
    deck: 'plank',
    lighting: true,
    furniture: 'lounge',
    roofColor: '#4b5563',
    postColor: '#f4f2ec',
    roofHeight: 2.75,
    overhang: 0.5,
  },
  european: {
    roof: 'gable',
    posts: 'square',
    deck: 'stone',
    furniture: 'dining',
    roofColor: '#8a4a3c',
    postColor: '#efece5',
    roofHeight: 2.6,
    overhang: 0.4,
  },
  scandinavian: {
    roof: 'pergola',
    posts: 'timber',
    deck: 'plank',
    lighting: true,
    furniture: 'lounge',
    roofColor: '#c7ad86',
    postColor: '#b99a6d',
    roofHeight: 2.6,
    overhang: 0.35,
  },
  provence: {
    roof: 'pergola',
    posts: 'round',
    deck: 'stone',
    furniture: 'dining',
    roofColor: '#c2b393',
    postColor: '#f2ece0',
    roofHeight: 2.7,
    overhang: 0.4,
  },
  country: {
    roof: 'gable',
    posts: 'timber',
    deck: 'plank',
    furniture: 'dining',
    roofColor: '#6b5236',
    postColor: '#8a6a41',
    roofHeight: 2.5,
    overhang: 0.55,
  },
};

export function getVerandaStyleProfile(architecturalStyle?: string): VerandaStyleProfile {
  const override = architecturalStyle ? PROFILES[architecturalStyle] : undefined;
  return { ...DEFAULT_PROFILE, ...override };
}
