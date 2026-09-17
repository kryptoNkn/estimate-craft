'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { formatApiError } from '@/lib/api';
import styles from '../auth.module.scss';

function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Ссылка неполная или устарела. Запросите сброс ещё раз.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setSubmitting(true);

    try {
      await resetPassword(token, password);
    } catch (err) {
      setError(formatApiError(err, 'Не удалось обновить пароль'));
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
        <h1 className={styles.title}>Новый пароль</h1>
        <p className={styles.subtitle}>
          После смены все старые сессии завершатся, вы войдёте заново.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="password">Новый пароль</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Подтверждение</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submit} type="submit" disabled={submitting || !token}>
            {submitting ? 'Сохраняем...' : 'Сохранить пароль'}
          </button>
        </form>

        <p className={styles.footer}>
          Нужна новая ссылка? <Link href="/auth/forgot-password">Запросить сброс</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
