import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="page-container">
      <div className="container container--sm">
        <div className="text-center animate-fade-in">
          {/* 404 Icon */}
          <div style={{ fontSize: '6rem', marginBottom: 'var(--spacing-lg)' }}>
            🔍
          </div>

          {/* 404 Number */}
          <h1 style={{
            fontSize: '6rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-pink))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: '1',
            marginBottom: 'var(--spacing-md)'
          }}>
            404
          </h1>

          {/* Page Title */}
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: 'var(--spacing-md)'
          }}>
            Page Not Found
          </h2>

          {/* Description */}
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            marginBottom: 'var(--spacing-2xl)',
            maxWidth: '500px',
            margin: '0 auto var(--spacing-2xl)'
          }}>
            Oops! The page you're looking for doesn't exist.
            It might have been moved or deleted.
          </p>

          {/* Action Button */}
          <Link to="/" className="btn btn-primary btn-lg">
            🏠 Go Back Home
          </Link>

          {/* Additional Help */}
          <div style={{
            marginTop: 'var(--spacing-2xl)',
            padding: 'var(--spacing-lg)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              margin: '0'
            }}>
              Need help? Try starting from the <Link to="/" className="link">homepage</Link> or{' '}
              <Link to="/login" className="link">sign in</Link> to your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

