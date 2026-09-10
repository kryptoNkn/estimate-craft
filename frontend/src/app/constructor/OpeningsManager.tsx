'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, DoorOpen, AppWindow, Sparkles, GripHorizontal } from 'lucide-react';
import styles from './OpeningsManager.module.scss';

export interface OpeningItem {
  id: string;
  type: 'window' | 'door';
  floor: number;
  perimeterOffset: number;
  variant?: 'standard' | 'panoramic' | 'minimal';
}

interface OpeningsManagerProps {
  openings: OpeningItem[];
  setOpenings: React.Dispatch<React.SetStateAction<OpeningItem[]>>;
  floorsCount: number;
  houseWidth: number;
  houseDepth: number;
}

export function OpeningsUIOverlay({
  openings,
  setOpenings,
  floorsCount,
  houseWidth,
  houseDepth
}: OpeningsManagerProps) {
  const [selectedFloor, setSelectedFloor] = React.useState<number>(1);
  const totalPerimeter = (houseWidth + houseDepth) * 2;
  const constraintsRef = useRef(null);

  const addOpening = (type: 'window' | 'door') => {
    const newItem: OpeningItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      floor: selectedFloor,
      perimeterOffset: totalPerimeter / 8
    };
    setOpenings([...openings, newItem]);
  };

  const removeOpening = (id: string) => {
    setOpenings(openings.filter((o) => o.id !== id));
  };

  return (
    <motion.div 
      className={styles.openingsPanel}
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Sparkles size={13} color="#F2F0E8" />
          <span>ПРОЕМЫ</span>
        </div>
        <div className={styles.dragHandle} title="Зажмите для перемещения">
          <GripHorizontal size={14} />
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button 
          className={styles.addBtn} 
          onClick={() => addOpening('window')}
        >
          <AppWindow size={13} color="#F2F0E8" /> + ОКНО
        </button>
        <button 
          className={styles.addBtn} 
          onClick={() => addOpening('door')}
        >
          <DoorOpen size={13} color="#F2F0E8" /> + ДВЕРЬ
        </button>
      </div>

      <div className={styles.fieldBlock}>
        <label>ВЫБОР ЭТАЖА</label>
        <div className={styles.floorSegmentControl}>
          {Array.from({ length: floorsCount }).map((_, i) => {
            const floorNum = i + 1;
            return (
              <button
                key={floorNum}
                className={`${styles.floorSegmentBtn} ${selectedFloor === floorNum ? styles.active : ''}`}
                onClick={() => setSelectedFloor(floorNum)}
              >
                {floorNum} ЭТ
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.itemList}>
        <AnimatePresence>
          {openings.map((item) => (
            <motion.div 
              key={item.id} 
              className={styles.itemCard}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <div className={styles.itemInfo}>
                {item.type === 'window' ? <AppWindow size={13} color="#8A93A0" /> : <DoorOpen size={13} color="#8A93A0" />}
                <span>{item.type === 'window' ? 'Окно' : 'Дверь'} ({item.floor} эт.)</span>
              </div>
              <Trash2 size={13} className={styles.deleteBtn} onClick={() => removeOpening(item.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={styles.dragHint}>
        <span>DRAG TO REPOSITION</span>
      </div>
    </motion.div>
  );
}