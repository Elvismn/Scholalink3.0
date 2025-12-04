import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  leftIcon,
  rightIcon,
  size = 'md',
  fullWidth = true,
  ...props
}, ref) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-5 py-3 text-base rounded-lg'
  };

  const inputClasses = `
    border bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
    ${sizes[size]}
    ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
    ${fullWidth ? 'w-full' : ''}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${className}
  `;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <div className={`flex items-center gap-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error && (
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
          <span>{error || helperText}</span>
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
