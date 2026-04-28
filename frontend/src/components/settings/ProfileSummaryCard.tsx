import type { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/ui/section-card';

interface ProfileSummaryCardProps {
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarSrc: string | null;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onAvatarChange: (event: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
}

export const ProfileSummaryCard = ({
  name,
  email,
  role,
  initials,
  avatarSrc,
  isUploading,
  fileInputRef,
  onAvatarChange,
}: ProfileSummaryCardProps) => {
  return (
    <SectionCard>
      <div className="flex flex-col gap-5 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-100 text-lg font-bold text-slate-600">
            {avatarSrc ? (
              <img src={avatarSrc} alt={name} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center">{initials}</span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">{name}</h2>
            <p className="text-sm text-slate-500">{email}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{role}</p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={onAvatarChange}
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
    </SectionCard>
  );
};
