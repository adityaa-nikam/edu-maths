import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useStudentAuth } from "../../contexts/StudentAuthContext";
import { academyAPI, examAPI } from "../../services/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorAlert from "../../components/ErrorAlert";

const AcademyPage = () => {
  const { academySlug } = useParams();
  const navigate = useNavigate();
  const { student, isAuthenticated, logout } = useStudentAuth();

  // State for academy and exams
  const [academy, setAcademy] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch academy and exams on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        // Fetch academy details
        const academyResponse = await academyAPI.getBySlug(academySlug);
        if (academyResponse.academy) {
          setAcademy(academyResponse.academy);
        }

        // Fetch exams for this academy
        const examsResponse = await examAPI.getByAcademy(academySlug);
        
        // Sort exams by startTime in descending order (latest first)
        const sortedExams = (examsResponse.exams || []).sort((a, b) => 
          new Date(b.startTime) - new Date(a.startTime)
        );
        
        setExams(sortedExams);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load academy data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [academySlug]);

  const handleExamClick = (examId) => {
    if (!isAuthenticated) {
      // Redirect to student login
      navigate(`/${academySlug}/login`);
    } else {
      // Go to exam page
      navigate(`/${academySlug}/exam/${examId}`);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload(); // Reload to update UI
  };

  // Show loading
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading academy..." />;
  }

  // Show error
  if (error && !academy) {
    return (
      <div className="page-container">
        <div className="container">
          <ErrorAlert message={error} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)' }}>
      {/* Academy Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-purple), var(--primary-purple-dark))',
        padding: 'var(--spacing-3xl) var(--spacing-md)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Student Logout Button */}
        {isAuthenticated && student && (
          <button
            onClick={handleLogout}
            style={{
              position: 'absolute',
              top: 'var(--spacing-md)',
              right: 'var(--spacing-md)',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            🚪 Logout
          </button>
        )}
        
        <div className="container container--md">
          {academy?.logoUrl && (
            <img 
              src={academy.logoUrl} 
              alt={academy.name}
              style={{
                maxWidth: '100px',
                maxHeight: '100px',
                marginBottom: 'var(--spacing-md)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'white',
                padding: 'var(--spacing-xs)',
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: 'var(--spacing-md)',
          }}>
            {academy?.name || academySlug}
          </h1>
          <p style={{ fontSize: '1.125rem', opacity: '0.9', maxWidth: '600px', margin: '0 auto' }}>
            {academy?.description || 'Welcome to our learning platform. Access your exams and track your progress.'}
          </p>
          
          {/* Show login button or welcome message */}
          {!isAuthenticated ? (
            <button
              onClick={() => navigate(`/${academySlug}/login`)}
              className="btn btn-secondary"
              style={{ 
                backgroundColor: 'white', 
                color: 'var(--primary-purple)',
                marginTop: 'var(--spacing-lg)',
              }}
            >
              Student Login
            </button>
          ) : (
            <p style={{ 
              marginTop: 'var(--spacing-lg)',
              fontSize: '1rem',
              opacity: '0.9',
            }}>
              👋 Welcome back, <strong>{student?.username}</strong>!
            </p>
          )}
        </div>
      </div>

      {/* Academy Description */}
      <div className="py-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="card animate-fade-in">
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: 'var(--spacing-md)',
              color: 'var(--text-primary)'
            }}>
              About This Academy
            </h2>
            <p style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.7',
              fontSize: '1rem'
            }}>
              This academy offers comprehensive online assessments designed to test and improve your mathematical skills.
              Sign in as a student to access available exams and track your performance over time.
            </p>
          </div>
        </div>
      </div>

      {/* Exams Section */}
      <div className="py-6">
        <div className="container">
          <div className="mb-5">
            <h2 className="section-title">Available Exams</h2>
            <p className="section-subtitle">
              Click on an exam to get started
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-6">
              <div style={{
                display: 'inline-block',
                width: '48px',
                height: '48px',
                border: '4px solid var(--neutral-200)',
                borderTopColor: 'var(--primary-purple)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <p style={{ marginTop: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
                Loading exams...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="card" style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              color: '#c33'
            }}>
              <p>⚠️ {error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && exams.length === 0 && (
            <div className="card text-center">
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                📝 No exams available yet. Check back later!
              </p>
            </div>
          )}

          {/* Exam Cards Grid */}
          {!loading && !error && exams.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {exams.map((exam) => {
                // Determine exam status
                const now = new Date();
                const startTime = new Date(exam.startTime);
                const endTime = new Date(exam.endTime);

                let status = 'upcoming';
                let statusBg = 'var(--neutral-300)';
                let statusColor = 'var(--neutral-700)';

                if (now >= startTime && now <= endTime) {
                  status = 'active';
                  statusBg = 'var(--primary-purple)';
                  statusColor = 'white';
                } else if (now > endTime) {
                  status = 'ended';
                  statusBg = 'var(--neutral-400)';
                  statusColor = 'var(--neutral-800)';
                }

                return (
                  <div
                    key={exam.id}
                    className="card card--interactive stagger-item"
                    onClick={() => status === 'active' ? handleExamClick(exam.id) : null}
                    style={{
                      cursor: status === 'active' ? 'pointer' : 'not-allowed',
                      opacity: status === 'ended' ? '0.6' : '1'
                    }}
                  >
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: statusBg,
                        color: statusColor,
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {status}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      marginBottom: 'var(--spacing-sm)',
                      color: 'var(--text-primary)'
                    }}>
                      {exam.title}
                    </h3>

                    <p style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      Difficulty: <strong style={{ textTransform: 'capitalize' }}>{exam.difficulty}</strong>
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: 'var(--spacing-md)',
                      fontSize: '0.875rem',
                      color: 'var(--text-muted)',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      <span>⏱️ {exam.durationMinutes} mins</span>
                      <span>📝 {exam.totalQuestions} questions</span>
                    </div>

                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginBottom: 'var(--spacing-md)'
                    }}>
                      <div>Start: {new Date(exam.startTime).toLocaleString()}</div>
                      <div>End: {new Date(exam.endTime).toLocaleString()}</div>
                    </div>

                    <div className="mt-4">
                      <button
                        className="btn btn-primary btn-full btn-sm"
                        disabled={status !== 'active'}
                      >
                        {status === 'active'
                          ? (isAuthenticated ? 'Take Exam' : 'Login to Take Exam')
                          : status === 'upcoming'
                            ? 'Not Started Yet'
                            : 'Exam Ended'
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademyPage;

