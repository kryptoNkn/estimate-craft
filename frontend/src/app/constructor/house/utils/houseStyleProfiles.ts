import type { RoofCovering } from '@/utils/roofMaterials';
import type { RoofType } from '../parts/RoofPart';

export interface HouseStyleProfile {
  roofType: RoofType;
  covering: RoofCovering;
  /** Уклон как отношение подъёма к половине пролёта */
  pitch: number;
  overhang: number;
  roofColor: string;
  roofAccent: string;
  chimney: boolean;
  plinth: boolean;
  plinthColor: string;
  cornice: boolean;
  corniceColor: string;
  windowFrame: string;
  windowTrim: 'none' | 'classic';
  trimColor: string;
}

const DEFAULT_PROFILE: HouseStyleProfile = {
  roofType: 'hip',
  covering: 'tile',
  pitch: 0.85,
  overhang: 0.5,
  roofColor: '#4b5563',
  roofAccent: '#1f2937',
  chimney: true,
  plinth: true,
  plinthColor: '#8a8f98',
  cornice: false,
  corniceColor: '#e7e5e4',
  windowFrame: '#2f3640',
  windowTrim: 'none',
  trimColor: '#f8fafc',
};

const PROFILES: Record<string, Partial<HouseStyleProfile>> = {
  'hi-tech': {
    roofType: 'flat',
    covering: 'membrane',
    overhang: 0.75,
    roofColor: '#F5F5F0',
    roofAccent: '#D6D3D1',
    chimney: false,
    plinth: false,
    windowFrame: '#111827',
  },
  loft: {
    roofType: 'flat',
    covering: 'membrane',
    overhang: 0.4,
    roofColor: '#3f3f46',
    roofAccent: '#27272a',
    chimney: true,
    plinthColor: '#57534e',
    windowFrame: '#18181b',
  },
  constructivism: {
    roofType: 'flat',
    covering: 'membrane',
    overhang: 0.55,
    roofColor: '#e5e7eb',
    roofAccent: '#9ca3af',
    chimney: false,
    plinth: false,
    windowFrame: '#1f2937',
  },
  modern: {
    roofType: 'flat',
    covering: 'membrane',
    overhang: 0.85,
    roofColor: '#57534e',
    roofAccent: '#3f3f46',
    chimney: false,
    plinthColor: '#78716c',
    windowFrame: '#292524',
  },
  japanese: {
    roofType: 'hip',
    covering: 'slate',
    pitch: 0.5,
    overhang: 1.25,
    roofColor: '#3f3f46',
    roofAccent: '#18181b',
    chimney: false,
    plinth: false,
    windowFrame: '#292524',
  },
  wright: {
    roofType: 'hip',
    covering: 'seam',
    pitch: 0.34,
    overhang: 1.35,
    roofColor: '#6b5b4a',
    roofAccent: '#44403c',
    chimney: true,
    plinthColor: '#8b7355',
    windowFrame: '#4a3728',
  },
  chalet: {
    roofType: 'chalet',
    covering: 'shingle',
    pitch: 0.72,
    overhang: 1.25,
    roofColor: '#57534e',
    roofAccent: '#3f3f2e',
    chimney: true,
    plinthColor: '#6b7280',
    windowFrame: '#4a2c14',
  },
  american: {
    roofType: 'mansard',
    covering: 'shingle',
    overhang: 0.45,
    roofColor: '#44403c',
    roofAccent: '#292524',
    chimney: true,
    plinthColor: '#9ca3af',
    windowFrame: '#f8fafc',
    windowTrim: 'classic',
    trimColor: '#f8fafc',
  },
  barnhouse: {
    roofType: 'gable',
    covering: 'seam',
    pitch: 1.05,
    overhang: 0.28,
    roofColor: '#3f3f46',
    roofAccent: '#27272a',
    chimney: false,
    plinth: false,
    windowFrame: '#18181b',
  },
  scandinavian: {
    roofType: 'gable',
    covering: 'seam',
    pitch: 0.95,
    overhang: 0.42,
    roofColor: '#334155',
    roofAccent: '#1e293b',
    chimney: true,
    plinthColor: '#94a3b8',
    windowFrame: '#1e293b',
  },
  classic: {
    roofType: 'gable',
    covering: 'tile',
    pitch: 0.9,
    overhang: 0.55,
    roofColor: '#6b7280',
    roofAccent: '#374151',
    chimney: true,
    plinthColor: '#d6d3d1',
    cornice: true,
    corniceColor: '#f5f5f4',
    windowFrame: '#f8fafc',
    windowTrim: 'classic',
    trimColor: '#f5f5f4',
  },
  neoclassic: {
    roofType: 'gable',
    covering: 'tile',
    pitch: 0.82,
    overhang: 0.6,
    roofColor: '#57534e',
    roofAccent: '#292524',
    chimney: true,
    plinthColor: '#e7e5e4',
    cornice: true,
    corniceColor: '#fafaf9',
    windowFrame: '#fafaf9',
    windowTrim: 'classic',
    trimColor: '#fafaf9',
  },
  european: {
    roofType: 'gable',
    covering: 'tile',
    pitch: 1.0,
    overhang: 0.5,
    roofColor: '#7f1d1d',
    roofAccent: '#450a0a',
    chimney: true,
    plinthColor: '#a8a29e',
    windowFrame: '#3f2a1d',
  },
  provence: {
    roofType: 'gable',
    covering: 'tile',
    pitch: 0.58,
    overhang: 0.7,
    roofColor: '#c2703d',
    roofAccent: '#9a3412',
    chimney: true,
    plinthColor: '#e7e5e4',
    windowFrame: '#7f8f7a',
    windowTrim: 'classic',
    trimColor: '#faf7f0',
  },
  country: {
    roofType: 'gable',
    covering: 'shingle',
    pitch: 0.92,
    overhang: 0.62,
    roofColor: '#6b4f3a',
    roofAccent: '#44302a',
    chimney: true,
    plinthColor: '#a8a29e',
    windowFrame: '#f5f5f4',
    windowTrim: 'classic',
    trimColor: '#f5f5f4',
  },
};

export function getHouseStyleProfile(
  architecturalStyle: string | undefined,
  overrides?: Partial<HouseStyleProfile>,
): HouseStyleProfile {
  const styleProfile = architecturalStyle ? PROFILES[architecturalStyle] : undefined;

  return {
    ...DEFAULT_PROFILE,
    ...styleProfile,
    ...Object.fromEntries(
      Object.entries(overrides ?? {}).filter(([, value]) => value !== undefined),
    ),
  };
}
