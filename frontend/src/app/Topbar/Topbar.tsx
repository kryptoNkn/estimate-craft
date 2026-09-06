'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Box, ChevronDown } from 'lucide-react';
import ProfilePopup from '../ProfilePopup/ProfilePopup';
import styles from './Topbar.module.scss';

export default function Topbar(): React.JSX.Element {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`${styles.topbarWrapper} ${isScrolled ? styles.scrolled : ''}`}>
      <Link href="/" className={styles.logo}>
        <div className={styles.logoIcon}>
          <Box size={18} />
        </div>
        <div className={styles.brandText}>
          AURA <span>ARCH</span>
        </div>
      </Link>

      <nav className={styles.nav}>
        <Link 
          href="/" 
          className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}
        >
          Главная
        </Link>
        <Link 
          href="/catalog" 
          className={`${styles.navLink} ${pathname === '/catalog' ? styles.active : ''}`}
        >
          Проекты
        </Link>
        <Link 
          href="/about" 
          className={`${styles.navLink} ${pathname === '/about' ? styles.active : ''}`}
        >
          О Бюро
        </Link>
        <Link href="/constructor" className={styles.constructorBadge}>
          <div className={styles.liveDot} />
          <span>3D Конструктор</span>
        </Link>
      </nav>

      <div className={styles.profileWrapper}>
        <motion.button 
          whileTap={{ scale: 0.96 }}
          className={styles.profileBtn}
          onClick={() => setIsPopupOpen(!isPopupOpen)}
        >
          <div className={styles.avatar}>АВ</div>
          <div className={styles.userInfo}>
            <span className={styles.name}>Александр В.</span>
            <span className={styles.role}>Инвестор</span>
          </div>
          <ChevronDown size={14} className={styles.chevron} />
        </motion.button>

        {isPopupOpen && (
          <ProfilePopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
        )}
      </div>
    </header>
  );
}