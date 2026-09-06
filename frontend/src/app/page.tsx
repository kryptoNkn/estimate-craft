'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ArrowRight, Box, Sparkles } from 'lucide-react';
import styles from './page.module.scss';

export default function HomePage(): React.JSX.Element {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className={styles.container}>
      <section ref={heroRef} className={styles.hero}>
        <div className={styles.badge}>
          <div className={styles.badgeIndicator} />
          <Sparkles size={12} style={{ color: '#F2F0E8' }} />
          <span>Architectural Studio Edition</span>
        </div>

        <h1>Инженерное проектирование и архитектура премиум-класса</h1>

        <p>
          Создаем персональные проекты вилл и коттеджей с онлайн-конфигурацией
          материалов в интерактивном 3D-пространстве.
        </p>

        <div className={styles.actions}>
          <Link href="/profile" className={styles.primaryBtn}>
            <span>Личный кабинет</span>
            <ArrowRight size={15} />
          </Link>

          <button type="button" className={styles.secondaryBtn}>
            <Box size={15} />
            <span>Демо 3D</span>
          </button>
        </div>
      </section>
    </div>
  );
}