import { useState, useCallback, useEffect } from 'react';
import styles from './Toast.module.css';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, remove };
}

function ToastItem({ item, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), 3500);
    return () => clearTimeout(timer);
  }, [item.id, onRemove]);

  return (
    <div className={`${styles.toast} ${styles[item.type]}`}>
      <span className={styles.icon}>
        {item.type === 'success' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
        )}
      </span>
      <span className={styles.message}>{item.message}</span>
      <button className={styles.close} onClick={() => onRemove(item.id)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, remove }) {
  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <ToastItem key={t.id} item={t} onRemove={remove} />
      ))}
    </div>
  );
}
