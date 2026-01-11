import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teacherAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const StudentsList = () => {
    const { academySlug } = useParams();
    const navigate = useNavigate();
    const { isLoaded, isSignedIn, academy } = useAuth();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            navigate('/login');
        }
    }, [isLoaded, isSignedIn, navigate]);

    // Fetch students
    useEffect(() => {
        if (!isSignedIn) return;

        const fetchStudents = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await teacherAPI.getAcademyStudents();
                setStudents(response.students || []);
            } catch (err) {
                console.error('Error fetching students:', err);
                setError(err.message || 'Failed to load students');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [isSignedIn]);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return <LoadingSpinner message="Loading students..." />;
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--spacing-3xl)' }}>
            {/* Header */}
            <div style={{
                backgroundColor: 'white',
                borderBottom: '1px solid var(--neutral-200)',
                padding: 'var(--spacing-xl) 0',
                marginBottom: 'var(--spacing-xl)'
            }}>
                <div className="container">
                    {/* Breadcrumb */}
                    <div style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--spacing-md)'
                    }}>
                        <span
                            onClick={() => navigate(`/${academySlug}/dashboard`)}
                            style={{ color: 'var(--primary-purple)', cursor: 'pointer' }}
                        >
                            Dashboard
                        </span>
                        {' / '}
                        <span>Students</span>
                    </div>

                    {/* Title */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: 'var(--primary-purple)',
                                borderRadius: 'var(--radius-md)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '1.5rem'
                            }}>
                                👥
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                    Students
                                </h1>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                                    {academy?.name || 'Your Academy'} - {students.length} {students.length === 1 ? 'Student' : 'Students'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`/${academySlug}/dashboard`)}
                            className="btn btn-outline"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="container container--lg">
                {error && <ErrorAlert message={error} />}

                {/* Students List */}
                {students.length === 0 ? (
                    <div className="card text-center" style={{ padding: 'var(--spacing-3xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📚</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                            No Students Yet
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                            Students will appear here once they register for your academy.
                        </p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '2px solid var(--neutral-200)' }}>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            #
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Username
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Student ID
                                        </th>
                                        <th style={{
                                            padding: 'var(--spacing-md)',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            color: 'var(--text-secondary)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Registered On
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr
                                            key={student.id}
                                            style={{
                                                borderBottom: '1px solid var(--neutral-200)',
                                                transition: 'background-color 0.2s',
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{
                                                padding: 'var(--spacing-md)',
                                                fontSize: '0.875rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                {index + 1}
                                            </td>
                                            <td style={{
                                                padding: 'var(--spacing-md)',
                                                fontWeight: '600',
                                                color: 'var(--text-primary)'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'var(--primary-purple)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '600'
                                                    }}>
                                                        {student.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    {student.username}
                                                </div>
                                            </td>
                                            <td style={{
                                                padding: 'var(--spacing-md)',
                                                fontSize: '0.875rem',
                                                color: 'var(--text-secondary)',
                                                fontFamily: 'monospace'
                                            }}>
                                                {student.id.substring(0, 8)}...
                                            </td>
                                            <td style={{
                                                padding: 'var(--spacing-md)',
                                                fontSize: '0.875rem',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                {formatDate(student.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentsList;
