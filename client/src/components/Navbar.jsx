import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar({ active }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.navLeft}>
        <Link to="/dashboard" className={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
            <path d="M6 22l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 17l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            <path d="M6 27l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
          </svg>
          <span className={styles.logoText}>TaskFlow</span>
        </Link>
        <nav className={styles.nav}>
          <Link to="/dashboard" className={`${styles.navLink} ${active === 'dashboard' ? styles.navActive : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </Link>
          <Link to="/categories" className={`${styles.navLink} ${active === 'categories' ? styles.navActive : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h7"/>
            </svg>
            Categories
          </Link>
          <Link to="/profile" className={`${styles.navLink} ${active === 'profile' ? styles.navActive : ''}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            Profile
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
          {user.username || 'User'}
        </Link>
        <button onClick={logout} className={styles.logoutBtn}>Logout</button>
      </div>
    </header>
  );
}
