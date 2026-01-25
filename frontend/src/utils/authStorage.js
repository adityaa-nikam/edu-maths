// Auth Storage Utility - Centralized localStorage management

const authStorage = {
  // Token management
  setToken(token) {
    localStorage.setItem('studentToken', token);
  },

  getToken() {
    return localStorage.getItem('studentToken');
  },

  removeToken() {
    localStorage.removeItem('studentToken');
  },

  // Student data management
  setStudentData(studentData) {
    localStorage.setItem('studentInfo', JSON.stringify(studentData));
  },

  getStudentData() {
    const data = localStorage.getItem('studentInfo');
    return data ? JSON.parse(data) : null;
  },

  removeStudentData() {
    localStorage.removeItem('studentInfo');
  },

  // Clear all auth data
  clearAll() {
    this.removeToken();
    this.removeStudentData();
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authStorage;
