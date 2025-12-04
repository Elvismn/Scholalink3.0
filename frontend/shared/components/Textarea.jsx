import React, { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 4,
  resize = true,
  ...props
}, ref) => {
  const textareaClasses = `
    block w-full border bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200
    ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
    ${resize ? '' : 'resize-none'}
    px-4 py-2.5 text-sm rounded-lg
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
      
      <textarea
        ref={ref}
        rows={rows}
        className={textareaClasses}
        {...props}
      />
      
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

Textarea.displayName = 'Textarea';

export default Textarea;
