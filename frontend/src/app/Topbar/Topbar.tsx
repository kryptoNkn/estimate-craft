// components/Topbar/Topbar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react'; // Lucide icon
import { ChevronDownIcon } from '@heroicons/react/24/outline'; // Heroicon
import ProfilePopup from '../ProfilePopup/ProfilePopup';
import styles from './Topbar.module.scss';

export default function Topbar() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <header className={styles.topbar}>
      <Link href="/" className={styles.logo}>
        <Box color="#cfa86e" size={28} />
        <div>AURA <span>DEVELOPMENT</span></div>
      </Link>

      <nav className={styles.nav}>
        <Link href="/">Главная</Link>
        <Link href="/catalog">Каталог объектов</Link>
        <Link href="/constructor">3D Конструктор</Link>
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
          <ChevronDownIcon style={{ width: 16, height: 16, color: '#9ca3af' }} />
        </motion.button>

        <ProfilePopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
      </div>
    </header>
  );
}