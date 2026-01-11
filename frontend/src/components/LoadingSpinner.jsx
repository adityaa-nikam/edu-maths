import React from 'react';

/**
 * Loading Spinner Component
 * Displays a centered loading spinner with optional message
 */
const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  const containerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 9999,
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--spacing-3xl)',
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '4px solid var(--bg-primary)',
          borderTopColor: 'var(--primary-purple)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto var(--spacing-md)',
        }} />
        {message && (
          <p style={{ 
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            margin: 0,
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
