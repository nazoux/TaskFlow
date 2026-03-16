import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './Auth.module.css';
import { useLang } from '../contexts/LangContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const { t } = useLang();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); return; }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(res => {
        if (res.ok) setStatus('success');
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, []);

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

        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: '#555' }}>{t.auth.verifyingTitle}</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ color: '#16a34a', fontWeight: 600, marginBottom: 16 }}>{t.auth.verifySuccess}</p>
            <a href="/login" className={styles.btnPrimary} style={{ display: 'inline-block', textDecoration: 'none' }}>
              {t.auth.backToLogin}
            </a>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <p style={{ color: '#dc2626', fontWeight: 600, marginBottom: 16 }}>{t.auth.verifyError}</p>
            <a href="/login" className={styles.btnPrimary} style={{ display: 'inline-block', textDecoration: 'none' }}>
              {t.auth.backToLogin}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
