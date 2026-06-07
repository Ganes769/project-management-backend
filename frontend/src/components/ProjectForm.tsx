import { useState } from 'react';
import { Button } from './Button';
import { Field, TextArea, TextInput } from './Field';
import type { ProjectCreate, ProjectRead, ProjectUpdate } from '../types/api';

interface ProjectFormProps {
  initial?: Pick<ProjectRead, 'name' | 'description'>;
  submitLabel?: string;
  loading?: boolean;
  error?: unknown;
  onSubmit: (values: ProjectCreate | ProjectUpdate) => void;
  onCancel?: () => void;
}

export function ProjectForm({
  initial,
  submitLabel = 'Save',
  loading,
  error,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [touched, setTouched] = useState(false);

  const nameError =
    touched && name.trim().length < 2
      ? 'Name must be at least 2 characters'
      : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (name.trim().length < 2) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field label="Name" htmlFor="project-name" required error={nameError}>
        <TextInput
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Payments revamp"
          autoFocus
        />
      </Field>

      <Field label="Description" htmlFor="project-description">
        <TextArea
          id="project-description"
          value={description ?? ''}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
        />
      </Field>

      {error instanceof Error && (
        <p className="text-sm text-rose-600">{error.message}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
