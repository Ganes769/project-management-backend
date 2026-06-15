import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { TaskRead, TaskStatus } from '../types/api';
import { TASK_STATUSES } from '../types/api';
import { statusColumnStyles, statusLabel } from '../lib/format';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  tasks: TaskRead[];
  onTaskClick?: (task: TaskRead) => void;
  onStatusChange?: (
    taskId: number,
    status: TaskStatus,
    options?: { silent?: boolean },
  ) => void;
  onDelete?: (taskId: number) => void;
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: TaskRead[];
  onTaskClick?: (task: TaskRead) => void;
  onStatusChange?: (
    taskId: number,
    status: TaskStatus,
    options?: { silent?: boolean },
  ) => void;
  onDelete?: (taskId: number) => void;
}

interface DraggableTaskCardProps {
  task: TaskRead;
  onTaskClick?: (task: TaskRead) => void;
  onStatusChange?: (
    taskId: number,
    status: TaskStatus,
    options?: { silent?: boolean },
  ) => void;
  onDelete?: (taskId: number) => void;
}

function DraggableTaskCard({
  task,
  onTaskClick,
  onStatusChange,
  onDelete,
}: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task, status: task.status },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'relative touch-none',
        isDragging ? 'opacity-40' : '',
      ].join(' ')}
    >
      <TaskCard
        task={task}
        compact
        dragHandle={
          <button
            type="button"
            className="flex h-full cursor-grab items-center px-1.5 text-slate-300 transition hover:text-slate-500 active:cursor-grabbing"
            aria-label={`Drag ${task.title}`}
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
        onClick={onTaskClick}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
      />
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onStatusChange,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const col = statusColumnStyles[status];

  return (
    <section
      ref={setNodeRef}
      className={[
        'flex min-h-[320px] flex-col rounded-xl border border-slate-200/70 p-3.5 shadow-sm transition-shadow',
        col.bg,
        isOver ? 'border-brand-300 ring-2 ring-brand-400/30' : '',
      ].join(' ')}
    >
      <header className="mb-3 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span
            className={['h-2 w-2 rounded-full', col.dot].join(' ')}
            aria-hidden
          />
          <h3 className="text-[13px] font-semibold tracking-tight text-slate-800">
            {statusLabel[status]}
          </h3>
        </div>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-semibold tabular-nums text-slate-600 shadow-sm ring-1 ring-slate-200/80">
          {tasks.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-2.5">
        {tasks.length === 0 ? (
          <div
            className={[
              'flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-8 transition-colors',
              isOver
                ? 'border-brand-300 bg-brand-50/50'
                : 'border-slate-200/80 bg-white/40',
            ].join(' ')}
          >
            <p className="text-center text-xs text-slate-400">
              {isOver ? 'Release to drop' : 'Drop tasks here'}
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              onTaskClick={onTaskClick}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function KanbanBoard({
  tasks,
  onTaskClick,
  onStatusChange,
  onDelete,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskRead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, TaskRead[]> = {
      planned: [],
      in_progress: [],
      blocked: [],
      done: [],
    };
    for (const task of tasks) map[task.status].push(task);
    return map;
  }, [tasks]);

  const taskById = useMemo(() => {
    const map = new Map<number, TaskRead>();
    for (const task of tasks) map.set(task.id, task);
    return map;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = taskById.get(event.active.id as number);
    setActiveTask(task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !onStatusChange) return;

    const taskId = active.id as number;
    const targetStatus = over.id as TaskStatus;
    if (!TASK_STATUSES.includes(targetStatus)) return;

    const task = taskById.get(taskId);
    if (!task || task.status === targetStatus) return;

    onStatusChange(taskId, targetStatus, { silent: true });
  };

  const handleDragCancel = () => setActiveTask(null);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-0 grid-cols-1 gap-5 md:min-w-[640px] md:grid-cols-2 xl:min-w-0 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={grouped[status]}
            onTaskClick={onTaskClick}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
        {activeTask ? (
          <div className="w-[280px] rotate-1 cursor-grabbing opacity-95 shadow-xl">
            <TaskCard task={activeTask} compact />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
