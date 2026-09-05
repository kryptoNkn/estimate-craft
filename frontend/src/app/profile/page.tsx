// components/profile/page.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Box, 
  Layers, 
  ShieldCheck, 
  Plus, 
  ArrowUpRight, 
  ChevronRight, 
  SlidersHorizontal 
} from 'lucide-react';
import styles from './profile.module.scss';

const MOCK_PROJECTS = [
  { id: 1, title: 'Вилла "AURA Residence"', area: '480 м²', material: 'Травертин & Кедр', date: '02.09.2026' },
  { id: 2, title: 'Коттедж "Minimalist Modern"', area: '320 м²', material: 'Сланцевый камень', date: '28.08.2026' },
  { id: 3, title: 'Пентхаус "Skyline View"', area: '210 м²', material: 'Панорамное остекление', date: '15.08.2026' },
];


export default function Profile() {
  const [activeTab, setActiveTab] = useState<'projects' | 'materials'>('projects');

  return (
    <div className={styles.container}>
      {/* Шапка профиля */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={styles.header}
      >
        <div className={styles.userInfo}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              <User size={32} color="#d4af37" />
            </div>
            <span className={styles.badgeOnline} />
          </div>
          <div>
            <div className={styles.roleTag}>PRO INVESTOR</div>
            <h1>Александр Вершинин</h1>
            <p>a.vershinin@estate-corp.ru</p>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={styles.btnCreate}
        >
          <Plus size={18} />
          <span>Новый 3D проект</span>
        </motion.button>
      </motion.section>

      {/* Карточки метрик */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={styles.statsGrid}
      >
        <div className={styles.statCard}>
          <div className={styles.iconBox}>
            <Box size={20} color="#d4af37" />
          </div>
          <div>
            <span className={styles.label}>Сохраненные проекты</span>
            <div className={styles.value}>3 Объекта</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconBox}>
            <Layers size={20} color="#d4af37" />
          </div>
          <div>
            <span className={styles.label}>Кастомные пресеты</span>
            <div className={styles.value}>12 Материалов</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconBox}>
            <ShieldCheck size={20} color="#d4af37" />
          </div>
          <div>
            <span className={styles.label}>Скидка на материалы</span>
            <div className={styles.value}>7% VIP</div>
          </div>
        </div>
      </motion.div>

      {/* Основной блок с проектами */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className={styles.contentSection}
      >
        <div className={styles.tabsHeader}>
          <div className={styles.tabs}>
            <button 
              className={activeTab === 'projects' ? styles.activeTab : ''}
              onClick={() => setActiveTab('projects')}
            >
              Мои 3D Модели
            </button>
            <button 
              className={activeTab === 'materials' ? styles.activeTab : ''}
              onClick={() => setActiveTab('materials')}
            >
              Избранные Фасады
            </button>
          </div>

          <button className={styles.btnFilter}>
            <SlidersHorizontal size={16} />
            <span>Фильтры</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'projects' ? (
            <motion.div 
              key="projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.projectList}
            >
              {MOCK_PROJECTS.map((item) => (
                <motion.div 
                  key={item.id}
                  whileHover={{ x: 6 }}
                  className={styles.projectRow}
                >
                  <div className={styles.projectInfo}>
                    <div className={styles.projectIcon}>
                      <Box size={20} color="#94a3b8" />
                    </div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.area} • {item.material}</p>
                    </div>
                  </div>

                  <div className={styles.projectActions}>
                    <span className={styles.date}>{item.date}</span>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={styles.btnOpen3D}
                    >
                      <span>3D</span>
                      <ArrowUpRight size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="materials"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.emptyState}
            >
              <p>У вас пока нет сохраненных текстур фасадных материалов.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}