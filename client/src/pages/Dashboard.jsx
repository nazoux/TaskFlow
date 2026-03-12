import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TaskModal from '../components/TaskModal';
import KanbanView from '../components/KanbanView';
import { useToast, ToastContainer } from '../components/Toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLang } from '../contexts/LangContext';

function fmtEur(n) {
  return Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const COLORS = ['#4a7cbd', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];

const PER_PAGE = 5;
const PRIORITY_LABELS_EN = { low: 'Low', medium: 'Medium', high: 'High' };
const PRIO_ORDER = { high: 0, medium: 1, low: 2 };

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date();
}

function SortIcon({ active, dir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.3, marginLeft: 4, flexShrink: 0 }}>
      {!active || dir === 'asc' ? <path d="M12 5l-7 7h14L12 5z"/> : <path d="M12 19l7-7H5l7 7z"/>}
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { toasts, toast, remove: removeToast } = useToast();
  const { t } = useLang();
  const STATUS_LABELS = { todo: t.dashboard.todo, in_progress: t.dashboard.inProgress, done: t.dashboard.done };
  const PRIORITY_LABELS = { low: t.taskModal.low, medium: t.taskModal.medium, high: t.taskModal.high };

  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [view, setView] = useState('list');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [expandedDesc, setExpandedDesc] = useState(null);
  const [financeByCategory, setFinanceByCategory] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchTasks();
    fetchCategories();
    fetchFinance();
  }, []);

  async function fetchFinance() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const h = { Authorization: `Bearer ${token}` };
    const [catRes, sumRes] = await Promise.all([
      fetch(`/finance/by-category?year=${year}&month=${month}`, { headers: h }),
      fetch(`/finance/summary?months=1`, { headers: h }),
    ]);
    if (catRes.ok) setFinanceByCategory(await catRes.json());
    if (sumRes.ok) {
      const data = await sumRes.json();
      setFinanceSummary(data[0] || null);
    }
  }

  async function fetchTasks() {
    setLoading(true);
    const res = await fetch('/tasks', { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { logout(); return; }
    const data = await res.json();
    setTasks(data.data || []);
    setLoading(false);
  }

  async function fetchCategories() {
    const res = await fetch('/categories', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const data = await res.json();
    setCategories(data.data || []);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  async function deleteTask(id) {
    const res = await fetch(`/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      toast(t.dashboard.taskDeleted);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      fetchTasks();
    } else {
      toast(t.dashboard.failedDeleteTask, 'error');
    }
  }

  async function deleteBulk() {
    const count = selected.size;
    await Promise.all([...selected].map(id =>
      fetch(`/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    ));
    setSelected(new Set());
    toast(t.dashboard.tasksDeleted(count));
    fetchTasks();
  }

  async function updateTaskStatus(id, status) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const res = await fetch(`/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: task.title, status }),
    });
    if (res.ok) {
      fetchTasks();
      fetchFinance();
    } else {
      toast(t.dashboard.failedMoveTask, 'error');
    }
  }

  function openCreate() { setEditingTask(null); setModalOpen(true); }
  function openEdit(task) { setEditingTask(task); setModalOpen(true); }

  function onModalClose(saved) {
    if (saved) {
      toast(editingTask ? t.dashboard.taskUpdated : t.dashboard.taskCreated);
      fetchTasks();
    }
    setModalOpen(false);
    setEditingTask(null);
  }

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
    setPage(1);
  }

  function handleStatusFilter(val)   { setStatusFilter(val);   setPage(1); setSelected(new Set()); }
  function handleCategoryFilter(val) { setCategoryFilter(val); setPage(1); setSelected(new Set()); }
  function handleSearch(val)         { setSearch(val);         setPage(1); setSelected(new Set()); }

  function toggleSelect(id) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleSelectAll() {
    const allSelected = paginated.length > 0 && paginated.every(t => selected.has(t.id));
    setSelected(allSelected ? new Set() : new Set(paginated.map(t => t.id)));
  }

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  };
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const catMap = Object.fromEntries(categories.map(c => [String(c.id), c]));

  let filtered = tasks.filter(t => {
    const statusOk = statusFilter === 'all' || t.status === statusFilter;
    const catOk = categoryFilter === 'all' || String(t.category_id) === categoryFilter;
    const searchOk = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return statusOk && catOk && searchOk;
  });

  if (sortBy) {
    filtered = [...filtered].sort((a, b) => {
      let va, vb;
      if (sortBy === 'priority') {
        va = PRIO_ORDER[a.priority] ?? 3;
        vb = PRIO_ORDER[b.priority] ?? 3;
      } else if (sortBy === 'due_date') {
        va = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        vb = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      } else {
        va = (a[sortBy] || '').toLowerCase();
        vb = (b[sortBy] || '').toLowerCase();
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const allPageSelected = paginated.length > 0 && paginated.every(t => selected.has(t.id));

  return (
    <div className={styles.layout}>

      <Navbar active="dashboard" />

      <main className={styles.main}>

        <div className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.greeting}>{t.dashboard.greeting} <strong>{user.username || 'User'}</strong> 👋</p>
            <h1 className={styles.pageTitle}>{t.dashboard.pageTitle}</h1>
            <p className={styles.heroSub}>
              {stats.total === 0
                ? t.dashboard.noTasks
                : stats.done === stats.total
                  ? t.dashboard.allDone(stats.total)
                  : t.dashboard.remaining(stats.total - stats.done, stats.inProgress)
              }
            </p>
          </div>
          <button onClick={openCreate} className={styles.heroBtn}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {t.dashboard.newTask}
          </button>
        </div>

        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statCardBlue}`}>
            <div className={styles.statIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <p className={styles.statLabel}>{t.dashboard.totalTasks}</p>
              <p className={styles.statValue}>{stats.total}</p>
              <div className={styles.statBar}><div className={styles.statBarFillBlue} style={{ width: '100%' }} /></div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardOrange}`}>
            <div className={styles.statIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l3 3"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <p className={styles.statLabel}>{t.dashboard.inProgress}</p>
              <p className={styles.statValue}>{stats.inProgress}</p>
              <div className={styles.statBar}><div className={styles.statBarFillOrange} style={{ width: stats.total > 0 ? `${(stats.inProgress / stats.total) * 100}%` : '0%' }} /></div>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardGreen}`}>
            <div className={styles.statIconWrap}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div className={styles.statBody}>
              <p className={styles.statLabel}>{t.dashboard.done}</p>
              <p className={styles.statValue}>{stats.done}</p>
              <div className={styles.statBar}><div className={styles.statBarFillGreen} style={{ width: stats.total > 0 ? `${progress}%` : '0%' }} /></div>
            </div>
          </div>
        </div>

        {stats.total > 0 && (
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span>{t.dashboard.overallProgress}</span>
              <span><strong>{progress}%</strong> {t.dashboard.completed}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className={styles.contentGrid}>
          <div className={styles.colMain}>
            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <div className={styles.searchWrapper}>
                  <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    className={styles.searchInput}
                    type="text"
                    placeholder={t.dashboard.searchPlaceholder}
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                  />
                  {search && <button className={styles.searchClear} onClick={() => handleSearch('')}>×</button>}
                </div>
                <select className={styles.select} value={statusFilter} onChange={e => handleStatusFilter(e.target.value)}>
                  <option value="all">{t.dashboard.allStatuses}</option>
                  <option value="todo">{t.dashboard.todo}</option>
                  <option value="in_progress">{t.dashboard.inProgress}</option>
                  <option value="done">{t.dashboard.done}</option>
                </select>
                <select className={styles.select} value={categoryFilter} onChange={e => handleCategoryFilter(e.target.value)}>
                  <option value="all">{t.dashboard.allCategories}</option>
                  {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name === 'Misc' ? t.finance.misc : c.name}</option>)}
                </select>
              </div>
              <div className={styles.toolbarRight}>
                <div className={styles.viewToggle}>
                  <button className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setView('list')} title="List view">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </button>
                  <button className={`${styles.viewBtn} ${view === 'kanban' ? styles.viewBtnActive : ''}`} onClick={() => setView('kanban')} title="Kanban view">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="5" height="18" rx="1"/>
                      <rect x="10" y="3" width="5" height="12" rx="1"/>
                      <rect x="17" y="3" width="5" height="15" rx="1"/>
                    </svg>
                  </button>
                </div>
                <button onClick={openCreate} className={styles.newTaskBtn}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  {t.dashboard.newTask}
                </button>
              </div>
            </div>

            {selected.size > 0 && (
              <div className={styles.bulkBar}>
                <span>{t.dashboard.selected(selected.size)}</span>
                <button className={styles.bulkDelete} onClick={deleteBulk}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                  {t.dashboard.deleteSelected}
                </button>
                <button className={styles.bulkCancel} onClick={() => setSelected(new Set())}>{t.dashboard.cancel}</button>
              </div>
            )}

        {view === 'list' && (
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.skeletonWrap}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={styles.skeletonRow}>
                    <div className={styles.skeletonCell} style={{ width: 20 }} />
                    <div className={styles.skeletonCell} style={{ width: '35%' }} />
                    <div className={styles.skeletonCell} style={{ width: 80 }} />
                    <div className={styles.skeletonCell} style={{ width: 70 }} />
                    <div className={styles.skeletonCell} style={{ width: 100 }} />
                    <div className={styles.skeletonCell} style={{ width: 80 }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIllustration}>
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="30" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2"/>
                    <path d="M22 20h20a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H22a2 2 0 0 1-2-2V22a2 2 0 0 1 2-2z" fill="#fff" stroke="#93c5fd" strokeWidth="1.5"/>
                    <path d="M26 30h12M26 35h8" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="26" y="24" width="12" height="3" rx="1" fill="#bfdbfe"/>
                  </svg>
                </div>
                {search || statusFilter !== 'all' || categoryFilter !== 'all' ? (
                  <>
                    <h3>{t.dashboard.noMatchingTasks}</h3>
                    <p>{t.dashboard.adjustFilters}</p>
                    <button className={styles.emptySecondaryBtn} onClick={() => { handleSearch(''); handleStatusFilter('all'); handleCategoryFilter('all'); }}>
                      {t.dashboard.clearFilters}
                    </button>
                  </>
                ) : (
                  <>
                    <h3>{t.dashboard.allClear}</h3>
                    <p>{t.dashboard.noTasksYet}</p>
                    <button onClick={openCreate} className={styles.emptyPrimaryBtn}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                      {t.dashboard.createFirstTask}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.thCheck}>
                        <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} />
                      </th>
                      <th className={styles.thSortable} onClick={() => handleSort('title')}>
                        {t.dashboard.title} <SortIcon active={sortBy === 'title'} dir={sortDir} />
                      </th>
                      <th>{t.dashboard.status}</th>
                      <th className={styles.thSortable} onClick={() => handleSort('priority')}>
                        {t.dashboard.priority} <SortIcon active={sortBy === 'priority'} dir={sortDir} />
                      </th>
                      <th className={styles.thSortable} onClick={() => handleSort('due_date')}>
                        {t.dashboard.dueDate} <SortIcon active={sortBy === 'due_date'} dir={sortDir} />
                      </th>
                      <th>{t.dashboard.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(task => {
                      const overdue = isOverdue(task);
                      const cat = catMap[String(task.category_id)];
                      return (
                        <>
                          <tr key={task.id} className={`${styles.row} ${selected.has(task.id) ? styles.rowSelected : ''}`}>
                            <td><input type="checkbox" checked={selected.has(task.id)} onChange={() => toggleSelect(task.id)} /></td>
                            <td className={styles.titleCell}>
                              <div className={styles.titleRow}>
                                <span className={styles.titleText}>{task.title}</span>
                                <div className={styles.titleMeta}>
                                  {overdue && <span className={styles.overdueBadge}>{t.dashboard.overdue}</span>}
                                  {cat && (
                                    <span className={styles.catTag}>
                                      {cat.color && <span className={styles.catDot} style={{ background: cat.color }} />}
                                      {cat.name === 'Misc' ? t.finance.misc : cat.name}
                                    </span>
                                  )}
                                  {task.description && (
                                    <button
                                      className={styles.descToggle}
                                      onClick={() => setExpandedDesc(expandedDesc === task.id ? null : task.id)}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        {expandedDesc === task.id ? <path d="M18 15l-6-6-6 6"/> : <path d="M6 9l6 6 6-6"/>}
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`${styles.badge} ${styles[`status_${task.status}`]}`}>
                                {STATUS_LABELS[task.status] || task.status}
                              </span>
                            </td>
                            <td>
                              {task.priority
                                ? <span className={`${styles.badge} ${styles[`priority_${task.priority}`]}`}>{PRIORITY_LABELS[task.priority]}</span>
                                : '—'}
                            </td>
                            <td className={`${styles.dateCell} ${overdue ? styles.dateCellOverdue : ''}`}>
                              {formatDate(task.due_date)}
                            </td>
                            <td>
                              <div className={styles.actions}>
                                <button className={styles.editBtn} onClick={() => openEdit(task)} title="Edit">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                                <button className={styles.deleteBtn} onClick={() => deleteTask(task.id)} title="Delete">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedDesc === task.id && (
                            <tr key={`${task.id}-desc`} className={styles.descRow}>
                              <td colSpan="6">
                                <p className={styles.descText}>{task.description}</p>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>
                      {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                    </span>
                    <div className={styles.paginationBtns}>
                      <button className={styles.pageBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`} onClick={() => setPage(p)}>{p}</button>
                      ))}
                      <button className={styles.pageBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === 'kanban' && !loading && (
          <KanbanView tasks={filtered} catMap={catMap} onEdit={openEdit} onDelete={deleteTask} onStatusChange={updateTaskStatus} />
        )}

          </div>

          <aside className={styles.sidebar}>
            <div className={styles.sideWidget}>
              <h3 className={styles.sideWidgetTitle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l3 3"/>
                </svg>
                {t.dashboard.dueThisWeek}
              </h3>
              {(() => {
                const now = new Date();
                const week = new Date(now); week.setDate(now.getDate() + 7);
                const due = tasks
                  .filter(task => task.status !== 'done' && task.due_date && new Date(task.due_date) >= now && new Date(task.due_date) <= week)
                  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                  .slice(0, 5);
                if (due.length === 0) return (
                  <p className={styles.sideEmpty}>{t.dashboard.noDueSoon}</p>
                );
                return due.map(task => {
                  const overdue = isOverdue(task);
                  const daysLeft = Math.ceil((new Date(task.due_date) - now) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={task.id} className={styles.dueItem} onClick={() => openEdit(task)}>
                      <div className={`${styles.dueDot} ${task.priority === 'high' ? styles.dueDotRed : task.priority === 'medium' ? styles.dueDotOrange : styles.dueDotBlue}`} />
                      <div className={styles.dueText}>
                        <span className={styles.dueTitle}>{task.title}</span>
                        <span className={`${styles.dueDate} ${overdue ? styles.dueDateOverdue : ''}`}>
                          {daysLeft === 0 ? t.dashboard.today : daysLeft === 1 ? t.dashboard.tomorrow : t.dashboard.inDays(daysLeft)}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className={styles.sideWidget}>
              <h3 className={styles.sideWidgetTitle}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                {t.dashboard.monthlyExpenses}
              </h3>
              {financeSummary === null ? (
                <p className={styles.sideEmpty}>{t.dashboard.noFinancialData}</p>
              ) : (() => {
                const budgeted = parseFloat(financeSummary.budgeted || 0);
                const actual = parseFloat(financeSummary.actual || 0);
                const progress = budgeted > 0 ? Math.min((actual / budgeted) * 100, 100) : 0;
                const progressColor = progress >= 100 ? '#ef4444' : progress >= 80 ? '#f97316' : '#22c55e';
                return (
                  <div>
                    <div className={styles.financeAmounts}>
                      <span className={styles.financeActual} style={{ color: actual > budgeted && budgeted > 0 ? '#ef4444' : '#1a2b4a' }}>{fmtEur(actual)} €</span>
                      {budgeted > 0 && <span className={styles.financeBudget}>/ {fmtEur(budgeted)} €</span>}
                    </div>
                    {budgeted > 0 && (
                      <>
                        <div className={styles.financeBar}>
                          <div className={styles.financeBarFill} style={{ width: `${progress}%`, background: progressColor }} />
                        </div>
                        <div className={styles.financeBarLabel}>{t.dashboard.budgetConsumed(Math.round(progress))}</div>
                      </>
                    )}
                    {financeByCategory.length > 0 && (
                      <div className={styles.financeDonutWrap}>
                        <ResponsiveContainer width="100%" height={140}>
                          <PieChart>
                            <Pie data={financeByCategory} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                              dataKey="total" nameKey="categoryName" paddingAngle={3}>
                              {financeByCategory.map((entry, i) => (
                                <Cell key={i} fill={entry.categoryColor || COLORS[i % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => `${fmtEur(v)} €`} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className={styles.financeDonutLegend}>
                          {financeByCategory.slice(0, 4).map((entry, i) => (
                            <div key={i} className={styles.financeDonutItem}>
                              <span className={styles.financeDonutDot} style={{ background: entry.categoryColor || COLORS[i % COLORS.length] }} />
                              <span className={styles.financeDonutName}>{entry.categoryName}</span>
                              <span className={styles.financeDonutAmt}>{fmtEur(entry.total)} €</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

          </aside>
        </div>

      </main>

      {modalOpen && (
        <TaskModal task={editingTask} categories={categories} token={token} onClose={onModalClose} />
      )}

      <ToastContainer toasts={toasts} remove={removeToast} />
      <Footer />
    </div>
  );
}
