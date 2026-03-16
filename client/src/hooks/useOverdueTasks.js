import { useState, useEffect } from 'react';

export function useOverdueTasks() {
  const [overdue, setOverdue] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    async function fetch_() {
      try {
        const res = await fetch('/api/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const tasks = data.data || data || [];
        const today = new Date().toISOString().slice(0, 10);
        setOverdue(tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done'));
      } catch {}
    }

    fetch_();
    const interval = setInterval(fetch_, 5 * 60 * 1000); // refresh toutes les 5 min
    return () => clearInterval(interval);
  }, []);

  return overdue;
}
