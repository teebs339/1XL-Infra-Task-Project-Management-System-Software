import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'}`}>
          <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-red-500' : 'text-amber-500'}`} />
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
              variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
