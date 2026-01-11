import React from 'react';

/**
 * Empty State Component
 * Displays when there's no data to show
 */
const EmptyState = ({ 
  icon = '📋', 
  title = 'No data available', 
  message = '', 
  actionLabel = null,
  onAction = null 
}) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: 'var(--spacing-3xl) var(--spacing-xl)',
      color: 'var(--text-muted)',
    }}>
      <div style={{ 
        fontSize: '3rem', 
        marginBottom: 'var(--spacing-md)' 
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: 'var(--spacing-sm)',
        color: 'var(--text-secondary)',
      }}>
        {title}
      </h3>
      {message && (
        <p style={{ 
          fontSize: '1rem',
          marginBottom: actionLabel ? 'var(--spacing-lg)' : '0',
          color: 'var(--text-muted)',
        }}>
          {message}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary"
          style={{ marginTop: 'var(--spacing-md)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
