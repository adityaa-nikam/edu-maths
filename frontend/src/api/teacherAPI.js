import api from '../utils/axios';

const teacherAPI = {
    // Get all exams for teacher's academy with pagination
    async getAcademyExams(params = {}) {
        console.log('🎯 teacherAPI.getAcademyExams called with params:', params);
        console.log('🎯 typeof params:', typeof params);
        console.log('🎯 params.page:', params.page, 'params.limit:', params.limit);
        
        const response = await api.get('/teacher/academy/exams', { params });
        
        console.log('🎯 Response pagination:', response.data?.pagination);
        return response.data;
    },

    // Get all attempts for a specific exam
    async getExamAttempts(examId, params = {}) {
        const response = await api.get(`/teacher/exams/${examId}/attempts`, { params });
        return response.data;
    },

    // Get exam summary statistics
    async getExamSummary(examId) {
        const response = await api.get(`/teacher/exams/${examId}/summary`);
        return response.data;
    },

    // Get student performance across all exams
    async getStudentPerformance(studentId, params = {}) {
        const response = await api.get(`/teacher/students/${studentId}/performance`, { params });
        return response.data;
    },

    // Get detailed exam results for a specific student (question-by-question)
    async getStudentExamDetails(examId, studentId) {
        const response = await api.get(`/teacher/exams/${examId}/student/${studentId}`);
        return response.data;
    },
};

export default teacherAPI;
