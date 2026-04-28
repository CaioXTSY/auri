import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ModalDialog } from '@/components/ui/modal-dialog';

interface ConfirmActionProps {
  open: boolean;
  title: string;
  description?: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  isConfirming?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmAction = ({
  open,
  title,
  description,
  body,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  isConfirming = false,
  onConfirm,
  onClose,
}: ConfirmActionProps) => {
  return (
    <ModalDialog
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={destructive ? 'bg-rose-600 text-white hover:bg-rose-700' : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-slate-600">{body}</div>
    </ModalDialog>
  );
};
