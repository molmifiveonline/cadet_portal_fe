import React from 'react';
import { Input } from '../ui/input';
import { getEmailValidationMessage } from '../../lib/utils/validationUtils';
import { errorTextClass, getInvalidFieldClass } from '../../lib/utils/formStyles';

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
  validate,
  sanitize,
  inputMode,
  maxLength,
  isEditing,
  register,
  errors,
}) => {
  const getValidation = () => {
    if (type !== 'email') return validate;

    return (inputValue) => {
      const emailMessage = getEmailValidationMessage(inputValue);
      if (emailMessage) return emailMessage;
      return validate ? validate(inputValue) : true;
    };
  };

  const getFieldRegistration = (extraOptions = {}) =>
    register(name, {
      required: required && !disabled ? `${label} is required` : false,
      ...extraOptions,
    });

  return (
    <div className={`flex flex-col gap-1.5 p-4 rounded-xl transition-all duration-300 group ${
      isEditing 
        ? 'bg-white border border-gray-200 shadow-sm' 
        : 'bg-gray-50/50 border border-gray-100/80 hover:bg-white hover:border-indigo-100 hover:shadow-sm'
    }`}>
      <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${
        isEditing ? 'text-gray-500' : 'text-gray-400'
      }`}>
        {Icon && <Icon size={14} className={`${isEditing ? 'text-gray-500' : 'text-gray-400'} group-hover:text-blue-600 transition-colors`} />}
        {label}{' '}
        {isEditing && required && <span className='text-red-500'>*</span>}
      </div>

      {isEditing && name ? (
        <div className='mt-1'>
          {type === 'select' ? (
            <select
              {...getFieldRegistration()}
              aria-invalid={errors[name] ? true : undefined}
              className={`w-full h-9 rounded-md border-2 border-gray-400 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${getInvalidFieldClass(errors[name])}`}
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
              {...getFieldRegistration()}
              aria-invalid={errors[name] ? true : undefined}
              className={`w-full rounded-md border-2 border-gray-400 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${getInvalidFieldClass(errors[name])}`}
            />
          ) : (() => {
            const inputRegistration = getFieldRegistration({
              validate: getValidation(),
            });

            return (
              <Input
                type={type === 'float' ? 'number' : type === 'email' ? 'text' : type}
                step={type === 'float' ? 'any' : step}
                inputMode={inputMode || (type === 'email' ? 'email' : undefined)}
                maxLength={maxLength}
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
                invalid={!!errors[name]}
                {...inputRegistration}
                onChange={(event) => {
                  if (sanitize) {
                    event.target.value = sanitize(event.target.value);
                  }
                  inputRegistration.onChange(event);
                }}
                className={`h-9 bg-white border-2 border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200' : ''}`}
              />
            );
          })()}
          {errors[name] && (
            <span className={`${errorTextClass} block`}>
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
