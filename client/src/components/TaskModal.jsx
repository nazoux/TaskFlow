import { useState, useEffect } from 'react';
import styles from './TaskModal.module.css';
import { useLang } from '../contexts/LangContext';

const defaultForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: '',
  due_date: '',
  category_id: '',
  budget: '',
};

export default function TaskModal({ task, categories, token, onClose }) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || '',
        due_date: task.due_date ? task.due_date.slice(0, 10) : '',
        category_id: task.category_id != null ? String(task.category_id) : '',
        budget: task.budget != null ? String(task.budget) : '',
      });
    }
  }, [task]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body = {
      title: form.title,
      description: form.description || undefined,
      status: form.status,
      priority: form.priority || undefined,
      due_date: form.due_date || undefined,
      category_id: form.category_id ? Number(form.category_id) : null,
      budget: form.budget !== '' ? parseFloat(form.budget) : null,
    };

    try {
      const url = isEdit ? `/tasks/${task.id}` : '/tasks';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || t.taskModal.errorOccurred);
        return;
      }

      onClose(true);
    } catch {
      setError(t.taskModal.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? t.taskModal.editTask : t.taskModal.newTask}</h2>
          <button className={styles.closeBtn} onClick={() => onClose(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="title">{t.taskModal.title} <span className={styles.required}>*</span></label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder={t.taskModal.titlePlaceholder}
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">{t.taskModal.description}</label>
            <textarea
              id="description"
              name="description"
              placeholder={t.taskModal.descriptionPlaceholder}
              rows={3}
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="status">{t.taskModal.status} <span className={styles.required}>*</span></label>
              <select id="status" name="status" value={form.status} onChange={handleChange} required>
                <option value="todo">{t.taskModal.todo}</option>
                <option value="in_progress">{t.taskModal.inProgress}</option>
                <option value="done">{t.taskModal.done}</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="priority">{t.taskModal.priority}</label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                <option value="">{t.taskModal.none}</option>
                <option value="low">{t.taskModal.low}</option>
                <option value="medium">{t.taskModal.medium}</option>
                <option value="high">{t.taskModal.high}</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="due_date">{t.taskModal.dueDate}</label>
              <input
                id="due_date"
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="category_id">{t.taskModal.category}</label>
              <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">{t.taskModal.none}</option>
                {categories.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name === 'Misc' ? t.finance.misc : c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="budget">{t.taskModal.budget}</label>
            <input
              id="budget"
              name="budget"
              type="number"
              min="0"
              step="0.01"
              placeholder={t.taskModal.budgetPlaceholder}
              value={form.budget}
              onChange={handleChange}
            />
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => onClose(false)}>
              {t.taskModal.cancel}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? t.taskModal.saving : isEdit ? t.taskModal.saveChanges : t.taskModal.createTask}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
