import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { teacherAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ErrorAlert from '../../components/ErrorAlert';

const TeacherDashboard = () => {
  const { academySlug } = useParams();
  const navigate = useNavigate();
  const { teacher, academy } = useAuth();

  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch exams and students on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch both exams and students in parallel
        const [examsResponse, studentsResponse] = await Promise.all([
          teacherAPI.getAcademyExams(),
          teacherAPI.getAcademyStudents(),
        ]);
        
        // Sort exams by startTime in descending order (latest first)
        const sortedExams = (examsResponse.exams || []).sort((a, b) => 
          new Date(b.startTime) - new Date(a.startTime)
        );
        
        setExams(sortedExams);
        setStudents(studentsResponse.students || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate stats
  const totalStudents = students.length;
  const totalExams = exams.length;
  const totalAttempts = exams.reduce((sum, exam) => sum + (exam.totalAttempts || 0), 0);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Show loading
  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Dashboard Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-pink))',
        padding: 'var(--spacing-3xl) var(--spacing-md)',
        color: 'white'
      }}>
        <div className="container">
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Welcome, {teacher?.firstName || 'Teacher'}! 👋
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: '0.9' }}>
            Managing: <strong>{academy?.name || academySlug}</strong>
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="py-6">
        <div className="container">
          {/* Error Message */}
          {error && (
            <ErrorAlert 
              message={error} 
              onClose={() => setError('')}
            />
          )}

          {/* Quick Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-2xl)',
          }}>
            {/* Students Card */}
            <div className="card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  👥
                </div>
                <div>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '0'
                  }}>
                    {totalStudents}
                  </h3>
                </div>
              </div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Total Students
              </h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                margin: '0'
              }}>
                Enrolled in your academy
              </p>
            </div>

            {/* Exams Card */}
            <div className="card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-pink))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  📝
                </div>
                <div>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '0'
                  }}>
                    {totalExams}
                  </h3>
                </div>
              </div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Total Exams
              </h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                margin: '0'
              }}>
                Create and manage exams
              </p>
            </div>

            {/* Attempts Card */}
            <div className="card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, var(--accent-teal), #0d9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem'
                }}>
                  📊
                </div>
                <div>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    margin: '0'
                  }}>
                    {totalAttempts}
                  </h3>
                </div>
              </div>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Total Attempts
              </h4>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                margin: '0'
              }}>
                Across all exams
              </p>
            </div>
          </div>

          {/* Create Exam Button */}
          <div style={{ marginBottom: 'var(--spacing-xl)' }}>
            <button
              onClick={() => navigate(`/${academySlug}/dashboard/create-exam`)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
            >
              <span>➕</span>
              Create New Exam
            </button>
          </div>

          {/* Exams List */}
          <div className="card animate-fade-in">
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-lg)',
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-primary)',
                margin: '0',
              }}>
                All Exams
              </h2>
            </div>

            {exams.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No Exams Yet"
                message="Create your first exam to get started"
                actionLabel="Create Exam"
                onAction={() => navigate(`/${academySlug}/dashboard/create-exam`)}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{
                        textAlign: 'left',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Exam Title
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Difficulty
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem)',
                      }}>
                        Duration
                      </th>
                      <th style={{
                        textAlign: 'left',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Start Time
                      </th>
                      <th style={{
                        textAlign: 'center',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Attempts
                      </th>
                      <th style={{
                        textAlign: 'right',
                        padding: 'var(--spacing-md)',
                        fontWeight: '600',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr
                        key={exam.examId}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: 'var(--spacing-md)' }}>
                          <div style={{
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem',
                          }}>
                            {exam.title}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-muted)',
                          }}>
                            {exam.totalQuestions} questions
                          </div>
                        </td>
                        <td style={{ padding: 'var(--spacing-md)' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: 
                              exam.difficulty === 'easy' ? '#dcfce7' :
                              exam.difficulty === 'medium' ? '#fef3c7' : '#fee2e2',
                            color:
                              exam.difficulty === 'easy' ? '#166534' :
                              exam.difficulty === 'medium' ? '#854d0e' : '#991b1b',
                          }}>
                            {exam.difficulty.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                          {exam.durationMinutes} min
                        </td>
                        <td style={{ padding: 'var(--spacing-md)' }}>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {formatDate(exam.startTime)}
                            <br />
                            {formatTime(exam.startTime)}
                          </div>
                        </td>
                        <td style={{ 
                          padding: 'var(--spacing-md)', 
                          textAlign: 'center',
                          fontWeight: '600',
                          color: 'var(--primary-purple)',
                        }}>
                          {exam.totalAttempts || 0}
                        </td>
                        <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                          <button
                            onClick={() => navigate(`/${academySlug}/dashboard/exams/${exam.examId}`)}
                            className="btn btn-secondary"
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;