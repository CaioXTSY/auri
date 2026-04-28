import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { SectionCard } from '@/components/ui/section-card';

export interface ProfileDetailsFormValues {
  name: string;
  email: string;
}

interface ProfileDetailsFormProps {
  form: UseFormReturn<ProfileDetailsFormValues>;
  isSaving: boolean;
  userName: string;
  userEmail: string;
  onSubmit: (data: ProfileDetailsFormValues) => void | Promise<void>;
}

export const ProfileDetailsForm = ({
  form,
  isSaving,
  userName,
  userEmail,
  onSubmit,
}: ProfileDetailsFormProps) => {
  return (
    <SectionCard>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 p-5">
        <div>
          <h3 className="font-semibold text-slate-900">Dados do perfil</h3>
          <p className="mt-1 text-sm text-slate-500">
            Nome e email são salvos separados da senha.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field htmlFor="name" label="Nome completo" error={form.formState.errors.name?.message}>
            <Input
              id="name"
              autoComplete="name"
              aria-invalid={!!form.formState.errors.name}
              className={
                form.formState.errors.name ? 'border-red-400 focus-visible:ring-red-500' : ''
              }
              {...form.register('name')}
            />
          </Field>

          <Field
            htmlFor="email"
            label="Email de acesso"
            description="Se alterar o email, use o novo endereço no próximo login."
            error={form.formState.errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!form.formState.errors.email}
              className={
                form.formState.errors.email ? 'border-red-400 focus-visible:ring-red-500' : ''
              }
              {...form.register('email')}
            />
          </Field>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => form.reset({ name: userName, email: userEmail })}
            disabled={!form.formState.isDirty || isSaving}
          >
            Descartar
          </Button>
          <Button
            type="submit"
            disabled={!form.formState.isDirty || isSaving}
            className="bg-brand-900 text-white hover:bg-brand-800"
          >
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
};
