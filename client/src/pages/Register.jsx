import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Auth.module.css';
import { useLang } from '../contexts/LangContext';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLang();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        const detail = data.errors?.[0]?.msg;
        setError(detail || data.message || t.auth.registrationFailed);
        return;
      }

      navigate('/login');
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

        <h1 className={styles.title}>{t.auth.signup}</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username">{t.auth.username}</label>
            <div className={styles.inputWrapper}>
              <input
                id="username"
                type="text"
                name="username"
                placeholder={t.auth.usernamePlaceholder}
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                required
              />
              <span className={styles.inputIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">{t.auth.email}</label>
            <div className={styles.inputWrapper}>
              <input
                id="email"
                type="email"
                name="email"
                placeholder={t.auth.emailPlaceholder}
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
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

          <div className={styles.formGroup}>
            <label htmlFor="password">{t.auth.password}</label>
            <div className={styles.inputWrapper}>
              <input
                id="password"
                type="password"
                name="password"
                placeholder={t.auth.passwordPlaceholder}
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <span className={styles.inputIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
            </div>
          </div>

          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? t.auth.creatingAccount : t.auth.createAccount}
          </button>
        </form>

        <p className={styles.switchText}>
          <a href="/login">{t.auth.alreadyAccount}</a>
        </p>

      </div>
    </div>
  );
}
