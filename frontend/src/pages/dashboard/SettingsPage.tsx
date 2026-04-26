import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/stores/auth-store';
import { userService, type UpdateProfilePayload } from '@/services/user-service';

const profileSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo'),
  email: z.string().trim().email('Informe um email valido'),
});

const passwordSchema = z
  .object({
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas nao coincidem',
    path: ['confirmPassword'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const getInitials = (name?: string | null) => {
  if (!name) return 'AU';

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { notify } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema) as never,
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema) as never,
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  const avatarSrc = avatarPreview ?? user?.avatar ?? null;

  useEffect(() => {
    profileForm.reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
    });
    setAvatarPreview(null);
  }, [profileForm, user?.email, user?.name]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (!user) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">Carregando perfil...</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify({ title: 'Escolha um arquivo de imagem valido', variant: 'error' });
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify({ title: 'A imagem deve ter no maximo 5MB', variant: 'error' });
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((currentPreview) => {
      if (currentPreview) URL.revokeObjectURL(currentPreview);
      return previewUrl;
    });
    setIsUploading(true);

    try {
      const updatedUser = await userService.uploadAvatar(file);
      updateUser(updatedUser);
      notify({ title: 'Foto atualizada', variant: 'success' });
    } catch {
      notify({ title: 'Falha ao enviar foto', variant: 'error' });
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const onSubmitProfile = async (data: ProfileForm) => {
    setIsSavingProfile(true);
    const payload: UpdateProfilePayload = {
      name: data.name,
      email: data.email,
    };

    try {
      const updatedUser = await userService.updateMe(payload);
      updateUser(updatedUser);
      profileForm.reset({ name: updatedUser.name, email: updatedUser.email });
      notify({ title: 'Perfil atualizado', variant: 'success' });
    } catch {
      notify({ title: 'Falha ao atualizar perfil', variant: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    setIsSavingPassword(true);

    try {
      const updatedUser = await userService.updateMe({ password: data.password });
      updateUser(updatedUser);
      passwordForm.reset({ password: '', confirmPassword: '' });
      setIsPasswordModalOpen(false);
      notify({ title: 'Senha atualizada', variant: 'success' });
    } catch {
      notify({ title: 'Falha ao atualizar senha', variant: 'error' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <h1 className="text-2xl font-display font-bold text-brand-900">Configuracoes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie seus dados de perfil e acesso.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-5 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100 text-lg font-bold text-slate-600">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">{initials}</span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{user.role}</p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="border-slate-200"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Enviando...' : 'Alterar foto'}
              </Button>
              <p className="text-xs text-slate-500">PNG, JPG, GIF ou WebP ate 5MB.</p>
            </div>
          </div>

          <form
            onSubmit={profileForm.handleSubmit(onSubmitProfile as never)}
            className="space-y-5 p-5"
          >
            <div>
              <h3 className="font-semibold text-slate-900">Dados do perfil</h3>
              <p className="mt-1 text-sm text-slate-500">
                Nome e email sao salvos separados da senha.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  aria-invalid={!!profileForm.formState.errors.name}
                  className={profileForm.formState.errors.name ? 'border-red-400 focus-visible:ring-red-500' : ''}
                  {...profileForm.register('name')}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-red-500">{profileForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email de acesso</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!profileForm.formState.errors.email}
                  className={profileForm.formState.errors.email ? 'border-red-400 focus-visible:ring-red-500' : ''}
                  {...profileForm.register('email')}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-xs text-red-500">{profileForm.formState.errors.email.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Se alterar o email, use o novo endereco no proximo login.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => profileForm.reset({ name: user.name, email: user.email })}
                disabled={!profileForm.formState.isDirty || isSavingProfile}
              >
                Descartar
              </Button>
              <Button
                type="submit"
                disabled={!profileForm.formState.isDirty || isSavingProfile}
                className="bg-brand-900 text-white hover:bg-brand-800"
              >
                {isSavingProfile ? 'Salvando...' : 'Salvar alteracoes'}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Senha</h2>
              <p className="mt-1 text-sm text-slate-500">
                Defina uma nova senha para acessar sua conta.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="border-slate-200"
              onClick={() => setIsPasswordModalOpen(true)}
            >
              Alterar senha
            </Button>
          </div>
        </section>

        {isPasswordModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSavingPassword) {
                passwordForm.reset({ password: '', confirmPassword: '' });
                setIsPasswordModalOpen(false);
              }
            }}
          >
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 id="change-password-title" className="font-semibold text-slate-900">
                  Alterar senha
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  A troca de senha nao altera seu nome nem seu email.
                </p>
              </div>

              <div className="px-5 py-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Use pelo menos 6 caracteres e confirme a nova senha antes de salvar.
                </div>
              </div>

            <form
              onSubmit={passwordForm.handleSubmit(onSubmitPassword as never)}
                className="space-y-5 px-5 pb-5"
            >
                <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!passwordForm.formState.errors.password}
                    className={passwordForm.formState.errors.password ? 'border-red-400 focus-visible:ring-red-500' : ''}
                    {...passwordForm.register('password')}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-xs text-red-500">{passwordForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!passwordForm.formState.errors.confirmPassword}
                    className={passwordForm.formState.errors.confirmPassword ? 'border-red-400 focus-visible:ring-red-500' : ''}
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSavingPassword}
                  onClick={() => {
                    passwordForm.reset({ password: '', confirmPassword: '' });
                      setIsPasswordModalOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingPassword}
                  className="bg-brand-900 text-white hover:bg-brand-800"
                >
                  {isSavingPassword ? 'Atualizando...' : 'Atualizar senha'}
                </Button>
              </div>
            </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
