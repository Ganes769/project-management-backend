import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  ChevronLeft,
  KanbanSquare,
  ListOrdered,
  ListTodo,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DependenciesPanel } from '../components/DependenciesPanel';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { KanbanBoard } from '../components/KanbanBoard';
import { Modal } from '../components/Modal';
import { OrderedTaskList } from '../components/OrderedTaskList';
import { PageHeader } from '../components/PageHeader';
import { ProjectForm } from '../components/ProjectForm';
import { ProjectOverview } from '../components/ProjectOverview';
import { SegmentedControl } from '../components/SegmentedControl';
import { Spinner } from '../components/Spinner';
import { SubtasksPanel } from '../components/SubtasksPanel';
import { TaskForm } from '../components/TaskForm';
import {
  useDeleteProject,
  useProject,
  useProjectTaskOrder,
  useUpdateProject,
} from '../hooks/useProjects';
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from '../hooks/useTasks';
import { formatDate } from '../lib/format';
import type {
  ProjectCreate,
  ProjectUpdate,
  TaskCreate,
  TaskRead,
  TaskReadWithProgress,
  TaskStatus,
  TaskUpdate,
} from '../types/api';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const id = projectId ? Number.parseInt(projectId, 10) : undefined;
  const navigate = useNavigate();

  const { data: project, isLoading, error, refetch } = useProject(id);
  const updateProject = useUpdateProject(id ?? 0);
  const deleteProject = useDeleteProject();
  const createTask = useCreateTask(id ?? 0);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskReadWithProgress | null>(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [view, setView] = useState<'kanban' | 'order'>('kanban');

  const {
    data: orderedTasks,
    isLoading: orderLoading,
  } = useProjectTaskOrder(view === 'order' ? id : undefined);

  if (!id) {
    return (
      <div className="page-body">
        <ErrorState title="Invalid project" error="Project ID is missing." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-body">
        <Spinner label="Loading project…" className="py-24" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="page-body">
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const handleCreateTask = (values: TaskCreate | TaskUpdate) => {
    createTask.mutate(values as TaskCreate, {
      onSuccess: () => {
        setShowCreateTask(false);
        createTask.reset();
      },
    });
  };

  const handleEditTask = (values: TaskCreate | TaskUpdate) => {
    if (!editingTask) return;
    updateTask.mutate(
      { taskId: editingTask.id, payload: values as TaskUpdate },
      {
        onSuccess: () => {
          setEditingTask(null);
          updateTask.reset();
        },
      },
    );
  };

  const handleStatusChange = (
    taskId: number,
    status: TaskStatus,
    options?: { silent?: boolean },
  ) => {
    updateTask.mutate(
      { taskId, payload: { status } },
      options?.silent ? { meta: { successMessage: '' } } : undefined,
    );
  };

  const handleEditProject = (values: ProjectCreate | ProjectUpdate) => {
    updateProject.mutate(values as ProjectUpdate, {
      onSuccess: () => {
        setShowEditProject(false);
        updateProject.reset();
      },
    });
  };

  const handleDeleteProject = () => {
    deleteProject.mutate(id, {
      onSuccess: () => {
        navigate('/projects');
      },
    });
  };

  const rootTasks = project.tasks.filter((t) => !t.parent_task_id);

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 font-medium text-slate-500 transition hover:text-brand-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Projects
          </Link>
        }
        title={project.name}
        description={project.description ?? undefined}
        meta={
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-slate-500">
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600 ring-1 ring-inset ring-slate-200/80">
              {project.slug}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Created {formatDate(project.created_at)}
            </span>
            <span className="hidden text-slate-300 sm:inline">·</span>
            <span>
              {rootTasks.length}{' '}
              {rootTasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
        }
        actions={
          <>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreateTask(true)}
            >
              New task
            </Button>
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                aria-label="Project options"
                onClick={() => setShowMenu((open) => !open)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              {showMenu && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-slate-900/5">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setShowEditProject(true);
                        setShowMenu(false);
                      }}
                    >
                      <Pencil className="h-4 w-4 text-slate-400" />
                      Edit project
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        setShowDeleteProject(true);
                        setShowMenu(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete project
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        }
      />

      <div className="page-body">
        {rootTasks.length > 0 && (
          <>
            <ProjectOverview tasks={rootTasks} />

            <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <SegmentedControl
                value={view}
                onChange={setView}
                options={[
                  {
                    value: 'kanban',
                    label: 'Board',
                    icon: <KanbanSquare className="h-4 w-4" />,
                  },
                  {
                    value: 'order',
                    label: 'Execution order',
                    icon: <ListOrdered className="h-4 w-4" />,
                  },
                ]}
              />
              {view === 'kanban' && (
                <p className="text-xs text-slate-400">
                  Drag tasks between columns to update status
                </p>
              )}
              {view === 'order' && (
                <p className="text-xs text-slate-400">
                  Topological order based on task dependencies
                </p>
              )}
            </div>
          </>
        )}

        {project.tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks yet"
            description="Create your first task to start planning this release."
            action={
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateTask(true)}
              >
                Add task
              </Button>
            }
          />
        ) : view === 'kanban' ? (
          <KanbanBoard
            tasks={rootTasks}
            onTaskClick={(task) => setEditingTask(task)}
            onStatusChange={handleStatusChange}
            onDelete={(taskId) => deleteTask.mutate(taskId)}
          />
        ) : orderLoading ? (
          <Spinner label="Computing execution order…" className="py-16" />
        ) : (
          <OrderedTaskList tasks={orderedTasks ?? []} />
        )}
      </div>

      <Modal
        open={showCreateTask}
        onClose={() => {
          setShowCreateTask(false);
          createTask.reset();
        }}
        title="New task"
        description={`Adding to ${project.name}`}
      >
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => setShowCreateTask(false)}
          loading={createTask.isPending}
          error={createTask.error}
          submitLabel="Create task"
        />
      </Modal>

      <Modal
        open={editingTask !== null}
        onClose={() => {
          setEditingTask(null);
          updateTask.reset();
        }}
        title="Edit task"
      >
        {editingTask && (
          <div className="space-y-6">
            <TaskForm
              initial={editingTask}
              onSubmit={handleEditTask}
              onCancel={() => setEditingTask(null)}
              loading={updateTask.isPending}
              error={updateTask.error}
              submitLabel="Save changes"
            />
            <DependenciesPanel
              task={editingTask}
              candidates={rootTasks}
            />
            {!editingTask.parent_task_id && (
              <SubtasksPanel task={editingTask} />
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={showEditProject}
        onClose={() => {
          setShowEditProject(false);
          updateProject.reset();
        }}
        title="Edit project"
      >
        <ProjectForm
          initial={project}
          onSubmit={handleEditProject}
          onCancel={() => setShowEditProject(false)}
          loading={updateProject.isPending}
          error={updateProject.error}
          submitLabel="Save changes"
        />
      </Modal>

      <ConfirmDialog
        open={showDeleteProject}
        title="Delete project?"
        description={`"${project.name}" and all its ${project.tasks.length} task(s) will be permanently removed.`}
        confirmLabel="Delete project"
        destructive
        loading={deleteProject.isPending}
        onConfirm={handleDeleteProject}
        onCancel={() => setShowDeleteProject(false)}
      />
    </>
  );
}
