import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStudentAuth } from '../contexts/StudentAuthContext';

/**
 * Protected Route Component
 * Protects routes that require authentication
 * 
 * Usage:
 * <ProtectedRoute type="teacher">
 *   <TeacherDashboard />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children, type = 'teacher', requireAcademy = false }) => {
  const location = useLocation();
  const { isAuthenticated: isTeacherAuth, loading: teacherLoading, hasAcademy } = useAuth();
  const { isAuthenticated: isStudentAuth, loading: studentLoading } = useStudentAuth();

  // Show loading state while checking authentication
  if (type === 'teacher' && teacherLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
      }}>
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
          <p style={{ color: 'var(--text-secondary)' }}>Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (type === 'student' && studentLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-secondary)',
      }}>
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
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Check teacher authentication
  if (type === 'teacher') {
    if (!isTeacherAuth) {
      // Not authenticated - redirect to teacher login
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if academy is required but not present
    if (requireAcademy && !hasAcademy()) {
      // Redirect to academy creation
      return <Navigate to="/create-academy" state={{ from: location }} replace />;
    }

    // Authenticated and has academy (if required)
    return children;
  }

  // Check student authentication
  if (type === 'student') {
    if (!isStudentAuth) {
      // Not authenticated - redirect to student login
      // Extract academy slug from current path
      const pathParts = location.pathname.split('/');
      const academySlug = pathParts[1] || '';
      
      return <Navigate to={`/${academySlug}/login`} state={{ from: location }} replace />;
    }

    // Authenticated
    return children;
  }

  // Default - allow access
  return children;
};

export default ProtectedRoute;
