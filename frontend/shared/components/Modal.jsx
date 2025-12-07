import React, { Fragment } from 'react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className = '',
  closeOnBackdropClick = true
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking directly on the backdrop
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle click on modal content - only stop propagation for certain elements
  const handleModalContentClick = (e) => {
    // Don't stop propagation for select elements (dropdowns)
    if (e.target.tagName === 'SELECT' || 
        e.target.tagName === 'OPTION' ||
        e.target.closest('select')) {
      return; // Let select clicks bubble up normally
    }
    
    // Only stop propagation for other elements to prevent backdrop click
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`w-full bg-white rounded-2xl shadow-xl transform transition-all ${sizes[size]} ${className}`}
          onClick={handleModalContentClick}  // ← Updated handler
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b">
              {title && (
                <div className="text-lg font-semibold text-gray-900">
                  {title}
                </div>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  // No stopPropagation needed here - we want this click to work
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;