/**
 * Token Storage Utility
 * Manages JWT tokens in localStorage for both teachers (Clerk) and students (custom JWT)
 */

// Storage keys
const TEACHER_TOKEN_KEY = 'clerk_token';
const STUDENT_TOKEN_KEY = 'student_token';
const STUDENT_DATA_KEY = 'student_data';
const TEACHER_DATA_KEY = 'teacher_data';

// ============================================
// TEACHER TOKEN MANAGEMENT (Clerk)
// ============================================

/**
 * Get teacher token from Clerk session
 * Returns promise that resolves to token string or null
 */
export const getTeacherToken = async () => {
  try {
    // Check if Clerk is available globally
    if (window.Clerk && window.Clerk.session) {
      const token = await window.Clerk.session.getToken();
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting teacher token:', error);
    return null;
  }
};

/**
 * Store teacher data in localStorage
 */
export const setTeacherData = (data) => {
  try {
    localStorage.setItem(TEACHER_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing teacher data:', error);
  }
};

/**
 * Get teacher data from localStorage
 */
export const getTeacherData = () => {
  try {
    const data = localStorage.getItem(TEACHER_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving teacher data:', error);
    return null;
  }
};

/**
 * Clear teacher data from localStorage
 */
export const clearTeacherData = () => {
  try {
    localStorage.removeItem(TEACHER_DATA_KEY);
    localStorage.removeItem(TEACHER_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing teacher data:', error);
  }
};

// ============================================
// STUDENT TOKEN MANAGEMENT (Custom JWT)
// ============================================

/**
 * Store student JWT token
 */
export const setStudentToken = (token) => {
  try {
    localStorage.setItem(STUDENT_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing student token:', error);
  }
};

/**
 * Get student JWT token
 */
export const getStudentToken = () => {
  try {
    return localStorage.getItem(STUDENT_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving student token:', error);
    return null;
  }
};

/**
 * Store student data in localStorage
 */
export const setStudentData = (data) => {
  try {
    localStorage.setItem(STUDENT_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing student data:', error);
  }
};

/**
 * Get student data from localStorage
 */
export const getStudentData = () => {
  try {
    const data = localStorage.getItem(STUDENT_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving student data:', error);
    return null;
  }
};

/**
 * Clear student data and token
 */
export const clearStudentData = () => {
  try {
    localStorage.removeItem(STUDENT_TOKEN_KEY);
    localStorage.removeItem(STUDENT_DATA_KEY);
  } catch (error) {
    console.error('Error clearing student data:', error);
  }
};

// ============================================
// COMMON UTILITIES
// ============================================

/**
 * Clear all tokens and data (for logout)
 */
export const clearAllTokens = () => {
  clearTeacherData();
  clearStudentData();
};

/**
 * Check if user is authenticated (teacher or student)
 */
export const isAuthenticated = async () => {
  const teacherToken = await getTeacherToken();
  const studentToken = getStudentToken();
  return !!(teacherToken || studentToken);
};

/**
 * Get current user type
 * Returns 'teacher', 'student', or null
 */
export const getUserType = async () => {
  const teacherToken = await getTeacherToken();
  if (teacherToken) return 'teacher';
  
  const studentToken = getStudentToken();
  if (studentToken) return 'student';
  
  return null;
};

/**
 * Check if token is expired (basic JWT check for students)
 * Returns true if expired, false if valid
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // Decode JWT payload (middle part)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check expiration time (exp is in seconds)
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if we can't parse it
  }
};

/**
 * Auto-logout if student token is expired
 */
export const checkStudentTokenExpiration = () => {
  const token = getStudentToken();
  if (token && isTokenExpired(token)) {
    console.warn('⚠️ Student token expired, clearing data');
    clearStudentData();
    return true; // Token was expired
  }
  return false; // Token is valid
};
