import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ListTodo, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DependenciesPanel } from '../components/DependenciesPanel';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { KanbanBoard } from '../components/KanbanBoard';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { ProjectForm } from '../components/ProjectForm';
import { Spinner } from '../components/Spinner';
import { TaskForm } from '../components/TaskForm';
import {
  useDeleteProject,
  useProject,
  useUpdateProject,
} from '../hooks/useProjects';
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from '../hooks/useTasks';
import type {
  ProjectCreate,
  ProjectUpdate,
  TaskCreate,
  TaskRead,
  TaskStatus,
  TaskUpdate,
} from '../types/api';
import { useNavigate } from 'react-router-dom';

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
  const [editingTask, setEditingTask] = useState<TaskRead | null>(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);

  if (!id) {
    return (
      <ErrorState title="Invalid project" error="Project ID is missing." />
    );
  }

  if (isLoading) {
    return <Spinner label="Loading project…" className="py-24" />;
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-7xl p-6">
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

  const handleStatusChange = (taskId: number, status: TaskStatus) => {
    updateTask.mutate({ taskId, payload: { status } });
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

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Projects
          </Link>
        }
        title={project.name}
        description={project.description ?? 'No description'}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Pencil className="h-4 w-4" />}
              onClick={() => setShowEditProject(true)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setShowDeleteProject(true)}
              className="text-rose-600 hover:bg-rose-50"
            >
              Delete
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreateTask(true)}
            >
              New task
            </Button>
          </>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {project.tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks yet"
            description="Create your first task to start planning this project."
            action={
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateTask(true)}
              >
                Add task
              </Button>
            }
          />
        ) : (
          <KanbanBoard
            tasks={project.tasks}
            onTaskClick={(task) => setEditingTask(task)}
            onStatusChange={handleStatusChange}
            onDelete={(taskId) => deleteTask.mutate(taskId)}
          />
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
              candidates={project.tasks}
            />
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
