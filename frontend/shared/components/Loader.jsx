import React from 'react';

const Loader = ({
  size = 'md',
  color = 'blue',
  fullScreen = false,
  text,
  className = ''
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colors = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white',
    red: 'border-red-600',
    green: 'border-green-600'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          animate-spin rounded-full border-2 border-t-transparent
          ${sizes[size]}
          ${colors[color]}
        `}
      />
      {text && (
        <div className={`mt-3 text-sm font-medium ${color === 'white' ? 'text-white' : 'text-gray-700'}`}>
          {text}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loader;
