'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { 
  Download, Sparkles, Building2, BoxSelect, Banknote, 
  ChevronDown, LayoutGrid, Car, Paintbrush, Layers, Hammer, Sun 
} from 'lucide-react';

import styles from './constructor.module.scss';
import { 
  PALETTE, TEXTURE_TYPES, PARTITION_MATERIALS, 
  FENCE_STYLES 
} from './constants';
import { OpeningsUIOverlay, OpeningItem } from './OpeningsManager';

const HouseCanvas = dynamic(() => import('./HouseCanvasWrapper'), { 
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: '#0f172a' }} />
});

function AnimatedPrice({ value }: { value: number }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    delay: 50,
    config: { mass: 1, tension: 120, friction: 18 }
  });

  return (
    <animated.div className={styles.priceValue}>
      {number.to((n) => `${Math.floor(n).toLocaleString('ru-RU')} ₽`)}
    </animated.div>
  );
}

export default function ConstructorPage() {
  const [activeTab, setActiveTab] = useState<'exterior' | 'interior' | 'veranda'>('exterior');

  // Окна и двери
  const [openings, setOpenings] = useState<OpeningItem[]>([
    { id: '1', type: 'window', floor: 1, perimeterOffset: 2.0 },
    { id: '2', type: 'door', floor: 1, perimeterOffset: 5.0 }
  ]);

  // Параметры Экстерьера и Гаража
  const [floors, setFloors] = useState<number>(2);
  const [hasGarage, setHasGarage] = useState<boolean>(true);
  const [garageCars, setGarageCars] = useState<number>(1);
  const [textureType, setTextureType] = useState<string>('amk');
  const [foundationType, setFoundationType] = useState<string>('monolith');
  const [floorColors, setFloorColors] = useState<string[]>(['#D2C4B3', '#8C4333', '#B3B7B8', '#4A3B32', '#555B4C']);

  // Параметры Веранды
  const [veranda, setVeranda] = useState({
    hasVeranda: true,
    material: 'wood_light',
    fenceStyle: 'cross',
    isBaseClosed: false,
    width: 6.0,
    length: 2.5
  });

  // Параметры Интерьера
  const [rooms, setRooms] = useState<number>(2);
  const [partitionMaterial, setPartitionMaterial] = useState<string>('drywall');

  const handleFloorColorChange = (index: number, color: string) => {
    const updated = [...floorColors];
    updated[index] = color;
    setFloorColors(updated);
  };

  const totalPrice = useMemo(() => {
    let base = floors * 4200000;
    if (foundationType === 'monolith') base += 1500000;
    if (foundationType === 'pile') base += 800000;
    if (foundationType === 'tape') base += 1100000;

    base += rooms * 180000;
    if (partitionMaterial === 'brick') base += 120000;
    if (partitionMaterial === 'gasblock') base += 80000;

    if (hasGarage) {
      base += 900000 + garageCars * 350000;
    }

    if (veranda.hasVeranda) {
      base += 450000 + Math.floor(veranda.width * veranda.length * 80000);
    }

    base += openings.length * 45000;

    return base;
  }, [floors, foundationType, rooms, partitionMaterial, hasGarage, garageCars, veranda, openings]);

  return (
    <div className={styles.pageWrapper}>
      {/* 3D Вьюпорт */}
      <div className={styles.viewportSection}>
        <OpeningsUIOverlay
          openings={openings}
          setOpenings={setOpenings}
          floorsCount={floors}
          houseWidth={8}
          houseDepth={8}
        />

        <div className={styles.badge3D}>
          <BoxSelect size={16} />
          <span>
            {activeTab === 'exterior' && '3D ЭКСТЕРЬЕР И ГАРАЖ'}
            {activeTab === 'interior' && '3D ВНУТРЕННИЕ СТЕНЫ'}
            {activeTab === 'veranda' && '3D ВЕРАНДА'}
          </span>
        </div>
        <HouseCanvas 
          activeTab={activeTab}
          floors={floors}
          floorColors={floorColors}
          foundationType={foundationType}
          rooms={rooms}
          partitionMaterial={partitionMaterial}
          hasGarage={hasGarage}
          garageCars={garageCars}
          textureType={textureType}
          veranda={veranda}
          setVeranda={setVeranda}
          openings={openings}
          setOpenings={setOpenings}
        />
      </div>

      {/* Панель управления */}
      <div className={styles.panelSection}>
        <div>
          <div className={styles.panelHeader}>
            <div className={styles.headerIcon}><Sparkles size={22} /></div>
            <h1 className={styles.title}>Конфигуратор</h1>
          </div>

          <div className={styles.accordionContainer}>
            <div className={`${styles.accordionSection} ${activeTab === 'exterior' ? styles.openedSection : ''}`}>
              <button className={styles.accordionHeader} onClick={() => setActiveTab('exterior')}>
                <div className={styles.accTitle}><Building2 size={18} /><span>1. Дом и гараж</span></div>
                <ChevronDown size={18} style={{ transform: activeTab === 'exterior' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
              </button>

              <AnimatePresence initial={false}>
                {activeTab === 'exterior' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={styles.accordionBody}>
                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label>Этажи</label><span className={styles.selectedSubtext}>{floors} эт.</span></div>
                      <div className={styles.selectorGrid}>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button key={num} className={`${styles.gridBtn} ${floors === num ? styles.active : ''}`} onClick={() => setFloors(num)}>{num} эт.</button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label>Гараж</label></div>
                      <div className={styles.selectorGrid}>
                        <button className={`${styles.gridBtn} ${!hasGarage ? styles.active : ''}`} onClick={() => setHasGarage(false)}>Без гаража</button>
                        <button className={`${styles.gridBtn} ${hasGarage ? styles.active : ''}`} onClick={() => setHasGarage(true)}><Car size={14} style={{ display: 'inline', marginRight: 4 }} />С гаражом</button>
                      </div>
                    </div>

                    {hasGarage && (
                      <div className={styles.fieldBlock}>
                        <div className={styles.blockHeader}><label>Вместимость гаража</label></div>
                        <div className={styles.selectorGrid}>
                          {[1, 2, 3].map((num) => (
                            <button key={num} className={`${styles.gridBtn} ${garageCars === num ? styles.active : ''}`} onClick={() => setGarageCars(num)}>
                              {num} авто
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label><Layers size={14} /> Фактура фасада</label></div>
                      <div className={styles.selectorGrid}>
                        {TEXTURE_TYPES.map((tex) => (
                          <button key={tex.id} className={`${styles.gridBtn} ${textureType === tex.id ? styles.active : ''}`} onClick={() => setTextureType(tex.id)}>{tex.label}</button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label><Paintbrush size={14} /> Цвета этажей</label></div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Array.from({ length: floors }).map((_, idx) => (
                          <div key={idx} className={styles.singleColorRow}>
                            {PALETTE.map((item) => (
                              <div key={item.color} title={item.name} className={`${styles.colorCircle} ${floorColors[idx] === item.color ? styles.activeCircle : ''}`} style={{ backgroundColor: item.color }} onClick={() => handleFloorColorChange(idx, item.color)} />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={`${styles.accordionSection} ${activeTab === 'veranda' ? styles.openedSection : ''}`}>
              <button className={styles.accordionHeader} onClick={() => setActiveTab('veranda')}>
                <div className={styles.accTitle}><Sun size={18} /><span>2. Веранда</span></div>
                <ChevronDown size={18} style={{ transform: activeTab === 'veranda' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
              </button>

              <AnimatePresence initial={false}>
                {activeTab === 'veranda' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={styles.accordionBody}>
                    <div className={styles.fieldBlock}>
                      <div className={styles.selectorGrid}>
                        <button className={`${styles.gridBtn} ${!veranda.hasVeranda ? styles.active : ''}`} onClick={() => setVeranda({ ...veranda, hasVeranda: false })}>Без веранды</button>
                        <button className={`${styles.gridBtn} ${veranda.hasVeranda ? styles.active : ''}`} onClick={() => setVeranda({ ...veranda, hasVeranda: true })}>С верандой</button>
                      </div>
                    </div>

                    {veranda.hasVeranda && (
                      <>
                        <div className={styles.fieldBlock}>
                          <div className={styles.blockHeader}><label>Ограждение</label></div>
                          <div className={styles.selectorGrid}>
                            {FENCE_STYLES.map((f) => (
                              <button key={f.id} className={`${styles.gridBtn} ${veranda.fenceStyle === f.id ? styles.active : ''}`} onClick={() => setVeranda({ ...veranda, fenceStyle: f.id })}>{f.label}</button>
                            ))}
                          </div>
                        </div>

                        {/* Ползунок 1: Длина / Вылет */}
                        <div className={styles.fieldBlock}>
                          <div className={styles.blockHeader}>
                            <label>Длина (вылет от дома)</label>
                            <span className={styles.selectedSubtext}>{veranda.length.toFixed(1)} м</span>
                          </div>
                          <input 
                            type="range" 
                            min="1.0" 
                            max="5.0" 
                            step="0.1" 
                            value={veranda.length} 
                            onChange={(e) => setVeranda({ ...veranda, length: parseFloat(e.target.value) })} 
                            style={{ width: '100%', accentColor: '#d4af37', cursor: 'pointer' }} 
                          />
                        </div>

                        {/* Ползунок 2: Ширина вдоль стены */}
                        <div className={styles.fieldBlock}>
                          <div className={styles.blockHeader}>
                            <label>Ширина (вдоль стены)</label>
                            <span className={styles.selectedSubtext}>{veranda.width.toFixed(1)} м</span>
                          </div>
                          <input 
                            type="range" 
                            min="2.0" 
                            max="8.0" 
                            step="0.1" 
                            value={veranda.width} 
                            onChange={(e) => setVeranda({ ...veranda, width: parseFloat(e.target.value) })} 
                            style={{ width: '100%', accentColor: '#d4af37', cursor: 'pointer' }} 
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={`${styles.accordionSection} ${activeTab === 'interior' ? styles.openedSection : ''}`}>
              <button className={styles.accordionHeader} onClick={() => setActiveTab('interior')}>
                <div className={styles.accTitle}><LayoutGrid size={18} /><span>3. Внутренние стены</span></div>
                <ChevronDown size={18} style={{ transform: activeTab === 'interior' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
              </button>

              <AnimatePresence initial={false}>
                {activeTab === 'interior' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className={styles.accordionBody}>
                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label>Комнаты</label><span className={styles.selectedSubtext}>{rooms} комн.</span></div>
                      <div className={styles.selectorGrid}>
                        {[1, 2, 3, 4].map((num) => (
                          <button key={num} className={`${styles.gridBtn} ${rooms === num ? styles.active : ''}`} onClick={() => setRooms(num)}>{num} комн.</button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label><Hammer size={14} /> Материал перегородок</label></div>
                      <div className={styles.selectorGrid}>
                        {PARTITION_MATERIALS.map((mat) => (
                          <button key={mat.id} className={`${styles.gridBtn} ${partitionMaterial === mat.id ? styles.active : ''}`} onClick={() => setPartitionMaterial(mat.id)}>{mat.label}</button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className={styles.bottomPanel}>
          <div className={styles.priceCard}>
            <div className={styles.priceHeader}><Banknote size={16} style={{ color: '#d4af37' }} /><span>Итоговая цена</span></div>
            <AnimatedPrice value={totalPrice} />
          </div>
          <button className={styles.btnPrimary} onClick={() => alert('Смета успешно сформирована')}>
            <Download size={18} /><span>Скачать смету</span>
          </button>
        </div>
      </div>
    </div>
  );
}