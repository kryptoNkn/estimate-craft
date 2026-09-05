// components/ProfilePopup/ProfilePopup.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building, Settings, LogOut } from 'lucide-react';
import styles from './ProfilePopup.module.scss';

interface ProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfilePopup({ isOpen, onClose }: ProfilePopupProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={styles.popup}
        >
          <div className={styles.header}>
            <div style={{ fontWeight: 600 }}>Александр Вершинин</div>
            <div className={styles.email}>a.vershinin@estate-corp.ru</div>
          </div>

          <div className={styles.menu}>
            <Link href="/profile" className={styles.item} onClick={onClose}>
              <User size={18} />
              <span>Мой профиль</span>
            </Link>
            <Link href="/profile/projects" className={styles.item} onClick={onClose}>
              <Building size={18} />
              <span>Сохраненные 3D проекты</span>
            </Link>
            <Link href="/profile/settings" className={styles.item} onClick={onClose}>
              <Settings size={18} />
              <span>Настройки аккаунта</span>
            </Link>
            <button className={`${styles.item} ${styles.danger}`} onClick={onClose}>
              <LogOut size={18} />
              <span>Выйти</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}