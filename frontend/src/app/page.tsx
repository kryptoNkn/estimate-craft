'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { 
  ArrowUpRight, Box, ArrowRight
} from 'lucide-react';
import styles from './page.module.scss';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.15,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as const,
    }
  })
};

export default function HomePage(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 120 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - 350);
    mouseY.set(e.clientY - rect.top - 350);
  };

  return (
    <div 
      ref={containerRef} 
      className={styles.pageContainer}
      onMouseMove={handleMouseMove}
    >
      {/* 1. HERO SECTION */}
      <section className={styles.heroSection}>
        {/* Фоновое видео: повышена прозрачность для четкости */}
        <div className={styles.videoBgWrapper}>
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            preload="auto"
            poster="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80"
            className={styles.videoBg}
          >
            <source 
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" 
              type="video/mp4" 
            />
          </video>
          <div className={styles.videoOverlay} />
        </div>

        <div className={styles.bgGrid} />
        <div className={styles.bigWatermark}>AURA</div>
        <motion.div 
          className={styles.glowTorch} 
          style={{ x: glowX, y: glowY }} 
        />

        <motion.div 
          className={styles.heroContent}
          initial="hidden"
          animate="visible"
        >
          {/* Текстовое лого 1 в 1 как в Топбаре (без рамки) */}
          <motion.div variants={fadeInUp} custom={1}>
            <div className={styles.brandTitleText}>
              <div className={styles.logoIcon}>
                <Box size={16} />
              </div>
              <div className={styles.brandText}>
                AURA <span>ARCHITECTURE & LAB</span>
              </div>
            </div>
          </motion.div>

          <motion.h1 className={styles.heroTitle} variants={fadeInUp} custom={2}>
            Инженерное проектирование <br />
            и <span className={styles.accent}>Архитектура</span>
          </motion.h1>

          <motion.p className={styles.heroSub} variants={fadeInUp} custom={3}>
            Создаем авторские резиденции премиум-класса с интерактивной 3D-конфигурацией материалов в реальном времени.
          </motion.p>

          <motion.div className={styles.heroActions} variants={fadeInUp} custom={4}>
            <Link href="/constructor" className={styles.btnPrimary}>
              <span>3D Конструктор</span>
              <div className={styles.btnIconCircle}>
                <ArrowUpRight size={15} />
              </div>
            </Link>

            <Link href="/catalog" className={styles.btnSecondary}>
              <Box size={16} className={styles.secIcon} />
              <span>Каталог Проектов</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. МЕТРИКИ И ПОКАЗАТЕЛИ */}
      <div className={styles.metricsBar}>
        <div className={styles.metricBox}>
          <span className={styles.num}>14+</span>
          <span className={styles.label}>Лет опыта в архитектуре</span>
        </div>
        <div className={styles.metricBox}>
          <span className={styles.num}>120+</span>
          <span className={styles.label}>Реализованных объектов</span>
        </div>
        <div className={styles.metricBox}>
          <span className={styles.num}>45 Дней</span>
          <span className={styles.label}>Средний срок 3D BIM модели</span>
        </div>
        <div className={styles.metricBox}>
          <span className={styles.num}>100%</span>
          <span className={styles.label}>Гарантия автономии</span>
        </div>
      </div>

      {/* 3. КАТАЛОГ ПРОЕКТОВ */}
      <section className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.titleGroup}>
            <span className={styles.tag}>// ИЗБРАННОЕ</span>
            <h2>Готовые 3D Концепты</h2>
          </div>
          <Link href="/catalog" className={styles.catalogLink}>
            <span>Смотреть все объекты</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className={styles.projectsGrid}>
          <div className={styles.projectCard}>
            <div 
              className={styles.cardVisual} 
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80')` }}
            >
              <span className={styles.badgeArea}>320 m²</span>
            </div>
            <div className={styles.cardInfo}>
              <h3 className={styles.pName}>Вилла «Monomark 01»</h3>
              <div className={styles.pMeta}>
                <span>2 Этажа</span>
                <span>•</span>
                <span>AMK Фасад</span>
                <span>•</span>
                <span>Панорамное остекление</span>
              </div>
              <div className={styles.pPriceRow}>
                <span className={styles.price}>от 24 500 000 ₽</span>
                <Link href="/constructor" className={styles.openBtn}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>

          <div className={styles.projectCard}>
            <div 
              className={styles.cardVisual} 
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80')` }}
            >
              <span className={styles.badgeArea}>480 m²</span>
            </div>
            <div className={styles.cardInfo}>
              <h3 className={styles.pName}>Резиденция «Aura Cliff»</h3>
              <div className={styles.pMeta}>
                <span>3 Этажа</span>
                <span>•</span>
                <span>Клинкерный кирпич</span>
                <span>•</span>
                <span>SPA-комплекс</span>
              </div>
              <div className={styles.pPriceRow}>
                <span className={styles.price}>от 42 000 000 ₽</span>
                <Link href="/constructor" className={styles.openBtn}>
                  <ArrowUpRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ЭТАПЫ РАБОТЫ */}
      <section className={styles.workflowSection}>
  <div className={styles.sectionHeader}>
    <span className={styles.tag}>Пошаговый процесс</span>
    <h2>Этапы реализации</h2>
  </div>

  <div className={styles.flowList}>
    <div className={styles.flowStep}>
      <span className={styles.stepNum}>01</span>
      <div className={styles.stepTitle}>
        <span className={styles.stepTag}>STEP // 01</span>
        3D Конфигурация
      </div>
      <p className={styles.stepText}>
        Выбираете фасад, цвета АМК и материалы напрямую в интерактивном конструкторе.
      </p>
    </div>

    <div className={styles.flowStep}>
      <span className={styles.stepNum}>02</span>
      <div className={styles.stepTitle}>
        <span className={styles.stepTag}>STEP // 02</span>
        BIM Расчет
      </div>
      <p className={styles.stepText}>
        Автоматический расчет нагрузки, точной сметы и спецификаций материалов.
      </p>
    </div>

    <div className={styles.flowStep}>
      <span className={styles.stepNum}>03</span>
      <div className={styles.stepTitle}>
        <span className={styles.stepTag}>STEP // 03</span>
        Согласование
      </div>
      <p className={styles.stepText}>
        Подготовка рабочей документации и адаптация под особенности участка.
      </p>
    </div>

    <div className={styles.flowStep}>
      <span className={styles.stepNum}>04</span>
      <div className={styles.stepTitle}>
        <span className={styles.stepTag}>STEP // 04</span>
        Строительство
      </div>
      <p className={styles.stepText}>
        Авторский надзор и реализация объекта «под ключ» в строго установленные сроки.
      </p>
    </div>
  </div>
</section>

      {/* 5. ФОРМА КОНСУЛЬТАЦИИ */}
      <section className={styles.consultSection}>
  <div className={styles.consultGridBg} />
  <div className={styles.consultGlow} />

  <div className={styles.consultContainer}>
    {/* Левая колонка: Заголовок и описание */}
    <div className={styles.consultHeader}>
      <span className={styles.tag}>Персональный расчет</span>
      <h3>
        Готовы обсудить <br />
        <span className={styles.accent}>ваш проект?</span>
      </h3>
      <p>
        Оставьте заявку на разбор и расчет стоимости объекта напрямую с главным архитектором бюро.
      </p>
    </div>

    {/* Правая колонка: Инпуты и кнопка */}
    <form className={styles.consultForm} onSubmit={(e) => e.preventDefault()}>
      <div className={styles.inputGroup}>
        <input type="text" placeholder="Ваше имя" required />
        <span className={styles.lineFocus} />
      </div>

      <div className={styles.inputGroup}>
        <input type="tel" placeholder="+7 (___) ___-__-__" required />
        <span className={styles.lineFocus} />
      </div>

      <button type="submit" className={styles.submitBtn}>
        <span>Запросить консультацию</span>
        <div className={styles.btnIconCircle}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 13L13 1M13 1H3M13 1V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </button>
    </form>
  </div>
</section>
    </div>
  );
}