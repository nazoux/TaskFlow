import { useState, useEffect } from 'react';
import styles from './TaskModal.module.css';

const defaultForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: '',
  due_date: '',
  category_id: '',
};

export default function TaskModal({ task, categories, token, onClose }) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || '',
        due_date: task.due_date ? task.due_date.slice(0, 10) : '',
        category_id: task.category_id != null ? String(task.category_id) : '',
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
        setError(data.message || 'An error occurred');
        return;
      }

      onClose(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose(false)}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className={styles.closeBtn} onClick={() => onClose(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="title">Title <span className={styles.required}>*</span></label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Task title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Optional description..."
              rows={3}
              value={form.description}
              onChange={handleChange}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="status">Status <span className={styles.required}>*</span></label>
              <select id="status" name="status" value={form.status} onChange={handleChange} required>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="priority">Priority</label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
                <option value="">None</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="due_date">Due Date</label>
              <input
                id="due_date"
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="category_id">Category</label>
              <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">None</option>
                {categories.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.cancelBtn} onClick={() => onClose(false)}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
