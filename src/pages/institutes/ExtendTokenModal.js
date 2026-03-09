import React, { useState } from 'react';
import { X, Loader2, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import api from '../../lib/utils/apiConfig';

const ExtendTokenModal = ({ isOpen, onClose, institute, onSuccess }) => {
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset to default when modal opens
  React.useEffect(() => {
    if (isOpen && institute) {
      const baseDate = institute.temp_expiry && new Date(institute.temp_expiry) > new Date() 
        ? new Date(institute.temp_expiry) 
        : new Date();
      baseDate.setDate(baseDate.getDate() + 7);
      setNewExpiryDate(baseDate.toISOString().split('T')[0]);
    }
  }, [isOpen, institute]);

  if (!isOpen || !institute) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newExpiryDate) {
      toast.error('Please select an expiry date');
      return;
    }

    const selectedDate = new Date(newExpiryDate);
    if (selectedDate <= new Date()) {
       toast.error('The new expiry date must be in the future');
       return;
    }

    setLoading(true);
    try {
      await api.put(`/institutes/${institute.id}/extend-token`, {
        newExpiryDate: newExpiryDate,
      });
      toast.success(
        `Token expiry extended to ${new Date(newExpiryDate).toLocaleDateString()} for ${institute.institute_name}`,
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to extend token',
      );
    } finally {
      setLoading(false);
    }
  };

  const currentExpiry = institute.temp_expiry
    ? new Date(institute.temp_expiry).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex justify-between items-start mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-50 rounded-lg'>
              <Clock className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-800'>
                Extend Token Expiry
              </h2>
              <p className='text-sm text-gray-500 mt-0.5 truncate max-w-[260px]'>
                {institute.institute_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Current expiry info */}
        <div className='mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex justify-between items-center'>
          <span>Current expiry:</span>
          <span className='font-semibold'>{currentExpiry}</span>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              New Expiry Date <span className='text-red-500'>*</span>
            </label>
            <Input
              type='date'
              min={new Date().toISOString().split('T')[0]} // Prevents selecting past dates
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              required
              className='cursor-pointer text-gray-700'
            />
            <p className='text-xs text-gray-400'>
              The token will expire at the end of the selected day.
            </p>
          </div>

          <div className='pt-2 flex justify-end gap-3'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-blue-600 hover:bg-blue-700 text-white'
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Saving…
                </>
              ) : (
                'Save Expiry'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendTokenModal;
