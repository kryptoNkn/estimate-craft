'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ArrowRight, Box } from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className={styles.container}>
      <section ref={heroRef} className={styles.hero}>
        <span className={styles.badge}> Next-Gen Architecture</span>
        <h1>Инженерное проектирование и архитектура премиум-класса</h1>
        <p>
          Создаем проекты вилл, коттеджей и пентхаусов с кастомизацией материалов в 3D пространстве.
        </p>
        <div className={styles.actions}>
          <Link href="/profile" className={styles.primaryBtn}>
            <span>Личный кабинет</span>
            <ArrowRight size={18} />
          </Link>
          <button className={styles.secondaryBtn}>
            <Box size={18} />
            <span>Демо 3D</span>
          </button>
        </div>
      </section>
    </div>
  );
}
