import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import styles from './Finance.module.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  AreaChart, Area, CartesianGrid
} from 'recharts';

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const SHORT_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

function fmt(n) {
  return Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Finance() {
  const token = localStorage.getItem('token');
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [summary, setSummary] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [history, setHistory] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [categories, setCategories] = useState([]);

  const [budgetForm, setBudgetForm] = useState({ amount: '', label: '' });
  const [expenseForm, setExpenseForm] = useState({ label: '', amount: '', expense_date: '', category_id: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, histRes, expRes, catsRes] = await Promise.all([
        fetch(`/finance/summary?months=6`, { headers }),
        fetch(`/finance/by-category?year=${selectedYear}&month=${selectedMonth}`, { headers }),
        fetch(`/finance/history?year=${selectedYear}`, { headers }),
        fetch(`/finance/expenses?year=${selectedYear}&month=${selectedMonth}`, { headers }),
        fetch(`/categories`, { headers }),
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (catRes.ok) setByCategory(await catRes.json());
      if (histRes.ok) setHistory(await histRes.json());
      if (expRes.ok) setExpenses(await expRes.json());
      if (catsRes.ok) {
        const d = await catsRes.json();
        setCategories(d.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const currentSummary = summary.find(s => s.year === selectedYear && s.month === selectedMonth);
  const budgeted = currentSummary ? parseFloat(currentSummary.budgeted) : 0;
  const actual = currentSummary ? parseFloat(currentSummary.actual) : 0;
  const forecast = currentSummary ? parseFloat(currentSummary.forecast) : 0;
  const remaining = budgeted - actual;
  const progress = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0;

  function prevMonth() {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function nextMonth() {
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  async function saveBudget(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const res = await fetch('/finance/income', {
        method: 'POST',
        headers,
        body: JSON.stringify({ year: selectedYear, month: selectedMonth, amount: parseFloat(budgetForm.amount), label: budgetForm.label || 'Salaire' }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message || 'Erreur'); return; }
      setShowBudgetModal(false);
      setBudgetForm({ amount: '', label: '' });
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  async function saveExpense(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const body = JSON.stringify({
        label: expenseForm.label,
        amount: parseFloat(expenseForm.amount),
        expense_date: expenseForm.expense_date,
        category_id: expenseForm.category_id ? Number(expenseForm.category_id) : null,
      });
      const res = await fetch(editingExpense ? `/finance/expenses/${editingExpense.id}` : '/finance/expenses', {
        method: editingExpense ? 'PUT' : 'POST',
        headers,
        body,
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message || 'Erreur'); return; }
      setShowExpenseModal(false);
      setEditingExpense(null);
      setExpenseForm({ label: '', amount: '', expense_date: '', category_id: '' });
      fetchAll();
    } finally {
      setSaving(false);
    }
  }

  function openEditExpense(exp) {
    setEditingExpense(exp);
    setExpenseForm({
      label: exp.label,
      amount: String(exp.amount),
      expense_date: exp.expense_date,
      category_id: exp.category_id ? String(exp.category_id) : '',
    });
    setFormError('');
    setShowExpenseModal(true);
  }

  async function deleteExpense(id) {
    if (!confirm('Supprimer cette dépense ?')) return;
    await fetch(`/finance/expenses/${id}`, { method: 'DELETE', headers });
    fetchAll();
  }

  const COLORS = ['#4a7cbd', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];

  return (
    <div className={styles.layout}>
      <Navbar active="finance" />

      <div className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroDecor1} />
          <div className={styles.heroDecor2} />
          <div className={styles.heroLeft}>
            <div className={styles.heroNav}>
              <button className={styles.heroNavBtn} onClick={prevMonth}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span className={styles.heroMonth}>{MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
              <button className={styles.heroNavBtn} onClick={nextMonth}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
            <div className={styles.heroLabel}>Budget mensuel</div>
            <div className={styles.heroAmount}>{fmt(budgeted)} €</div>
            <div className={styles.heroProgressWrap}>
              <div className={styles.heroProgress}>
                <div
                  className={styles.heroProgressFill}
                  style={{ width: `${progress}%`, background: progress >= 100 ? '#ef4444' : progress >= 80 ? '#f97316' : '#22c55e' }}
                />
              </div>
              <span className={styles.heroProgressLabel}>{fmt(actual)} € dépensés</span>
            </div>
            {progress >= 80 && (
              <div className={styles.heroAlert}>
                {progress >= 100 ? '⚠ Budget dépassé !' : '⚠ Attention : 80% du budget atteint'}
              </div>
            )}
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Dépensé</span>
              <span className={styles.heroStatValue} style={{ color: actual > budgeted ? '#ef4444' : '#22c55e' }}>{fmt(actual)} €</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Restant</span>
              <span className={styles.heroStatValue} style={{ color: remaining < 0 ? '#ef4444' : '#fff' }}>{fmt(remaining)} €</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Prévisionnel</span>
              <span className={styles.heroStatValue}>{fmt(forecast)} €</span>
            </div>
          </div>

          <div className={styles.heroBtns}>
            <button className={styles.heroBtnPrimary} onClick={() => { setBudgetForm({ amount: budgeted > 0 ? String(budgeted) : '', label: '' }); setFormError(''); setShowBudgetModal(true); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Définir salaire
            </button>
            <button className={styles.heroBtnSecondary} onClick={() => { setExpenseForm({ label: '', amount: '', expense_date: new Date().toISOString().slice(0, 10), category_id: '' }); setFormError(''); setShowExpenseModal(true); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Ajouter dépense
            </button>
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7cbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              <h3 className={styles.cardTitle}>Prévisionnel vs Réel — 6 derniers mois</h3>
            </div>
            {loading ? <div className={styles.chartSkeleton} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={summary} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${fmt(v)} €`} />
                  <Legend />
                  <Bar dataKey="budgeted" name="Budget" fill="#4a7cbd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Dépensé" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="forecast" name="Prévisionnel" fill="#f97316" radius={[4, 4, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7cbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
              <h3 className={styles.cardTitle}>Répartition par catégorie</h3>
            </div>
            {loading ? <div className={styles.chartSkeleton} /> : byCategory.length === 0 ? (
              <div className={styles.chartEmpty}>Aucune dépense ce mois-ci</div>
            ) : (
              <div className={styles.donutWrap}>
                <ResponsiveContainer width={220} height={200}>
                  <PieChart>
                    <Pie data={byCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                      dataKey="total" nameKey="categoryName" paddingAngle={3}>
                      {byCategory.map((entry, i) => (
                        <Cell key={i} fill={entry.categoryColor || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${fmt(v)} €`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className={styles.donutLegend}>
                  {byCategory.map((entry, i) => (
                    <div key={i} className={styles.donutLegendItem}>
                      <span className={styles.donutDot} style={{ background: entry.categoryColor || COLORS[i % COLORS.length] }} />
                      <span className={styles.donutName}>{entry.categoryName}</span>
                      <span className={styles.donutAmount}>{fmt(entry.total)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.card} style={{ marginBottom: 20 }}>
          <div className={styles.cardHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7cbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <h3 className={styles.cardTitle}>Historique annuel {selectedYear}</h3>
          </div>
          {loading ? <div className={styles.chartSkeleton} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a7cbd" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4a7cbd" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4fa" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `${fmt(v)} €`} />
                <Legend />
                <Area type="monotone" dataKey="budgeted" name="Budget" stroke="#4a7cbd" fill="url(#budgetGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" name="Dépensé" stroke="#22c55e" fill="url(#actualGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7cbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <h3 className={styles.cardTitle}>Dépenses — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</h3>
          </div>
          {loading ? (
            <div className={styles.skeletonWrap}>
              {[1,2,3].map(i => <div key={i} className={styles.skeletonRow}><div className={styles.skeletonCell} style={{ width: '40%' }}/><div className={styles.skeletonCell} style={{ width: '20%' }}/><div className={styles.skeletonCell} style={{ width: '20%' }}/></div>)}
            </div>
          ) : expenses.length === 0 ? (
            <div className={styles.emptyExpenses}>Aucune dépense ce mois-ci</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Libellé</th>
                  <th>Catégorie</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} className={styles.tableRow}>
                    <td className={styles.expLabel}>
                      {exp.task_id && <span className={styles.taskBadge}>Tâche</span>}
                      {exp.label}
                    </td>
                    <td>
                      {exp.Category ? (
                        <span className={styles.catTag}>
                          <span className={styles.catDot} style={{ background: exp.Category.color }} />
                          {exp.Category.name}
                        </span>
                      ) : <span className={styles.nocat}>—</span>}
                    </td>
                    <td className={styles.dateCell}>{exp.expense_date}</td>
                    <td className={styles.amountCell}>{fmt(exp.amount)} €</td>
                    <td className={styles.actionCell}>
                      {!exp.task_id && (
                        <>
                          <button className={styles.editBtn} onClick={() => openEditExpense(exp)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button className={styles.deleteBtn} onClick={() => deleteExpense(exp.id)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                            </svg>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showBudgetModal && (
        <div className={styles.overlay} onClick={e => e.target === e.currentTarget && setShowBudgetModal(false)}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Salaire — {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</h2>
              <button className={styles.closeBtn} onClick={() => setShowBudgetModal(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {formError && <div className={styles.modalError}>{formError}</div>}
            <form onSubmit={saveBudget} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label>Libellé</label>
                <input type="text" placeholder="ex: Salaire, Freelance..."
                  value={budgetForm.label} onChange={e => setBudgetForm(f => ({ ...f, label: e.target.value }))} />
              </div>
              <div className={styles.modalField}>
                <label>Montant (€)</label>
                <input type="number" min="0" step="0.01" placeholder="ex: 2500.00"
                  value={budgetForm.amount} onChange={e => setBudgetForm(f => ({ ...f, amount: e.target.value }))} required />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowBudgetModal(false)}>Annuler</button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) { setShowExpenseModal(false); setEditingExpense(null); } }}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{editingExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}</h2>
              <button className={styles.closeBtn} onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {formError && <div className={styles.modalError}>{formError}</div>}
            <form onSubmit={saveExpense} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label>Libellé <span className={styles.required}>*</span></label>
                <input type="text" placeholder="ex: Abonnement Netflix"
                  value={expenseForm.label} onChange={e => setExpenseForm(f => ({ ...f, label: e.target.value }))} required />
              </div>
              <div className={styles.modalRow}>
                <div className={styles.modalField}>
                  <label>Montant (€) <span className={styles.required}>*</span></label>
                  <input type="number" min="0" step="0.01" placeholder="0.00"
                    value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} required />
                </div>
                <div className={styles.modalField}>
                  <label>Date <span className={styles.required}>*</span></label>
                  <input type="date"
                    value={expenseForm.expense_date} onChange={e => setExpenseForm(f => ({ ...f, expense_date: e.target.value }))} required />
                </div>
              </div>
              <div className={styles.modalField}>
                <label>Catégorie</label>
                <select value={expenseForm.category_id} onChange={e => setExpenseForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">Aucune</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }}>Annuler</button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>{saving ? 'Enregistrement...' : editingExpense ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
