import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderPlus, Plus } from 'lucide-react';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { ProjectForm } from '../components/ProjectForm';
import { Spinner } from '../components/Spinner';
import { useCreateProject, useProjects } from '../hooks/useProjects';
import { formatDate } from '../lib/format';
import type { ProjectCreate, ProjectUpdate } from '../types/api';

export function ProjectsPage() {
  const { data, isLoading, error, refetch } = useProjects();
  const create = useCreateProject();
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = (values: ProjectCreate | ProjectUpdate) => {
    create.mutate(values as ProjectCreate, {
      onSuccess: () => {
        setShowCreate(false);
        create.reset();
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Group related tasks into deliverable projects."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
            New project
          </Button>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {isLoading && <Spinner label="Loading projects…" className="py-16" />}

        {error && (
          <ErrorState error={error} onRetry={() => void refetch()} />
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={FolderPlus}
            title="No projects yet"
            description="Create your first project to start tracking tasks."
            action={
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreate(true)}
              >
                Create project
              </Button>
            }
          />
        )}

        {data && data.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((project) => (
              <Link
                key={project.project_id}
                to={`/projects/${project.project_id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">
                    {project.name}
                  </h3>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                    {project.slug}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 min-h-[2.5em] text-sm text-slate-500">
                  {project.description || 'No description'}
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Created {formatDate(project.created_at)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          create.reset();
        }}
        title="New project"
        description="Give your project a clear, recognizable name."
      >
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={create.isPending}
          error={create.error}
          submitLabel="Create project"
        />
      </Modal>
    </>
  );
}
