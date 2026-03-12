import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HexColorPicker } from 'react-colorful';
import { useToast, ToastContainer } from '../components/Toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './Categories.module.css';
import { useLang } from '../contexts/LangContext';

const PRESET_COLORS = [
  '#ef4444','#f97316','#f59e0b','#eab308',
  '#84cc16','#22c55e','#10b981','#14b8a6',
  '#06b6d4','#3b82f6','#6366f1','#8b5cf6',
  '#a855f7','#ec4899','#f43f5e','#64748b',
];

function CategoryModal({ category, token, onClose }) {
  const isEdit = Boolean(category);
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || '#4a7cbd');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { t } = useLang();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = isEdit ? `/categories/${category.id}` : '/categories';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, color }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Error'); return; }
      onClose(true);
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? t.categories.editCategory : t.categories.newCategory}</h2>
          <button className={styles.closeBtn} onClick={() => onClose(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.field}>
            <label htmlFor="name">{t.categories.nameField} <span className={styles.required}>*</span></label>
            <input
              id="name" type="text" placeholder={t.categories.namePlaceholder}
              value={name} onChange={e => setName(e.target.value)} required
            />
          </div>
          <div className={styles.field}>
            <label>{t.categories.colorField}</label>
            <div className={styles.colorPickerWrap}>
              <div className={styles.presetGrid}>
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`${styles.presetDot} ${color.toLowerCase() === c ? styles.presetDotActive : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              <button type="button" className={styles.advancedToggle} onClick={() => setAdvancedOpen(o => !o)}>
                <span className={styles.colorSwatch} style={{ background: color }} />
                <span className={styles.colorValue}>{color}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: advancedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {advancedOpen && (
                <div className={styles.colorPickerInline}>
                  <HexColorPicker color={color} onChange={setColor} />
                </div>
              )}
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => onClose(false)}>{t.categories.cancel}</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? t.categories.saving : isEdit ? t.categories.saveChanges : t.categories.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Categories() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { toasts, toast, remove } = useToast();
  const { t } = useLang();

  const [categories, setCategories] = useState([]);
  const [taskCounts, setTaskCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [catRes, taskRes] = await Promise.all([
      fetch('/categories', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/tasks', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (catRes.status === 401) { logout(); return; }
    const catData = await catRes.json();
    const taskData = taskRes.ok ? await taskRes.json() : { data: [] };
    const tasks = taskData.data || [];
    const counts = {};
    tasks.forEach(t => {
      if (t.category_id) counts[t.category_id] = (counts[t.category_id] || 0) + 1;
    });
    setCategories(catData.data || []);
    setTaskCounts(counts);
    setLoading(false);
  }

  async function fetchCategories() { fetchAll(); }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  async function deleteCategory(id) {
    if (!window.confirm(t.categories.deleteConfirm)) return;
    const res = await fetch(`/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      toast(t.categories.categoryDeleted);
      fetchCategories();
    } else {
      toast(t.categories.failedDelete, 'error');
    }
  }

  function onModalClose(saved) {
    setModalOpen(false);
    if (saved) {
      toast(editingCat ? t.categories.categoryUpdated : t.categories.categoryCreated);
      fetchCategories();
    }
    setEditingCat(null);
  }

  return (
    <div className={styles.layout}>
      <Navbar active="categories" />

      <main className={styles.main}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroDecor1} />
        <div className={styles.heroDecor2} />
        <div className={styles.heroText}>
          <p className={styles.heroLabel}>{t.categories.heroLabel}</p>
          <h1 className={styles.heroTitle}>{t.categories.heroTitle}</h1>
          <p className={styles.heroSub}>
            {loading ? '—' : categories.length === 0
              ? t.categories.noCategories
              : t.categories.categoriesCount(categories.length)}
          </p>
        </div>
        <button className={styles.heroBtn} onClick={() => { setEditingCat(null); setModalOpen(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          {t.categories.newCategory}
        </button>
      </div>
        {loading ? (
          <div className={styles.cardGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonBar} />
                <div className={styles.skeletonLine} style={{ width: '60%' }} />
                <div className={styles.skeletonLine} style={{ width: '40%' }} />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h7"/>
              </svg>
            </div>
            <p className={styles.emptyTitle}>{t.categories.emptyTitle}</p>
            <p className={styles.emptySub}>{t.categories.emptySub}</p>
            <button className={styles.emptyBtn} onClick={() => setModalOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t.categories.createCategory}
            </button>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {categories.map(cat => (
              <div key={cat.id} className={styles.catCard} style={{ '--cat-color': cat.color || '#4a7cbd' }}>
                <div className={styles.catCardAccent} />
                <div className={styles.catCardBody}>
                  <div className={styles.catCardIcon} style={{ background: cat.color || '#4a7cbd' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 6h16M4 12h16M4 18h7"/>
                    </svg>
                  </div>
                  <div className={styles.catCardInfo}>
                    <span className={styles.catCardName}>{cat.name === 'Misc' ? t.finance.misc : cat.name}</span>
                    <span className={styles.catCardColor}>
                      {t.categories.taskCount(taskCounts[cat.id] || 0)}
                    </span>
                  </div>
                </div>
                <div className={styles.catCardActions}>
                  <button className={styles.editBtn} onClick={() => { setEditingCat(cat); setModalOpen(true); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className={styles.deleteBtn} onClick={() => deleteCategory(cat.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <CategoryModal
          category={editingCat}
          token={token}
          onClose={onModalClose}
        />
      )}

      <ToastContainer toasts={toasts} remove={remove} />
      <Footer />
    </div>
  );
}
