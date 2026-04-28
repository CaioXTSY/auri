import type { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ModalDialog } from '@/components/ui/modal-dialog';

export interface PasswordSettingsFormValues {
  password: string;
  confirmPassword: string;
}

interface PasswordSettingsDialogProps {
  open: boolean;
  isSaving: boolean;
  form: UseFormReturn<PasswordSettingsFormValues>;
  onClose: () => void;
  onSubmit: (data: PasswordSettingsFormValues) => void | Promise<void>;
}

export const PasswordSettingsDialog = ({
  open,
  isSaving,
  form,
  onClose,
  onSubmit,
}: PasswordSettingsDialogProps) => {
  return (
    <ModalDialog
      open={open}
      title="Alterar senha"
      description="A troca de senha não altera seu nome nem seu email."
      onClose={() => {
        if (isSaving) return;
        onClose();
      }}
      panelClassName="max-w-md"
      initialFocusSelector="#password"
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Use pelo menos 6 caracteres e confirme a nova senha antes de salvar.
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-5">
            <Field htmlFor="password" label="Nova senha" error={form.formState.errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!form.formState.errors.password}
                className={
                  form.formState.errors.password ? 'border-red-400 focus-visible:ring-red-500' : ''
                }
                {...form.register('password')}
              />
            </Field>

            <Field
              htmlFor="confirmPassword"
              label="Confirmar nova senha"
              error={form.formState.errors.confirmPassword?.message}
            >
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!form.formState.errors.confirmPassword}
                className={
                  form.formState.errors.confirmPassword
                    ? 'border-red-400 focus-visible:ring-red-500'
                    : ''
                }
                {...form.register('confirmPassword')}
              />
            </Field>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" disabled={isSaving} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-brand-900 text-white hover:bg-brand-800"
            >
              {isSaving ? 'Atualizando...' : 'Atualizar senha'}
            </Button>
          </div>
        </form>
      </div>
    </ModalDialog>
  );
};
