import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import styles from './KanbanView.module.css';

const COLUMNS = [
  { key: 'todo',        label: 'To Do',      accent: '#3b82f6' },
  { key: 'in_progress', label: 'In Progress', accent: '#f97316' },
  { key: 'done',        label: 'Done',        accent: '#22c55e' },
];

const PRIORITY_COLORS = {
  high:   { bg: '#fee2e2', color: '#dc2626' },
  medium: { bg: '#fff7ed', color: '#c2410c' },
  low:    { bg: '#f1f5f9', color: '#64748b' },
};

function isOverdue(task) {
  if (!task.due_date || task.status === 'done') return false;
  return new Date(task.due_date) < new Date();
}

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── Card content (shared between normal + overlay) ─────────────────────── */
function CardContent({ task, catMap, onEdit, onDelete, isOverlay }) {
  const overdue = isOverdue(task);
  const cat = catMap[String(task.category_id)];
  const prio = PRIORITY_COLORS[task.priority];

  return (
    <div className={`${styles.card} ${overdue ? styles.cardOverdue : ''} ${isOverlay ? styles.cardOverlayStyle : ''}`}>
      <div className={styles.cardTop}>
        <div className={styles.dragHandle}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/>
            <circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
            <circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
          </svg>
        </div>
        <p className={styles.cardTitle}>{task.title}</p>
        {!isOverlay && (
          <div className={styles.cardActions}>
            <button
              className={styles.cardEdit}
              onPointerDown={e => e.stopPropagation()}
              onClick={() => onEdit(task)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button
              className={styles.cardDelete}
              onPointerDown={e => e.stopPropagation()}
              onClick={() => onDelete(task.id)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p className={styles.cardDesc}>{task.description}</p>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.cardMeta}>
          {prio && (
            <span className={styles.cardBadge} style={{ background: prio.bg, color: prio.color }}>
              {task.priority}
            </span>
          )}
          {cat && (
            <span className={styles.cardCat}>
              {cat.color && <span className={styles.catDot} style={{ background: cat.color }} />}
              {cat.name}
            </span>
          )}
        </div>
        {task.due_date && (
          <span className={`${styles.cardDate} ${overdue ? styles.cardDateOverdue : ''}`}>
            {overdue && '⚠ '}{formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Draggable card wrapper ─────────────────────────────────────────────── */
function DraggableCard({ task, catMap, onEdit, onDelete, activeId }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1, cursor: 'grab', outline: 'none' }}
    >
      <CardContent task={task} catMap={catMap} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

/* ─── Droppable column ───────────────────────────────────────────────────── */
function KanbanColumn({ col, tasks, catMap, onEdit, onDelete, activeId }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  return (
    <div className={`${styles.column} ${isOver ? styles.columnOver : ''}`}>
      <div className={styles.colHeader} style={{ borderTopColor: col.accent }}>
        <span className={styles.colTitle}>{col.label}</span>
        <span className={styles.colCount} style={{ background: col.accent }}>{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`${styles.cards} ${isOver ? styles.cardsOver : ''}`}
      >
        {tasks.length === 0 ? (
          <div className={`${styles.emptyCol} ${isOver ? styles.emptyColOver : ''}`}>
            Drop here
          </div>
        ) : (
          tasks.map(task => (
            <DraggableCard
              key={task.id}
              task={task}
              catMap={catMap}
              onEdit={onEdit}
              onDelete={onDelete}
              activeId={activeId}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Main KanbanView ────────────────────────────────────────────────────── */
export default function KanbanView({ tasks, catMap, onEdit, onDelete, onStatusChange }) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function handleDragStart({ active }) {
    setActiveTask(tasks.find(t => t.id === active.id) || null);
  }

  function handleDragEnd({ active, over }) {
    setActiveTask(null);
    if (!over) return;
    const task = tasks.find(t => t.id === active.id);
    if (!task || task.status === over.id) return;
    onStatusChange(task.id, over.id);
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className={styles.board}>
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.key}
            col={col}
            tasks={tasks.filter(t => t.status === col.key)}
            catMap={catMap}
            onEdit={onEdit}
            onDelete={onDelete}
            activeId={activeTask?.id}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeTask ? (
          <CardContent task={activeTask} catMap={catMap} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
