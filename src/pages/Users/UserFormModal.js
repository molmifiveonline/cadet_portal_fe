import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const UserFormModal = ({
  isOpen,
  onClose,
  title,
  formData,
  handleInputChange,
  handleRoleChange,
  handleSubmit,
  submitLoading,
  submitButtonText,
  isEdit = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-white rounded-xl shadow-xl w-full max-w-md p-6'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-xl font-semibold'>{title}</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                First Name
              </label>
              <Input
                name='first_name'
                type='text'
                placeholder='John'
                value={formData.first_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Last Name
              </label>
              <Input
                name='last_name'
                type='text'
                placeholder='Doe'
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Email</label>
            <Input
              name='email'
              type='email'
              placeholder='user@example.com'
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>
              {isEdit ? 'Password (leave blank to keep current)' : 'Password'}
            </label>
            <Input
              name='password'
              type='password'
              placeholder='••••••••'
              value={formData.password}
              onChange={handleInputChange}
              required={!isEdit}
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Role</label>
            <Select onValueChange={handleRoleChange} value={formData.role}>
              <SelectTrigger>
                <SelectValue placeholder='Select a role' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='SuperAdmin'>SuperAdmin</SelectItem>
                <SelectItem value='Trainer'>Trainer</SelectItem>
                <SelectItem value='Candidate'>Candidate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='pt-4 flex justify-end gap-3'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-[#3a5f9e] hover:bg-[#325186] text-white'
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />{' '}
                  Processing...
                </>
              ) : (
                submitButtonText || (isEdit ? 'Update User' : 'Create User')
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
