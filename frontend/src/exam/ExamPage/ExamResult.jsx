import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ExamResult = () => {
    const navigate = useNavigate();
    const { academySlug } = useParams();

    // Mock data - replace with actual result data
    const score = 85;
    const totalQuestions = 20;
    const correctAnswers = 17;
    const isPassed = score >= 60;

    return (
        <div className="page-container">
            <div className="container container--sm">
                <div className="card animate-fade-in text-center">
                    {/* Result Icon */}
                    <div style={{ fontSize: '5rem', marginBottom: 'var(--spacing-lg)' }}>
                        {isPassed ? '🎉' : '📚'}
                    </div>

                    {/* Title */}
                    <h1 className="page-title" style={{ marginBottom: 'var(--spacing-sm)' }}>
                        {isPassed ? 'Congratulations!' : 'Good Effort!'}
                    </h1>
                    <p className="page-subtitle">
                        {isPassed
                            ? 'You have successfully passed the exam!'
                            : 'Keep practicing and try again!'}
                    </p>

                    {/* Score Display */}
                    <div style={{
                        padding: 'var(--spacing-xl)',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: 'var(--spacing-xl)'
                    }}>
                        <div style={{
                            fontSize: '4rem',
                            fontWeight: '800',
                            background: isPassed
                                ? 'linear-gradient(135deg, var(--success), #16a34a)'
                                : 'linear-gradient(135deg, var(--accent-orange), var(--accent-pink))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            lineHeight: '1'
                        }}>
                            {score}%
                        </div>
                        <div style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginTop: 'var(--spacing-sm)'
                        }}>
                            Your Score
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {/* Correct Answers */}
                        <div style={{
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: 'var(--success)',
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                {correctAnswers}
                            </div>
                            <div style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Correct
                            </div>
                        </div>

                        {/* Wrong Answers */}
                        <div style={{
                            padding: 'var(--spacing-lg)',
                            backgroundColor: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <div style={{
                                fontSize: '2rem',
                                fontWeight: '700',
                                color: 'var(--error)',
                                marginBottom: 'var(--spacing-xs)'
                            }}>
                                {totalQuestions - correctAnswers}
                            </div>
                            <div style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Wrong
                            </div>
                        </div>
                    </div>

                    {/* Performance Message */}
                    <div style={{
                        padding: 'var(--spacing-lg)',
                        backgroundColor: isPassed ? '#f0fdf4' : '#fef3c7',
                        borderLeft: `4px solid ${isPassed ? 'var(--success)' : 'var(--warning)'}`,
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--spacing-xl)',
                        textAlign: 'left'
                    }}>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: 'var(--spacing-xs)'
                        }}>
                            {isPassed ? '✅ Well Done!' : '💡 Keep Going!'}
                        </h3>
                        <p style={{
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            margin: '0'
                        }}>
                            {isPassed
                                ? 'Your hard work has paid off. Keep up the excellent performance!'
                                : 'Learning is a journey. Review the material and try again when you\'re ready.'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate(`/${academySlug}`)}
                            className="btn btn-primary btn-full"
                        >
                            Back to Academy
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-outline btn-full"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamResult;
