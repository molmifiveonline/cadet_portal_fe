import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { errorTextClass } from '../../lib/utils/formStyles';

const RoleModal = ({ isOpen, onClose, onSave, role = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        display_name: role.display_name || '',
        description: role.description || '',
      });
    } else {
      setFormData({
        name: '',
        display_name: '',
        description: '',
      });
    }
    setErrors({});
  }, [role, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = {};
    if (!role && !formData.name.trim()) {
      nextErrors.name = 'Role system name is required';
    }
    if (!formData.display_name.trim()) {
      nextErrors.display_name = 'Display name is required';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200'>
      <div className='bg-white rounded-[24px] shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200'>
        <div className='px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50'>
          <h2 className='text-xl font-bold text-gray-900'>
            {role ? 'Edit Role' : 'Add New Role'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500'
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className='p-6 space-y-5'>
          {!role && (
            <div className='space-y-2'>
              <label className='text-sm font-semibold text-gray-700'>
                Role System Name <span className='text-red-500'>*</span>
              </label>
              <Input
                placeholder='e.g. HR_Manager'
                value={formData.name}
                onChange={(e) => {
                  setErrors((prev) => ({ ...prev, name: '' }));
                  setFormData({ ...formData, name: e.target.value });
                }}
                invalid={!!errors.name}
                className='h-11 rounded-xl'
              />
              {errors.name && (
                <p className={errorTextClass}>{errors.name}</p>
              )}
              <p className='text-[11px] text-gray-500'>
                Unique identifier for the role. No spaces or special characters.
              </p>
            </div>
          )}

          <div className='space-y-2'>
            <label className='text-sm font-semibold text-gray-700'>
              Display Name <span className='text-red-500'>*</span>
            </label>
            <Input
              placeholder='e.g. HR Manager'
              value={formData.display_name}
              onChange={(e) => {
                setErrors((prev) => ({ ...prev, display_name: '' }));
                setFormData({ ...formData, display_name: e.target.value });
              }}
              invalid={!!errors.display_name}
              className='h-11 rounded-xl'
            />
            {errors.display_name && (
              <p className={errorTextClass}>{errors.display_name}</p>
            )}
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-semibold text-gray-700'>
              Description
            </label>
            <textarea
              placeholder='Short description of role responsibilities'
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className='w-full min-h-[100px] p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm outline-none resize-none'
            />
          </div>

          <div className='flex items-center gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              className='flex-1 h-11 rounded-xl font-semibold border-gray-200'
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={loading}
              className='flex-1 h-11 rounded-xl font-semibold bg-[#3a5f9e] hover:bg-[#325186] text-white shadow-lg shadow-blue-500/20'
            >
              {loading ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : role ? (
                'Update Role'
              ) : (
                'Create Role'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleModal;
