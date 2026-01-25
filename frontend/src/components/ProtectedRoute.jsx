import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStudentAuth } from '../contexts/StudentAuthContext';
import { useUser } from '@clerk/clerk-react';

/**
 * Protected Route Component
 * Protects routes that require authentication
 * 
 * Usage:
 * <ProtectedRoute type="teacher" validateSlug={true}>
 *   <TeacherDashboard />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ children, type = 'teacher', requireAcademy = false, validateSlug = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { academySlug } = useParams();
  const { user } = useUser();
  const { isAuthenticated: isTeacherAuth, loading: teacherLoading, hasAcademy, academy } = useAuth();
  const { isAuthenticated: isStudentAuth, loading: studentLoading } = useStudentAuth();


  // Validate academy slug for teachers
  useEffect(() => {
    // Wait for academy data to load
    if (type === 'teacher' && validateSlug && academy && academySlug) {
      const teacherAcademySlug = academy.slug;
      
      console.log('=== Validating Academy Slug ===');
      console.log('URL slug:', academySlug);
      console.log('Teacher academy slug:', teacherAcademySlug);

      if (teacherAcademySlug && academySlug !== teacherAcademySlug) {
        console.log('🚨 MISMATCH DETECTED - Redirecting to correct academy...');
        
        // Replace the slug in the current path
        const pathParts = location.pathname.split('/');
        pathParts[1] = teacherAcademySlug; // Replace slug at index 1
        const correctedPath = pathParts.join('/');
        
        console.log('Redirecting from:', location.pathname);
        console.log('Redirecting to:', correctedPath);
        
        navigate(correctedPath, { replace: true });
      } else {
        console.log('✅ Slug validation passed');
      }
    }
  }, [academySlug, academy, navigate, location.pathname, type, validateSlug]);


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
