'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { 
  Download, Building2, ChevronDown, LayoutGrid, 
  Sun, Check, Sparkles, Share2, Bookmark, Palette, Layers
} from 'lucide-react';

import styles from './constructor.module.scss';
import { 
  PALETTE, TEXTURE_TYPES, PARTITION_MATERIALS, 
  FENCE_STYLES, AMK_TEXTURE_PRESETS, AMKColorPreset 
} from './constants';
import { OpeningsUIOverlay, OpeningItem } from './OpeningsManager';

const HouseCanvas = dynamic(() => import('./HouseCanvasWrapper'), { 
  ssr: false,
  loading: () => <div className={styles.canvasLoader} />
});

function AnimatedPrice({ value }: { value: number }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    delay: 50,
    config: { mass: 1, tension: 160, friction: 22 }
  });

  return (
    <animated.div className={styles.priceValue}>
      {number.to((n) => `${Math.floor(n).toLocaleString('ru-RU')} ₽`)}
    </animated.div>
  );
}

export default function ConstructorPage() {
  // По умолчанию все секции аккордеона могут быть свернуты (null)
  const [activeTab, setActiveTab] = useState<'exterior' | 'interior' | 'veranda' | null>(null);

  const [openings, setOpenings] = useState<OpeningItem[]>([
    { id: '1', type: 'window', floor: 1, perimeterOffset: 2.0 },
    { id: '2', type: 'door', floor: 1, perimeterOffset: 5.0 }
  ]);

  const [floors, setFloors] = useState<number>(2);
  const [hasGarage, setHasGarage] = useState<boolean>(true);
  const [garageCars, setGarageCars] = useState<number>(1);
  const [textureType, setTextureType] = useState<string>('amk');
  const [foundationType, setFoundationType] = useState<string>('monolith');
  const [floorColors, setFloorColors] = useState<string[]>(['#D2C4B3', '#8C4333', '#B3B7B8', '#4A3B32', '#555B4C']);
  
  const [selectedAmk, setSelectedAmk] = useState<AMKColorPreset>(AMK_TEXTURE_PRESETS[0]);
  
  // Отдельные сворачиваемые окна для вариантов цвета/пресетов (по умолчанию свернуты)
  const [isAmkDrawerOpen, setIsAmkDrawerOpen] = useState<boolean>(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);

  const [veranda, setVeranda] = useState({
    hasVeranda: true,
    material: 'wood_light',
    fenceStyle: 'cross',
    isBaseClosed: false,
    width: 6.0,
    length: 2.5
  });

  const [rooms, setRooms] = useState<number>(2);
  const [partitionMaterial, setPartitionMaterial] = useState<string>('drywall');

  // Функция переключения секции с возможностью сворачивания
  const toggleTab = (tab: 'exterior' | 'interior' | 'veranda') => {
    setActiveTab(prev => prev === tab ? null : tab);
  };

  const handleFloorColorChange = (index: number, color: string) => {
    const updated = [...floorColors];
    updated[index] = color;
    setFloorColors(updated);
  };

  const handleAmkSelect = (preset: AMKColorPreset) => {
    setSelectedAmk(preset);
    setFloorColors(Array(5).fill(preset.colors[0]));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Конфигурация дома',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка на конфигурацию скопирована');
    }
  };

  const handleSave = () => {
    alert('Конфигурация сохранена');
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
          <div className={styles.badgeIndicator} />
          <span>
            {activeTab === 'exterior' && 'EXTERIOR // STUDIO'}
            {activeTab === 'interior' && 'INTERIOR // LAYOUT'}
            {activeTab === 'veranda' && 'VERANDA // OUTDOOR'}
            {!activeTab && 'OVERVIEW // 3D'}
          </span>
        </div>

        <HouseCanvas 
          activeTab={activeTab || 'exterior'}
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
        <div className={styles.panelContent}>
          <div className={styles.panelHeader}>
            <div className={styles.headerIcon}>
              <Sparkles size={16} strokeWidth={2} />
            </div>
            <div>
              <h1 className={styles.title}>CONFIGURATOR</h1>
              <span className={styles.subtitle}>ARCHITECTURAL STUDIO EDITION</span>
            </div>
          </div>

          <div className={styles.accordionContainer}>
            {/* Секция 1: Архитектура & Фасад */}
            <div className={`${styles.accordionSection} ${activeTab === 'exterior' ? styles.openedSection : ''}`}>
              <button className={styles.accordionHeader} onClick={() => toggleTab('exterior')}>
                <div className={styles.accTitle}>
                  <Building2 size={15} color={activeTab === 'exterior' ? '#F2F0E8' : '#717D8D'} />
                  <span>01 / Архитектура & Фасад</span>
                </div>
                <motion.div animate={{ rotate: activeTab === 'exterior' ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={15} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {activeTab === 'exterior' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    transition={{ duration: 0.2 }}
                    className={styles.accordionBody}
                  >
                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}>
                        <label>Этажность</label>
                        <span className={styles.selectedSubtext}>{floors} FL</span>
                      </div>
                      <div className={styles.segmentControl}>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button 
                            key={num} 
                            className={`${styles.segmentBtn} ${floors === num ? styles.active : ''}`} 
                            onClick={() => setFloors(num)}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label>Гаражный модуль</label></div>
                      <div className={styles.segmentControl}>
                        <button className={`${styles.segmentBtn} ${!hasGarage ? styles.active : ''}`} onClick={() => setHasGarage(false)}>
                          БЕЗ ГАРАЖА
                        </button>
                        <button className={`${styles.segmentBtn} ${hasGarage ? styles.active : ''}`} onClick={() => setHasGarage(true)}>
                          С ГАРАЖОМ
                        </button>
                      </div>
                    </div>

                    {hasGarage && (
                      <div className={styles.fieldBlock}>
                        <div className={styles.blockHeader}><label>Вместимость авто</label></div>
                        <div className={styles.segmentControl}>
                          {[1, 2, 3].map((num) => (
                            <button key={num} className={`${styles.segmentBtn} ${garageCars === num ? styles.active : ''}`} onClick={() => setGarageCars(num)}>
                              {num} {num === 1 ? 'АВТО' : 'АВТОМОБИЛЯ'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label>Тип отделки</label></div>
                      <div className={styles.segmentControl}>
                        {TEXTURE_TYPES.map((tex) => (
                          <button key={tex.id} className={`${styles.segmentBtn} ${textureType === tex.id ? styles.active : ''}`} onClick={() => setTextureType(tex.id)}>
                            {tex.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Отдельные сворачиваемые окна для вариантов текстуры/цвета */}
                    {textureType === 'amk' ? (
                      <div className={styles.fieldBlock}>
                        <button 
                          className={styles.drawerToggleBtn}
                          onClick={() => setIsAmkDrawerOpen(!isAmkDrawerOpen)}
                        >
                          <div className={styles.btnContent}>
                            <Layers size={14} color="#F2F0E8" />
                            <span>Каталог пресетов АМК</span>
                          </div>
                          <div className={styles.btnContent}>
                            <span className={styles.activePresetBadge}>{selectedAmk.id}</span>
                            <motion.div animate={{ rotate: isAmkDrawerOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronDown size={14} />
                            </motion.div>
                          </div>
                        </button>

                        <AnimatePresence>
                          {isAmkDrawerOpen && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className={styles.collapsibleDrawer}
                            >
                              <div className={styles.drawerScrollArea}>
                                <div className={styles.amkGrid}>
                                  {AMK_TEXTURE_PRESETS.map((preset) => {
                                    const isActive = selectedAmk.id === preset.id;
                                    return (
                                      <button
                                        key={preset.id}
                                        onClick={() => handleAmkSelect(preset)}
                                        className={`${styles.amkTile} ${isActive ? styles.active : ''}`}
                                      >
                                        <div className={styles.amkColors}>
                                          <div style={{ backgroundColor: preset.colors[0] }} />
                                          <div style={{ backgroundColor: preset.colors[1] }} />
                                          <div style={{ backgroundColor: preset.colors[2] }} />
                                        </div>
                                        <div className={styles.amkMeta}>
                                          <span>{preset.id}</span>
                                          {isActive && <Check size={10} color="#F2F0E8" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className={styles.fieldBlock}>
                        <button 
                          className={styles.drawerToggleBtn}
                          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                        >
                          <div className={styles.btnContent}>
                            <Palette size={14} color="#F2F0E8" />
                            <span>Настройка палитры по этажам</span>
                          </div>
                          <motion.div animate={{ rotate: isColorPickerOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={14} />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isColorPickerOpen && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className={styles.collapsibleDrawer}
                            >
                              <div className={styles.colorPaletteWrapper}>
                                {Array.from({ length: floors }).map((_, idx) => (
                                  <div key={idx} className={styles.colorRow}>
                                    <span className={styles.floorLabel}>{idx + 1} ЭТАЖ</span>
                                    <div className={styles.colorDots}>
                                      {PALETTE.map((item) => (
                                        <button 
                                          key={item.color} 
                                          className={`${styles.colorDot} ${floorColors[idx] === item.color ? styles.active : ''}`} 
                                          style={{ backgroundColor: item.color }} 
                                          onClick={() => handleFloorColorChange(idx, item.color)} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Секция 2: Веранда */}
            <div className={`${styles.accordionSection} ${activeTab === 'veranda' ? styles.openedSection : ''}`}>
              <button className={styles.accordionHeader} onClick={() => toggleTab('veranda')}>
                <div className={styles.accTitle}>
                  <Sun size={15} color={activeTab === 'veranda' ? '#F2F0E8' : '#717D8D'} />
                  <span>02 / Лаунж & Веранда</span>
                </div>
                <motion.div animate={{ rotate: activeTab === 'veranda' ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={15} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {activeTab === 'veranda' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    transition={{ duration: 0.2 }}
                    className={styles.accordionBody}
                  >
                    <div className={styles.fieldBlock}>
                      <div className={styles.segmentControl}>
                        <button className={`${styles.segmentBtn} ${!veranda.hasVeranda ? styles.active : ''}`} onClick={() => setVeranda({ ...veranda, hasVeranda: false })}>БЕЗ ВЕРАНДЫ</button>
                        <button className={`${styles.segmentBtn} ${veranda.hasVeranda ? styles.active : ''}`} onClick={() => setVeranda({ ...veranda, hasVeranda: true })}>С ВЕРАНДОЙ</button>
                      </div>
                    </div>

                    {veranda.hasVeranda && (
                      <>
                        <div className={styles.fieldBlock}>
                          <div className={styles.blockHeader}><label>Стиль ограждения</label></div>
                          <div className={styles.segmentControl}>
                            {FENCE_STYLES.map((f) => (
                              <button key={f.id} className={`${styles.segmentBtn} ${veranda.fenceStyle === f.id ? styles.active : ''}`} onClick={() => setVeranda({ ...veranda, fenceStyle: f.id })}>{f.label}</button>
                            ))}
                          </div>
                        </div>

                        <div className={styles.fieldBlock}>
                          <div className={styles.blockHeader}>
                            <label>Вылет веранды</label>
                            <span className={styles.selectedSubtext}>{veranda.length.toFixed(1)} м</span>
                          </div>
                          <input 
                            type="range" 
                            min="1.0" 
                            max="5.0" 
                            step="0.1" 
                            value={veranda.length} 
                            onChange={(e) => setVeranda({ ...veranda, length: parseFloat(e.target.value) })} 
                            className={styles.cleanRange}
                          />
                        </div>

                        <div className={styles.fieldBlock}>
                          <div className={styles.blockHeader}>
                            <label>Ширина веранды</label>
                            <span className={styles.selectedSubtext}>{veranda.width.toFixed(1)} м</span>
                          </div>
                          <input 
                            type="range" 
                            min="2.0" 
                            max="8.0" 
                            step="0.1" 
                            value={veranda.width} 
                            onChange={(e) => setVeranda({ ...veranda, width: parseFloat(e.target.value) })} 
                            className={styles.cleanRange}
                          />
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Секция 3: Планировка */}
            <div className={`${styles.accordionSection} ${activeTab === 'interior' ? styles.openedSection : ''}`}>
              <button className={styles.accordionHeader} onClick={() => toggleTab('interior')}>
                <div className={styles.accTitle}>
                  <LayoutGrid size={15} color={activeTab === 'interior' ? '#F2F0E8' : '#717D8D'} />
                  <span>03 / Планировка & Стены</span>
                </div>
                <motion.div animate={{ rotate: activeTab === 'interior' ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={15} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {activeTab === 'interior' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    transition={{ duration: 0.2 }}
                    className={styles.accordionBody}
                  >
                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label>Количество комнат</label><span className={styles.selectedSubtext}>{rooms} RMS</span></div>
                      <div className={styles.segmentControl}>
                        {[1, 2, 3, 4].map((num) => (
                          <button key={num} className={`${styles.segmentBtn} ${rooms === num ? styles.active : ''}`} onClick={() => setRooms(num)}>{num} КТ.</button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.fieldBlock}>
                      <div className={styles.blockHeader}><label>Материал перегородок</label></div>
                      <div className={styles.segmentControl}>
                        {PARTITION_MATERIALS.map((mat) => (
                          <button key={mat.id} className={`${styles.segmentBtn} ${partitionMaterial === mat.id ? styles.active : ''}`} onClick={() => setPartitionMaterial(mat.id)}>{mat.label}</button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Смета */}
        <div className={styles.bottomPanel}>
          <div className={styles.priceCard}>
            <span className={styles.priceHeader}>РАСЧЕТНАЯ СТОИМОСТЬ</span>
            <AnimatedPrice value={totalPrice} />
          </div>

          <div className={styles.actionGrid}>
            <div className={styles.secondaryRow}>
              <button className={styles.btnSecondary} onClick={handleShare}>
                <Share2 size={14} />
                <span>ПОДЕЛИТЬСЯ</span>
              </button>
              <button className={styles.btnSecondary} onClick={handleSave}>
                <Bookmark size={14} />
                <span>СОХРАНИТЬ</span>
              </button>
            </div>

            <button 
              className={styles.btnPrimary} 
              onClick={() => alert('Смета сформирована')}
            >
              <Download size={15} />
              <span>СКАЧАТЬ СМЕТУ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}