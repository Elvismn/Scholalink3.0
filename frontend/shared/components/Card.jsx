import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  padding = true,
  className = '',
  hover = false,
  border = true,
  shadow = 'md'
}) => {
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  return (
    <div
      className={`
        bg-white rounded-xl
        ${shadowClasses[shadow]}
        ${border ? 'border border-gray-200' : ''}
        ${hover ? 'hover:shadow-lg transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {(title || subtitle || actions) && (
        <div className={`
          flex items-center justify-between
          ${padding ? 'px-6 py-4' : 'p-0'}
          ${(title || subtitle) ? 'border-b border-gray-200' : ''}
        `}>
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className={padding ? 'p-6' : 'p-0'}>
        {children}
      </div>
    </div>
  );
};

export default Card;
