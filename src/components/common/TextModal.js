import React from 'react';
import { X } from 'lucide-react';

const TextModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl transform transition-all scale-100 relative m-4'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors'
        >
          <X className='w-5 h-5' />
        </button>
        <h3 className='text-lg font-bold text-gray-900 mb-4'>{title}</h3>
        <div className='text-gray-600 max-h-[60vh] overflow-y-auto whitespace-pre-wrap leading-relaxed'>
          {content}
        </div>
        <div className='mt-6 flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-100 to-gray-50 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextModal;
