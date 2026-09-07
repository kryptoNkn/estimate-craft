'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/lib/api';
import styles from '../auth.module.scss';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Не удалось выполнить вход');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.eyebrow}>
          <Sparkles size={14} />
          <span>AURA Account</span>
        </div>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.subtitle}>
          Войдите, чтобы сохранять 3D-проекты и управлять профилем.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submit} type="submit" disabled={submitting}>
            {submitting ? 'Входим...' : 'Войти'}
          </button>
        </form>

        <p className={styles.footer}>
          Нет аккаунта? <Link href="/auth/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
