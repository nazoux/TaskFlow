import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 22l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 17l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            <path d="M6 27l12-8 12 8" stroke="#4a7cbd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
          </svg>
          <span className={styles.brandName}>TaskFlow</span>
        </div>

        <div className={styles.contact}>
          <p className={styles.contactLabel}>CONTACT</p>
          <a href="mailto:taskflow.noreply.private@gmail.com" className={styles.contactEmail}>
            taskflow.noreply.private@gmail.com
          </a>
        </div>

        <div className={styles.copy}>
          <p>© {year} TaskFlow</p>
          <p>All rights reserved</p>
        </div>
      </div>
    </footer>
  );
}
