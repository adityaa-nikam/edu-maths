import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { setTeacherData, getTeacherData, clearTeacherData } from '../utils/tokenStorage';
import { authAPI, academyAPI, teacherAPI } from '../services/api';

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider for Teacher Authentication (Clerk)
 * Manages teacher login state, academy info, and authentication
 */
export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  
  const [teacher, setTeacher] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Check if teacher has an existing academy in the backend
   * This is called when localStorage is empty after login
   */
  const checkForExistingAcademy = async (userId) => {
    try {
      // Strategy 1: Try to fetch teacher's exams - if this succeeds, teacher might have an academy
      const response = await teacherAPI.getAcademyExams();
      
      // If we get exams data, extract academy info
      if (response && response.exams && response.exams.length > 0) {
        // Get academy slug from the first exam (if available in response)
        const firstExam = response.exams[0];
        if (firstExam.academySlug) {
          // Fetch full academy details
          const academyResponse = await academyAPI.getBySlug(firstExam.academySlug);
          if (academyResponse.academy) {
            setAcademy(academyResponse.academy);
            localStorage.setItem(`teacher_academy_${userId}`, JSON.stringify(academyResponse.academy));
            console.log('✅ Found existing academy from backend:', academyResponse.academy.slug);
            return;
          }
        }
      }
      
      // Strategy 2: Try to create with dummy data to trigger 409 if academy exists
      // This will fail validation but if teacher has academy, backend returns it
      try {
        await academyAPI.create({
          name: 'dummy-check',
          slug: 'dummy-check-' + Date.now(),
        });
      } catch (createError) {
        // If 409 with existing academy, store it
        if (createError.status === 409 && createError.data?.existingAcademy) {
          const existingAcademy = createError.data.existingAcademy;
          setAcademy(existingAcademy);
          localStorage.setItem(`teacher_academy_${userId}`, JSON.stringify(existingAcademy));
          console.log('✅ Found existing academy via 409:', existingAcademy.slug);
          return;
        }
      }
    } catch (error) {
      // If this fails, it likely means teacher doesn't have an academy yet
      console.log('ℹ️ No existing academy found in backend');
    }
  };

  // Initialize teacher data on mount or when Clerk auth changes
  useEffect(() => {
    const initializeAuth = async () => {
      if (!isLoaded) {
        return; // Wait for Clerk to load
      }

      if (isSignedIn && user) {
        // Teacher is signed in with Clerk
        try {
          // Verify token with backend
          const response = await authAPI.verifyMe();
          
          if (response.success) {
            const teacherData = {
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              firstName: user.firstName,
              lastName: user.lastName,
              imageUrl: user.imageUrl,
              userId: response.userId,
            };

            setTeacher(teacherData);
            setTeacherData(teacherData);

            // Clear any old academy data from different users
            // Check all localStorage keys for teacher_academy_*
            const allKeys = Object.keys(localStorage);
            const academyKeys = allKeys.filter(key => key.startsWith('teacher_academy_'));
            academyKeys.forEach(key => {
              if (key !== `teacher_academy_${user.id}`) {
                localStorage.removeItem(key);
              }
            });

            // Try to fetch teacher's academy using user-specific key
            const userAcademyKey = `teacher_academy_${user.id}`;
            const storedAcademy = localStorage.getItem(userAcademyKey);
            if (storedAcademy) {
              try {
                const parsedAcademy = JSON.parse(storedAcademy);
                setAcademy(parsedAcademy);
              } catch (err) {
                console.error('Failed to parse stored academy:', err);
                localStorage.removeItem(userAcademyKey);
              }
            } else {
              // No academy in localStorage - check backend to see if teacher has one
              await checkForExistingAcademy(user.id);
            }
          }
        } catch (error) {
          console.error('❌ Failed to verify teacher:', error);
          // If verification fails, sign out
          await handleSignOut();
        }
      } else {
        // Not signed in - check if we have cached data
        const cachedTeacher = getTeacherData();
        if (cachedTeacher) {
          // User was previously logged in but Clerk session expired
          console.warn('⚠️ Cached teacher data found but no Clerk session');
          clearTeacherData();
        }
        setTeacher(null);
        setAcademy(null);
      }

      setLoading(false);
    };

    initializeAuth();
  }, [isLoaded, isSignedIn, user]);

  /**
   * Sign out teacher
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      clearTeacherData();
      
      // Clear user-specific academy data
      if (user?.id) {
        localStorage.removeItem(`teacher_academy_${user.id}`);
      }
      
      // Also clear old non-user-specific key (for backward compatibility)
      localStorage.removeItem('teacher_academy');
      
      setTeacher(null);
      setAcademy(null);
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  /**
   * Create academy for teacher
   */
  const createAcademy = async (academyData) => {
    try {
      const response = await academyAPI.create(academyData);
      
      if (response.academy) {
        setAcademy(response.academy);
        
        // Store with user-specific key
        if (user?.id) {
          localStorage.setItem(`teacher_academy_${user.id}`, JSON.stringify(response.academy));
        }
        
        return { success: true, academy: response.academy };
      }
      
      return { success: false, message: 'Failed to create academy' };
    } catch (error) {
      console.error('❌ Create academy error:', error);
      
      // Check if error is 409 (already has academy) and contains existing academy
      if (error.status === 409 && error.data?.existingAcademy) {
        const existingAcademy = error.data.existingAcademy;
        
        // Store the existing academy
        setAcademy(existingAcademy);
        if (user?.id) {
          localStorage.setItem(`teacher_academy_${user.id}`, JSON.stringify(existingAcademy));
        }
        
        return { 
          success: false,
          alreadyExists: true,
          academy: existingAcademy,
          message: error.message || 'You already have an academy'
        };
      }
      
      return { 
        success: false, 
        message: error.message || 'Failed to create academy' 
      };
    }
  };

  /**
   * Fetch academy by slug and set it
   */
  const fetchAcademy = async (slug) => {
    try {
      const response = await academyAPI.getBySlug(slug);
      
      if (response.academy) {
        setAcademy(response.academy);
        
        // Store with user-specific key
        if (user?.id) {
          localStorage.setItem(`teacher_academy_${user.id}`, JSON.stringify(response.academy));
        }
        
        return { success: true, academy: response.academy };
      }
      
      return { success: false, message: 'Academy not found' };
    } catch (error) {
      console.error('❌ Fetch academy error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to fetch academy' 
      };
    }
  };

  /**
   * Check if teacher has an academy
   */
  const hasAcademy = () => {
    return academy !== null;
  };

  /**
   * Get teacher's Clerk token
   */
  const getToken = async () => {
    try {
      if (window.Clerk && window.Clerk.session) {
        return await window.Clerk.session.getToken();
      }
      return null;
    } catch (error) {
      console.error('❌ Get token error:', error);
      return null;
    }
  };

  const value = {
    // Auth state
    teacher,
    academy,
    isAuthenticated: isSignedIn && !!teacher,
    loading: loading || !isLoaded,
    
    // Clerk user info
    clerkUser: user,
    isSignedIn,
    
    // Methods
    signOut: handleSignOut,
    createAcademy,
    fetchAcademy,
    hasAcademy,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
