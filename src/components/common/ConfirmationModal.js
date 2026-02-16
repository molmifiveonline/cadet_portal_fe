import React from 'react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        className='bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl transform transition-all scale-100'
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className='text-lg font-bold text-gray-900 mb-2'>{title}</h3>
        <p className='text-gray-500 mb-6'>{message}</p>
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
            disabled={isLoading}
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
