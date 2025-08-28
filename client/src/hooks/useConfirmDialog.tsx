import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  isOpen: boolean;
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    onConfirm: () => {},
  });

  const showConfirmDialog = (
    options: ConfirmDialogOptions,
    onConfirm: () => void
  ) => {
    setDialogState({
      ...options,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'default',
      isOpen: true,
      onConfirm,
    });
  };

  const handleConfirm = () => {
    dialogState.onConfirm();
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  const ConfirmDialog = () => (
    <AlertDialog open={dialogState.isOpen} onOpenChange={handleCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogState.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogState.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {dialogState.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              dialogState.variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
                : ''
            }
          >
            {dialogState.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    showConfirmDialog,
    ConfirmDialog,
  };
}
