import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast, ToastContainer } from '../components/Toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './Profile.module.css';
import { useLang } from '../contexts/LangContext';

export default function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { toasts, toast, remove: removeToast } = useToast();
  const { t, lang, changeLang } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef();

  useEffect(() => {
    function handleClick(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const LANGS = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0];

  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const res = await fetch('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();
    setProfile(data);
    setUsername(data.username);
    setEmail(data.email);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (password && password !== confirmPassword) {
      toast(t.profile.passwordsMismatch, 'error');
      return;
    }
    setSaving(true);
    try {
      const body = {};
      if (username !== profile.username) body.username = username;
      if (email !== profile.email) body.email = email;
      if (password) body.password = password;

      if (Object.keys(body).length === 0) {
        toast(t.profile.nothingToUpdate, 'error');
        setSaving(false);
        return;
      }

      const res = await fetch('/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.message || 'Update failed', 'error'); return; }  // error from server, keep as-is

      // Mettre à jour le localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...data.user }));

      setProfile(prev => ({ ...prev, ...data.user }));
      setPassword('');
      setConfirmPassword('');
      toast(t.profile.profileUpdated);
    } catch {
      toast(t.profile.networkError, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/auth/me/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { toast(data.message || t.profile.uploadFailed, 'error'); return; }

      setProfile(prev => ({ ...prev, avatar: data.avatar }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, avatar: data.avatar }));
      toast(t.profile.avatarUpdated);
    } catch {
      toast(t.profile.networkError, 'error');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  }

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className={styles.layout}>
      <Navbar active="profile" />

      <main className={styles.main}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroDecor1} />
          <div className={styles.heroDecor2} />
          <div className={styles.heroAvatarWrap} onClick={() => fileInputRef.current.click()}>
            {avatarLoading ? (
              <div className={styles.avatarSpinner} />
            ) : profile?.avatar ? (
              <img src={profile.avatar} alt="avatar" className={styles.heroAvatarImg} />
            ) : (
              <div className={styles.heroAvatarPlaceholder}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
            )}
            <div className={styles.heroAvatarOverlay}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <div className={styles.heroText}>
            <p className={styles.heroLabel}>{t.profile.heroLabel}</p>
            <h1 className={styles.heroTitle}>{profile?.username || '—'}</h1>
            <p className={styles.heroSub}>{profile?.email || '—'}</p>
          </div>
          <div className={styles.heroBadge}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            {t.profile.memberSince} {joinDate}
          </div>
        </div>

        {/* 2-column layout */}
        <div className={styles.cols}>
          {/* Left — Account info */}
          <div className={styles.colCard}>
            <div className={styles.colCardHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7cbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              <h2 className={styles.colCardTitle}>{t.profile.accountInfo}</h2>
            </div>
            <form className={styles.form} onSubmit={handleSave}>
              <div className={styles.field}>
                <label className={styles.label}>{t.profile.usernameField}</label>
                <input className={styles.input} type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={t.profile.usernamePlaceholder} minLength={3} maxLength={50} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t.profile.emailField}</label>
                <input className={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.profile.emailPlaceholder} />
              </div>

              <div className={styles.colCardDivider} />

              <div className={styles.colCardHeader}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7cbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <h2 className={styles.colCardTitle}>{t.profile.changePassword} <span className={styles.optional}>{t.profile.optional}</span></h2>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t.profile.newPassword}</label>
                <input className={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t.profile.newPasswordPlaceholder} minLength={6} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>{t.profile.confirmPassword}</label>
                <input
                  className={`${styles.input} ${password && confirmPassword && password !== confirmPassword ? styles.inputError : ''}`}
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder={t.profile.confirmPasswordPlaceholder}
                />
                {password && confirmPassword && password !== confirmPassword && (
                  <span className={styles.fieldError}>{t.profile.passwordMismatch}</span>
                )}
              </div>
              <div className={styles.formFooter}>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? t.profile.saving : t.profile.saveChanges}
                </button>
              </div>
            </form>
          </div>

          {/* Right — Avatar + infos */}
          <div className={styles.colCard}>
            <div className={styles.colCardHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7cbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              <h2 className={styles.colCardTitle}>{t.profile.profilePhoto}</h2>
            </div>
            <div className={styles.avatarCenter}>
              <div className={styles.avatarWrap} onClick={() => fileInputRef.current.click()}>
                {avatarLoading ? (
                  <div className={styles.avatarSpinner} />
                ) : profile?.avatar ? (
                  <img src={profile.avatar} alt="avatar" className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </div>
                )}
                <div className={styles.avatarOverlay}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <button className={styles.changePhotoBtn} onClick={() => fileInputRef.current.click()}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {t.profile.changePhoto}
              </button>
              <p className={styles.avatarHint}>{t.profile.avatarHint}</p>
            </div>

            <div className={styles.colCardDivider} />

            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t.profile.usernameLabel}</span>
                <span className={styles.infoValue}>{profile?.username || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t.profile.emailLabel}</span>
                <span className={styles.infoValue}>{profile?.email || '—'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t.profile.memberSinceLabel}</span>
                <span className={styles.infoValue}>{joinDate}</span>
              </div>
              <div className={styles.colCardDivider} />
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t.profile.languageLabel}</span>
                <div className={styles.langDropdown} ref={langRef}>
                  <button
                    type="button"
                    className={styles.langDropdownBtn}
                    onClick={() => setLangOpen(o => !o)}
                  >
                    <span className={styles.langFlag}>{currentLang.flag}</span>
                    <span className={styles.langName}>{currentLang.label}</span>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                    >
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>
                  {langOpen && (
                    <div className={styles.langDropdownMenu}>
                      {LANGS.map(l => (
                        <button
                          key={l.code}
                          type="button"
                          className={`${styles.langOption} ${l.code === lang ? styles.langOptionActive : ''}`}
                          onClick={() => { changeLang(l.code); setLangOpen(false); }}
                        >
                          <span className={styles.langFlag}>{l.flag}</span>
                          <span>{l.label}</span>
                          {l.code === lang && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a7cbd" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} remove={removeToast} />
      <Footer />
    </div>
  );
}
