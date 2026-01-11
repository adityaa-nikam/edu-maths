import React from 'react';

/**
 * Error Alert Component
 * Displays error messages in a styled alert box
 */
const ErrorAlert = ({ message, onClose, title = 'Error' }) => {
  if (!message) return null;

  return (
    <div style={{
      backgroundColor: '#fee',
      border: '1px solid #fcc',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--spacing-md)',
      marginBottom: 'var(--spacing-md)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--spacing-sm)',
    }}>
      <div style={{
        fontSize: '1.5rem',
        flexShrink: 0,
      }}>
        ❌
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{
          margin: '0 0 var(--spacing-xs) 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#c00',
        }}>
          {title}
        </h4>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          color: '#600',
          lineHeight: '1.5',
        }}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0',
            color: '#c00',
            flexShrink: 0,
          }}
          aria-label="Close error"
        >
          ×
        </button>
      )}
    </div>
  );
};

/**
 * Success Alert Component
 * Displays success messages in a styled alert box
 */
export const SuccessAlert = ({ message, onClose, title = 'Success' }) => {
  if (!message) return null;

  return (
    <div style={{
      backgroundColor: '#efe',
      border: '1px solid #cfc',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--spacing-md)',
      marginBottom: 'var(--spacing-md)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--spacing-sm)',
    }}>
      <div style={{
        fontSize: '1.5rem',
        flexShrink: 0,
      }}>
        ✅
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{
          margin: '0 0 var(--spacing-xs) 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#060',
        }}>
          {title}
        </h4>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          color: '#040',
          lineHeight: '1.5',
        }}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0',
            color: '#060',
            flexShrink: 0,
          }}
          aria-label="Close success message"
        >
          ×
        </button>
      )}
    </div>
  );
};

/**
 * Warning Alert Component
 * Displays warning messages in a styled alert box
 */
export const WarningAlert = ({ message, onClose, title = 'Warning' }) => {
  if (!message) return null;

  return (
    <div style={{
      backgroundColor: '#fff3cd',
      border: '1px solid #ffc107',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--spacing-md)',
      marginBottom: 'var(--spacing-md)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--spacing-sm)',
    }}>
      <div style={{
        fontSize: '1.5rem',
        flexShrink: 0,
      }}>
        ⚠️
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{
          margin: '0 0 var(--spacing-xs) 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#856404',
        }}>
          {title}
        </h4>
        <p style={{
          margin: 0,
          fontSize: '0.875rem',
          color: '#856404',
          lineHeight: '1.5',
        }}>
          {message}
        </p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0',
            color: '#856404',
            flexShrink: 0,
          }}
          aria-label="Close warning"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
