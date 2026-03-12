import { useState } from 'react';
import styles from './Auth.module.css';
import { useLang } from '../contexts/LangContext';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { t } = useLang();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError(t.auth.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        <div className={styles.logo}>
          <svg className={styles.logoIcon} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 22l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 17l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            <path d="M6 27l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
          </svg>
          <span className={styles.logoText}>TaskFlow</span>
        </div>

        <h1 className={styles.title}>{t.auth.forgotTitle}</h1>

        {!submitted ? (
          <>
            <p className={styles.subtitle}>
              {t.auth.forgotDesc}
            </p>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="email">{t.auth.email}</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="email"
                    type="email"
                    placeholder={t.auth.emailPlaceholder}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <span className={styles.inputIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M2 7l10 7 10-7"/>
                    </svg>
                  </span>
                </div>
              </div>

              {error && <p className={styles.errorMsg}>{error}</p>}
              <button type="submit" className={styles.btnPrimary} disabled={loading}>
                {loading ? '...' : t.auth.sendResetLink}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.successBox}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4a7cbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            <p>{t.auth.resetSent(email)}</p>
          </div>
        )}

        <p className={styles.switchText}>
          <a href="/login">← {t.auth.backToLogin}</a>
        </p>

      </div>
    </div>
  );
}
