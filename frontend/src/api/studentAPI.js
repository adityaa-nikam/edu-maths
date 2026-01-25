import api from '../utils/axios';

const studentAPI = {
  // Student login
  async login(academySlug, username, password) {
    const response = await api.post('/students/login', {
      academySlug,
      username,
      password,
    });
    return response.data;
  },

  // Get student profile (if needed later)
  async getProfile() {
    const response = await api.get('/students/profile');
    return response.data;
  },

  // Get all exams for an academy (public, no auth required)
  async getAcademyExams(academySlug) {
    const response = await api.get(`/exams/academy/${academySlug}`);
    return response.data;
  },

  // ============================================
  // EXAM FLOW APIs (JWT Required)
  // ============================================

  // Get exam info and status (does NOT start exam)
  async getExamInfo(examId) {
    const response = await api.get(`/exams/${examId}/status`);
    return response.data;
  },

  // Start exam attempt (creates or returns existing attempt)
  async startExam(examId) {
    const response = await api.post(`/exams/${examId}/start`);
    return response.data;
  },

  // Get exam questions (locked to attempt)
  async getExamQuestions(examId) {
    const response = await api.get(`/exams/${examId}/questions`);
    return response.data;
  },

  // Save single answer (autosave)
  async saveAnswer(examId, questionId, selectedOption) {
    const response = await api.post(`/exams/${examId}/answer`, {
      questionId,
      selectedOption,
    });
    return response.data;
  },

  // Batch save answers (safety net)
  async saveAnswers(examId, answers) {
    const response = await api.post(`/exams/${examId}/answers`, {
      answers, // Array of { questionId, selectedOption }
    });
    return response.data;
  },

  // Submit exam
  async submitExam(examId) {
    const response = await api.post(`/exams/${examId}/submit`);
    return response.data;
  },

  // Additional student endpoints can be added here
};

export default studentAPI;
