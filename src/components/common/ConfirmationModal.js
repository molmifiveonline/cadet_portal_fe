import React from 'react';
import { X } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-[#3a5f9e] hover:bg-[#325186] shadow-[#3a5f9e]/20',
  isLoading = false,
  confirmDisabled = false,
  maxWidthClass = 'max-w-sm',
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white p-6 ${maxWidthClass} shadow-xl transform transition-all scale-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type='button'
          aria-label={`Close ${title}`}
          onClick={onClose}
          disabled={isLoading}
          className='absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border border-[#3a5f9e]/20 bg-[#3a5f9e]/10 text-[#3a5f9e] shadow-sm transition hover:border-[#3a5f9e] hover:bg-[#3a5f9e] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#3a5f9e]/30 focus:ring-offset-2 disabled:opacity-50'
        >
          <X className='h-6 w-6' strokeWidth={2.5} />
        </button>
        <h3 className='mb-2 pr-12 text-lg font-bold text-gray-900'>{title}</h3>
        {message && <p className='text-gray-500 mb-4'>{message}</p>}
        {children && <div className='mb-6'>{children}</div>}
        <div className='flex justify-end gap-3'>
          <button
            onClick={onClose}
            disabled={isLoading}
            className='px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors disabled:opacity-50'
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors shadow-lg disabled:opacity-50 ${confirmButtonClass}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
