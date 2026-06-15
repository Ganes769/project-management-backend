import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FolderKanban, Plus, Sparkles } from 'lucide-react';
import { AiNewProjectModal } from '../components/AiNewProjectModal';
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
  const [showAiCreate, setShowAiCreate] = useState(false);

  const handleCreate = (values: ProjectCreate | ProjectUpdate) => {
    create.mutate(values as ProjectCreate, {
      onSuccess: () => {
        setShowCreate(false);
        create.reset();
      },
    });
  };

  const projectCount = data?.length ?? 0;

  return (
    <>
      <PageHeader
        title="Projects"
        description="Plan releases, track dependencies, and ship with confidence."
        meta={
          !isLoading && data ? (
            <p className="text-sm text-slate-500">
              {projectCount === 0
                ? 'No active projects'
                : `${projectCount} active ${projectCount === 1 ? 'project' : 'projects'}`}
            </p>
          ) : undefined
        }
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Sparkles className="h-4 w-4" />}
              onClick={() => setShowAiCreate(true)}
            >
              Create with AI
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreate(true)}
            >
              New project
            </Button>
          </>
        }
      />

      <div className="page-body">
        {isLoading && <Spinner label="Loading projects…" className="py-20" />}

        {error && (
          <ErrorState error={error} onRetry={() => void refetch()} />
        )}

        {data && data.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project manually, or let AI draft a full task plan from a brief."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="secondary"
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  onClick={() => setShowAiCreate(true)}
                >
                  Create with AI
                </Button>
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowCreate(true)}
                >
                  New project
                </Button>
              </div>
            }
          />
        )}

        {data && data.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((project) => (
              <Link
                key={project.project_id}
                to={`/projects/${project.project_id}`}
                className="group card-hover flex flex-col overflow-hidden"
              >
                <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-400 opacity-80 transition group-hover:opacity-100" />

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-500 ring-1 ring-inset ring-slate-200/60">
                      {project.slug}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
                    {project.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 min-h-[2.75rem] flex-1 text-sm leading-relaxed text-slate-500">
                    {project.description || 'No description yet.'}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">
                      Created {formatDate(project.created_at)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition group-hover:gap-1.5">
                      Open project
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
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

      <AiNewProjectModal
        open={showAiCreate}
        onClose={() => setShowAiCreate(false)}
      />
    </>
  );
}
