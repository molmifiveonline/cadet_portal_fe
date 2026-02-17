import React from 'react';
import { Input } from '../ui/input';

const DetailItem = ({
  label,
  value,
  icon: Icon,
  name,
  type = 'text',
  required = false,
  step,
  isEditing,
  register,
  errors,
}) => {
  return (
    <div className='flex flex-col gap-1 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors'>
      <div className='flex items-center gap-2 text-sm text-gray-500 font-medium'>
        {Icon && <Icon size={14} className='text-blue-500' />}
        {label}{' '}
        {isEditing && required && <span className='text-red-500'>*</span>}
      </div>

      {isEditing && name ? (
        <div className='mt-1'>
          <Input
            type={type}
            step={step}
            {...register(name, {
              required: required ? `${label} is required` : false,
            })}
            className={`h-9 bg-white ${errors[name] ? 'border-red-500' : ''}`}
          />
          {errors[name] && (
            <span className='text-red-500 text-xs mt-1 block'>
              {errors[name].message}
            </span>
          )}
        </div>
      ) : (
        <div className='text-gray-900 font-medium break-words mt-1'>
          {value || '-'}
        </div>
      )}
    </div>
  );
};

export default DetailItem;
