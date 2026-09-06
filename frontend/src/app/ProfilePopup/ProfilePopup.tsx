'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building, Settings, LogOut, ChevronRight, Sparkles } from 'lucide-react';
import styles from './ProfilePopup.module.scss';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePopup({ isOpen, onClose }: ProfilePopupProps): React.JSX.Element | null {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.96 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={styles.popup}
        >
          <div className={styles.header}>
            <div className={styles.avatarLarge}>
              <div className={styles.avatarInner}>АВ</div>
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userName}>Александр В.</span>
              <span className={styles.userEmail}>a.vershinin@estate-corp.ru</span>
              <div className={styles.badgeRole}>
                <Sparkles size={10} />
                <span>Премиум Инвестор</span>
              </div>
            </div>
          </div>

          <div className={styles.menu}>
            <Link href="/profile" className={styles.item} onClick={onClose}>
              <div className={styles.itemLeft}>
                <User size={15} />
                <span>Мой профиль</span>
              </div>
              <ChevronRight size={14} className={styles.arrow} />
            </Link>

            <Link href="/profile/projects" className={styles.item} onClick={onClose}>
              <div className={styles.itemLeft}>
                <Building size={15} />
                <span>Сохраненные 3D проекты</span>
              </div>
              <span className={styles.countBadge}>3</span>
            </Link>

            <Link href="/profile/settings" className={styles.item} onClick={onClose}>
              <div className={styles.itemLeft}>
                <Settings size={15} />
                <span>Настройки аккаунта</span>
              </div>
              <ChevronRight size={14} className={styles.arrow} />
            </Link>

            <button 
              type="button" 
              className={`${styles.item} ${styles.danger}`} 
              onClick={onClose}
            >
              <div className={styles.itemLeft}>
                <LogOut size={15} />
                <span>Завершить сессию</span>
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}