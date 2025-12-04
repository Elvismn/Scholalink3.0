// This is a wrapper for Sonner toast notifications
// Since you already have sonner installed, we'll create a custom hook

import { toast } from 'sonner';

const Toast = () => null; // Component not needed, using hook approach

// Custom toast functions
export const showToast = {
  success: (message, description = '') => {
    toast.success(message, {
      description,
      duration: 4000,
    });
  },
  
  error: (message, description = '') => {
    toast.error(message, {
      description,
      duration: 6000,
    });
  },
  
  warning: (message, description = '') => {
    toast.warning(message, {
      description,
      duration: 5000,
    });
  },
  
  info: (message, description = '') => {
    toast.info(message, {
      description,
      duration: 4000,
    });
  },
  
  loading: (message, description = '') => {
    return toast.loading(message, {
      description,
    });
  },
  
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
  
  promise: (promise, messages) => {
    return toast.promise(promise, messages);
  }
};

export default Toast;
