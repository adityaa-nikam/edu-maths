import { toast } from 'react-toastify';

/**
 * Toast Notification Utilities
 * Wrapper around react-toastify for consistent notifications
 */

// Success notification
export const showSuccess = (message) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Error notification
export const showError = (message) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Info notification
export const showInfo = (message) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Warning notification
export const showWarning = (message) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 3500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Loading notification (returns toast ID for later update)
export const showLoading = (message = 'Loading...') => {
  return toast.loading(message, {
    position: "top-right",
  });
};

// Update loading notification to success
export const updateToSuccess = (toastId, message) => {
  toast.update(toastId, {
    render: message,
    type: 'success',
    isLoading: false,
    autoClose: 3000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Update loading notification to error
export const updateToError = (toastId, message) => {
  toast.update(toastId, {
    render: message,
    type: 'error',
    isLoading: false,
    autoClose: 4000,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Dismiss a specific toast
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// Dismiss all toasts
export const dismissAll = () => {
  toast.dismiss();
};

export default {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  updateToSuccess,
  updateToError,
  dismiss: dismissToast,
  dismissAll,
};
