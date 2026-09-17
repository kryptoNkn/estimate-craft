'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

import { formatApiError, forgotPassword } from '@/lib/api';
import styles from '../auth.module.scss';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(formatApiError(err, 'Не удалось отправить запрос'));
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
        <h1 className={styles.title}>Сброс пароля</h1>
        <p className={styles.subtitle}>
          Укажите email. Если аккаунт есть, отправим ссылку для нового пароля.
        </p>

        {sent ? (
          <div className={styles.success}>
            Если этот адрес зарегистрирован, отправим ссылку на почту. Без SMTP в
            development ссылка пишется в лог auth-service.
          </div>
        ) : (
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

            {error && <div className={styles.error}>{error}</div>}

            <button className={styles.submit} type="submit" disabled={submitting}>
              {submitting ? 'Отправляем...' : 'Отправить ссылку'}
            </button>
          </form>
        )}

        <p className={styles.footer}>
          Вспомнили пароль? <Link href="/auth/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
