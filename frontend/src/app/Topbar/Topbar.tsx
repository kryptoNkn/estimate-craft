'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Box, ChevronDown } from 'lucide-react';
import ProfilePopup from '../ProfilePopup/ProfilePopup';
import { useAuth } from '@/context/AuthContext';
import { displayName, formatRole, getInitials } from '@/lib/auth-storage';
import styles from './Topbar.module.scss';

export default function Topbar(): React.JSX.Element {
  const { user, loading } = useAuth();
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

  useEffect(() => {
    setIsPopupOpen(false);
  }, [pathname, user]);

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
        {!loading && user ? (
          <>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className={styles.profileBtn}
              onClick={() => setIsPopupOpen(!isPopupOpen)}
            >
              <div className={styles.avatar}>{getInitials(user.email)}</div>
              <div className={styles.userInfo}>
                <span className={styles.name}>{displayName(user.email)}</span>
                <span className={styles.role}>{formatRole(user.role)}</span>
              </div>
              <ChevronDown size={14} className={styles.chevron} />
            </motion.button>

            {isPopupOpen && (
              <ProfilePopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
              />
            )}
          </>
        ) : (
          !loading && (
            <div className={styles.authActions}>
              <Link href="/auth/login" className={styles.loginLink}>
                Вход
              </Link>
              <Link href="/auth/register" className={styles.registerBtn}>
                Регистрация
              </Link>
            </div>
          )
        )}
      </div>
    </header>
  );
}
