import React from 'react';
import { useParams } from 'react-router-dom';

const ExamPage = () => {
  const { academySlug, examId } = useParams();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Fixed Timer Bar */}
      <div style={{
        position: 'sticky',
        top: '0',
        zIndex: '10',
        backgroundColor: 'white',
        borderBottom: '2px solid var(--neutral-200)',
        padding: 'var(--spacing-md)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: '0'
              }}>
                Mathematics Assessment
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                margin: '0'
              }}>
                Question 1 of 20
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--neutral-100)',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontSize: '1.25rem' }}>⏱️</span>
              <div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--primary-purple)',
                  lineHeight: '1'
                }}>
                  45:30
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Time Left
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="py-6">
        <div className="container container--md">
          {/* Question Card */}
          <div className="card animate-fade-in">
            {/* Question Number Badge */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <span style={{
                display: 'inline-block',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--primary-purple)',
                color: 'white',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Question 1
              </span>
            </div>

            {/* Question Text */}
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-xl)',
              lineHeight: '1.6'
            }}>
              What is the value of x in the equation: 2x + 5 = 15?
            </h3>

            {/* Answer Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {/* Option A */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--neutral-200)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-purple)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--neutral-200)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}>
                <input
                  type="radio"
                  name="answer"
                  value="A"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    marginRight: 'var(--spacing-md)',
                    cursor: 'pointer',
                    accentColor: 'var(--primary-purple)'
                  }}
                />
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  marginRight: 'var(--spacing-md)'
                }}>
                  A.
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  x = 5
                </span>
              </label>

              {/* Option B */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--neutral-200)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-purple)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--neutral-200)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}>
                <input
                  type="radio"
                  name="answer"
                  value="B"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    marginRight: 'var(--spacing-md)',
                    cursor: 'pointer',
                    accentColor: 'var(--primary-purple)'
                  }}
                />
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  marginRight: 'var(--spacing-md)'
                }}>
                  B.
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  x = 10
                </span>
              </label>

              {/* Option C */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--neutral-200)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-purple)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--neutral-200)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}>
                <input
                  type="radio"
                  name="answer"
                  value="C"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    marginRight: 'var(--spacing-md)',
                    cursor: 'pointer',
                    accentColor: 'var(--primary-purple)'
                  }}
                />
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  marginRight: 'var(--spacing-md)'
                }}>
                  C.
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  x = 7.5
                </span>
              </label>

              {/* Option D */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: 'var(--spacing-lg)',
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--neutral-200)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-purple)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--neutral-200)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}>
                <input
                  type="radio"
                  name="answer"
                  value="D"
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    marginRight: 'var(--spacing-md)',
                    cursor: 'pointer',
                    accentColor: 'var(--primary-purple)'
                  }}
                />
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: '500',
                  color: 'var(--text-primary)',
                  marginRight: 'var(--spacing-md)'
                }}>
                  D.
                </span>
                <span style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  x = 20
                </span>
              </label>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-5">
            <button className="btn btn-outline">
              ← Previous
            </button>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              1 / 20 Questions
            </div>
            <button className="btn btn-primary">
              Next →
            </button>
          </div>

          {/* Submit Section */}
          <div className="text-center mt-5">
            <button className="btn btn-primary btn-lg" style={{
              background: 'linear-gradient(135deg, var(--success), #16a34a)'
            }}>
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;

