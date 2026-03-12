import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useLang } from '../contexts/LangContext';

const Logo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 22l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 17l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    <path d="M6 27l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
  </svg>
);

export default function Navbar({ active }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLang();

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.navLeft}>
        <Link to="/dashboard" className={styles.logo}>
          <Logo size={32} />
          <span className={styles.logoText}>TaskFlow</span>
        </Link>
        <nav className={styles.nav}>
          <Link to="/dashboard" className={`${styles.navLink} ${active === 'dashboard' ? styles.navActive : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            {t.nav.dashboard}
          </Link>
          <Link to="/categories" className={`${styles.navLink} ${active === 'categories' ? styles.navActive : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h7"/>
            </svg>
            {t.nav.categories}
          </Link>
          <Link to="/finance" className={`${styles.navLink} ${active === 'finance' ? styles.navActive : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
            {t.nav.finance}
          </Link>
        </nav>
      </div>

      <div className={styles.navRight}>
        <Link to="/profile" className={styles.navUser}>
          {user.avatar
            ? <img src={user.avatar} alt="avatar" className={styles.navAvatar} />
            : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            )
          }
          <span>{user.username || 'User'}</span>
        </Link>
        <button onClick={logout} className={styles.logoutBtn}>{t.nav.logout}</button>

        <button className={styles.hamburger} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span className={menuOpen ? styles.barOpen1 : styles.bar}/>
          <span className={menuOpen ? styles.barOpen2 : styles.bar}/>
          <span className={menuOpen ? styles.barOpen3 : styles.bar}/>
        </button>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/dashboard" className={`${styles.mobileLink} ${active === 'dashboard' ? styles.mobileLinkActive : ''}`} onClick={() => setMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            {t.nav.dashboard}
          </Link>
          <Link to="/categories" className={`${styles.mobileLink} ${active === 'categories' ? styles.mobileLinkActive : ''}`} onClick={() => setMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h7"/>
            </svg>
            {t.nav.categories}
          </Link>
          <Link to="/finance" className={`${styles.mobileLink} ${active === 'finance' ? styles.mobileLinkActive : ''}`} onClick={() => setMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
            {t.nav.finance}
          </Link>
          <Link to="/profile" className={`${styles.mobileLink} ${active === 'profile' ? styles.mobileLinkActive : ''}`} onClick={() => setMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            {t.nav.profile}
          </Link>
          <button onClick={() => { setMenuOpen(false); logout(); }} className={styles.mobileLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            {t.nav.logout}
          </button>
        </div>
      )}
    </header>
  );
}
