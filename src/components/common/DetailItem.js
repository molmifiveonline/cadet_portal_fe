import React from 'react';
import { Input } from '../ui/input';

const DetailItem = ({
  label,
  value,
  icon: Icon,
  name,
  type = 'text',
  options = [],
  required = false,
  step,
  placeholder,
  disabled = false,
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
          {type === 'select' ? (
            <select
              {...register(name, {
                required: required ? `${label} is required` : false,
              })}
              className={`w-full h-9 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${errors[name] ? 'border-red-500' : ''}`}
            >
              <option value=''>Select {label}</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              placeholder={placeholder || `Enter ${label}`}
              disabled={disabled}
              rows={3}
              {...register(name, {
                required:
                  required && !disabled ? `${label} is required` : false,
              })}
              className={`w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${errors[name] ? 'border-red-500' : ''}`}
            />
          ) : (
            <Input
              type={type === 'float' ? 'number' : type}
              step={type === 'float' ? 'any' : step}
              onKeyDown={(e) => {
                if (e.key === '%') {
                  e.preventDefault();
                }
                if (type === 'float' && ['e', 'E', '-', '+'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const pastedText = e.clipboardData.getData('text');
                if (pastedText.includes('%')) {
                  e.preventDefault();
                  const cleanText = pastedText.replace(/%/g, '');
                  const nativeInputValueSetter =
                    Object.getOwnPropertyDescriptor(
                      window.HTMLInputElement.prototype,
                      'value',
                    ).set;
                  nativeInputValueSetter.call(e.target, cleanText);
                  e.target.dispatchEvent(new Event('input', { bubbles: true }));
                }
              }}
              placeholder={placeholder || `Enter ${label}`}
              disabled={disabled}
              {...register(name, {
                required:
                  required && !disabled ? `${label} is required` : false,
              })}
              className={`h-9 bg-white ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${errors[name] ? 'border-red-500' : ''}`}
            />
          )}
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
