import React, { useEffect } from 'react';
import { SignUp, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TeacherSignup = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { hasAcademy, academy, loading } = useAuth();

  // Redirect logged-in teachers to their dashboard
  useEffect(() => {
    // Wait for auth to finish loading before redirecting
    if (loading) return;
    
    if (isSignedIn && hasAcademy() && academy) {
      navigate(`/${academy.slug}/dashboard`, { replace: true });
    } else if (isSignedIn && !hasAcademy()) {
      navigate('/create-academy', { replace: true });
    }
  }, [isSignedIn, hasAcademy, academy, navigate, loading]);

  return (
    <div className="page-container">
      <div className="container container--sm">
        <div className="card animate-fade-in" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--spacing-2xl)'
        }}>
          {/* Page Title */}
          <h1 className="page-title" style={{ textAlign: 'center' }}>Create Your Account</h1>
          <p className="page-subtitle" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
            Join EduMaths and start teaching today
          </p>

          {/* Clerk Sign Up Component */}
          <SignUp
            routing="path"
            path="/signup"
            signInUrl="/login"
            appearance={{
              elements: {
                rootBox: {
                  width: '100%',
                },
                card: {
                  boxShadow: 'none',
                  border: 'none',
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherSignup;
