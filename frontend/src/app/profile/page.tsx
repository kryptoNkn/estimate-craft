'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Layers,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { formatApiError, listProjects, deleteProject } from '@/lib/api';
import type { ProjectSummary } from '@/lib/types';
import { displayName, formatRole, getInitials } from '@/lib/auth-storage';
import styles from './profile.module.scss';

import { TEXTURE_TYPES } from '@/app/constructor/constants';

function formatProjectDate(value: string): string {
  return new Date(value).toLocaleDateString('ru-RU');
}

function formatTexture(textureType: string | null): string {
  if (!textureType) {
    return 'Фасад';
  }

  return TEXTURE_TYPES.find((item) => item.id === textureType)?.label ?? textureType;
}

export default function Profile() {
  const router = useRouter();
  const { user, loading, changePassword, logoutAll } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'materials' | 'security'>('projects');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [logoutAllError, setLogoutAllError] = useState<string | null>(null);
  const [logoutAllSubmitting, setLogoutAllSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsTotal, setProjectsTotal] = useState(0);
  const [projectsCursor, setProjectsCursor] = useState<string | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsLoadingMore, setProjectsLoadingMore] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectQuery, setProjectQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(projectQuery.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [projectQuery]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    setProjectsLoading(true);

    listProjects({ q: debouncedQuery, limit: 20 })
      .then((page) => {
        if (!cancelled) {
          setProjects(page.items);
          setProjectsTotal(page.total);
          setProjectsCursor(page.next_cursor);
          setProjectsError(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProjectsError(formatApiError(error, 'Не удалось загрузить проекты'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProjectsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, debouncedQuery]);

  if (loading || !user) {
    return null;
  }

  const profileName = displayName(user.email).replace('.', '');

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
              <div className={styles.avatarInner}>{getInitials(user.email)}</div>
            </div>
            <span className={styles.badgeOnline} />
          </div>
          <div>
            <div className={styles.roleTag}>
              <Sparkles size={11} />
              <span>{formatRole(user.role).toUpperCase()}</span>
            </div>
            <h1>
              {profileName}
            </h1>
            <p>{user.email}</p>
          </div>
        </div>

        <Link href="/constructor">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={styles.btnCreate}
          >
            <Plus size={16} />
            <span>Новый 3D проект</span>
          </motion.button>
        </Link>
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
            <Box size={22} />
          </div>
          <div>
            <span className={styles.label}>Сохраненные проекты</span>
            <div className={styles.value}>{projectsTotal} Объектов</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconBox}>
            <Layers size={22} />
          </div>
          <div>
            <span className={styles.label}>Кастомные пресеты</span>
            <div className={styles.value}>12 Материалов</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.iconBox}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className={styles.label}>Скидка на материалы</span>
            <div className={styles.value}>7% VIP Status</div>
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
            <button
              className={activeTab === 'security' ? styles.activeTab : ''}
              onClick={() => setActiveTab('security')}
            >
              Безопасность
            </button>
          </div>

          {activeTab === 'projects' && (
          <label className={styles.searchField}>
            <span className={styles.searchLabel}>Поиск</span>
            <input
              type="search"
              value={projectQuery}
              onChange={(event) => setProjectQuery(event.target.value)}
              placeholder="Название проекта"
            />
          </label>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'projects' && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.projectList}
            >
              {projectsLoading ? (
                <div className={styles.emptyState}>
                  <p>Загружаем проекты...</p>
                </div>
              ) : projectsError ? (
                <div className={styles.emptyState}>
                  <p>{projectsError}</p>
                </div>
              ) : projects.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>
                    {debouncedQuery
                      ? 'Ничего не найдено по этому названию.'
                      : 'У вас пока нет сохраненных 3D-проектов.'}
                  </p>
                  {!debouncedQuery && <Link href="/constructor">Открыть конструктор</Link>}
                </div>
              ) : (
                <>
                {projects.map((item) => (
                <motion.div 
                  key={item.id}
                  whileHover={{ x: 6 }}
                  className={styles.projectRow}
                >
                  <div className={styles.projectInfo}>
                    <div className={styles.projectIcon}>
                      <Box size={20} />
                    </div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>
                        {item.floors ? `${item.floors} эт.` : 'Дом'} • {formatTexture(item.texture_type)}
                      </p>
                    </div>
                  </div>

                  <div className={styles.projectActions}>
                    <span className={styles.date}>{formatProjectDate(item.updated_at)}</span>
                    <Link href={`/constructor?project=${item.id}`} className={styles.btnOpen3D}>
                      <span>3D Визор</span>
                      <ArrowUpRight size={14} />
                    </Link>
                    <button
                      type="button"
                      className={styles.btnDelete}
                      onClick={async () => {
                        try {
                          await deleteProject(item.id);
                          setProjects((current) => current.filter((project) => project.id !== item.id));
                          setProjectsTotal((current) => Math.max(0, current - 1));
                        } catch (error) {
                          setProjectsError(formatApiError(error, 'Не удалось удалить проект'));
                        }
                      }}
                    >
                      Удалить
                    </button>
                  </div>
                </motion.div>
                ))}
                {projectsCursor && (
                  <button
                    type="button"
                    className={styles.btnLoadMore}
                    disabled={projectsLoadingMore}
                    onClick={async () => {
                      setProjectsLoadingMore(true);
                      try {
                        const page = await listProjects({
                          q: debouncedQuery,
                          cursor: projectsCursor,
                          limit: 20,
                        });
                        setProjects((current) => [...current, ...page.items]);
                        setProjectsCursor(page.next_cursor);
                        setProjectsTotal(page.total);
                      } catch (error) {
                        setProjectsError(formatApiError(error, 'Не удалось загрузить проекты'));
                      } finally {
                        setProjectsLoadingMore(false);
                      }
                    }}
                  >
                    {projectsLoadingMore ? 'Загружаем...' : 'Показать ещё'}
                  </button>
                )}
                </>
              )}
            </motion.div>
          )}
          {activeTab === 'materials' && (
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
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.securityPanel}
            >
              <p className={styles.securityHint}>
                Смена пароля завершает все другие сессии. Это устройство получит новые токены.
              </p>
              <form
                className={styles.securityForm}
                onSubmit={async (event) => {
                  event.preventDefault();
                  setPasswordError(null);
                  setPasswordSuccess(null);

                  if (newPassword !== confirmPassword) {
                    setPasswordError('Пароли не совпадают');
                    return;
                  }

                  setPasswordSubmitting(true);
                  try {
                    await changePassword(currentPassword, newPassword);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordSuccess('Пароль обновлён, остальные сессии завершены');
                  } catch (error) {
                    setPasswordError(formatApiError(error, 'Не удалось сменить пароль'));
                  } finally {
                    setPasswordSubmitting(false);
                  }
                }}
              >
                <label>
                  Текущий пароль
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                  />
                </label>
                <label>
                  Новый пароль
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                  />
                </label>
                <label>
                  Подтверждение
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    maxLength={128}
                  />
                </label>
                {passwordError && <div className={styles.securityError}>{passwordError}</div>}
                {passwordSuccess && <div className={styles.securitySuccess}>{passwordSuccess}</div>}
                <button type="submit" disabled={passwordSubmitting}>
                  {passwordSubmitting ? 'Сохраняем...' : 'Сменить пароль'}
                </button>
              </form>
              <div className={styles.securitySessions}>
                <p className={styles.securityHint}>
                  Выйти на всех устройствах, не меняя пароль. Текущая сессия тоже закроется.
                </p>
                {logoutAllError && <div className={styles.securityError}>{logoutAllError}</div>}
                <button
                  type="button"
                  className={styles.securityDanger}
                  disabled={logoutAllSubmitting}
                  onClick={async () => {
                    setLogoutAllError(null);
                    setLogoutAllSubmitting(true);
                    try {
                      await logoutAll();
                    } catch (error) {
                      setLogoutAllError(formatApiError(error, 'Не удалось завершить сессии'));
                      setLogoutAllSubmitting(false);
                    }
                  }}
                >
                  {logoutAllSubmitting ? 'Выходим...' : 'Выйти везде'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}