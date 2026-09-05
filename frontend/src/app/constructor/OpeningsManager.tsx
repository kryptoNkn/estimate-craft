'use client';

import React from 'react';
import { Plus, Trash2, DoorOpen, AppWindow } from 'lucide-react';
import styles from './OpeningsManager.module.scss';

export interface OpeningItem {
  id: string;
  type: 'window' | 'door';
  floor: number;
  perimeterOffset: number; // Длина смещения по периметру фасада
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

  const addOpening = (type: 'window' | 'door') => {
    const newItem: OpeningItem = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      floor: selectedFloor,
      perimeterOffset: totalPerimeter / 8 // Спавн на лицевой стене
    };
    setOpenings([...openings, newItem]);
  };

  const removeOpening = (id: string) => {
    setOpenings(openings.filter((o) => o.id !== id));
  };

  return (
    <div className={styles.openingsPanel}>
      <div className={styles.header}>
        <Plus size={16} /> Фасадные проемы
      </div>

      <div className={styles.buttonGroup}>
        <button className={`${styles.addBtn} ${styles.windowBtn}`} onClick={() => addOpening('window')}>
          <AppWindow size={15} /> Окно
        </button>
        <button className={`${styles.addBtn} ${styles.doorBtn}`} onClick={() => addOpening('door')}>
          <DoorOpen size={15} /> Дверь
        </button>
      </div>

      <div className={styles.controlRow}>
        <label>Этаж размещения:</label>
        <select value={selectedFloor} onChange={(e) => setSelectedFloor(Number(e.target.value))}>
          {Array.from({ length: floorsCount }).map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1} этаж</option>
          ))}
        </select>
      </div>

      <div className={styles.itemList}>
        {openings.map((item) => (
          <div key={item.id} className={styles.itemCard}>
            <div className={styles.itemInfo}>
              {item.type === 'window' ? <AppWindow size={14} color="#60a5fa" /> : <DoorOpen size={14} color="#34d399" />}
              <span>{item.type === 'window' ? 'Окно' : 'Дверь'} ({item.floor} эт.)</span>
            </div>
            <Trash2 size={14} className={styles.deleteBtn} onClick={() => removeOpening(item.id)} />
          </div>
        ))}
      </div>

      <div className={styles.dragHint}>
        🖱️ Перетаскивайте окна и двери мышкой прямо по стенам дома
      </div>
    </div>
  );
}