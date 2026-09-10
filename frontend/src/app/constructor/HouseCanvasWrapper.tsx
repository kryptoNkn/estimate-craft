'use client';

import React, { useEffect, useState } from 'react';
import HouseCanvas from './HouseCanvas';
import { OpeningItem } from './OpeningsManager';
import { VerandaProps } from './house/VerandaStructure';
import type { RoofType } from './house/parts/RoofPart';

interface HouseCanvasWrapperProps {
  activeTab: string;
  floors: number;
  floorColors: string[];
  foundationType: string;
  rooms: number;
  partitionMaterial: string;
  hasGarage: boolean;
  garageCars: number;
  textureType: string;
  floorTextureTypes?: string[];
  roofType?: RoofType;
  architecturalStyle?: string;
  jointColor?: string;
  veranda: VerandaProps;
  setVeranda?: React.Dispatch<React.SetStateAction<VerandaProps>>;
  openings: OpeningItem[];
  setOpenings: React.Dispatch<React.SetStateAction<OpeningItem[]>>;
}

export default function HouseCanvasWrapper(props: HouseCanvasWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div style={{ width: '100%', height: '100%', background: '#0f172a' }} />;
  }

  return <HouseCanvas {...props} />;
}