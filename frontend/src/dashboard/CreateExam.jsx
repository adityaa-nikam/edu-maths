import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { examAPI } from '../services/api';
import { showSuccess, showError } from '../utils/notifications';

const CreateExam = () => {
  const { academySlug } = useParams();
  const navigate = useNavigate();
  const { academy } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'easy',
    totalQuestions: 10,
    durationMinutes: 30,
    startTime: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Exam title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'Difficulty is required';
    }

    const questions = parseInt(formData.totalQuestions);
    if (!questions || questions < 1) {
      newErrors.totalQuestions = 'Must have at least 1 question';
    } else if (questions > 100) {
      newErrors.totalQuestions = 'Maximum 100 questions allowed';
    }

    const duration = parseInt(formData.durationMinutes);
    if (!duration || duration < 5) {
      newErrors.durationMinutes = 'Duration must be at least 5 minutes';
    } else if (duration > 300) {
      newErrors.durationMinutes = 'Maximum 300 minutes (5 hours) allowed';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    } else {
      const startDate = new Date(formData.startTime);
      const now = new Date();
      if (startDate < now) {
        newErrors.startTime = 'Start time must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);

      // Prepare data for API
      const examData = {
        academyId: academy.id,
        title: formData.title.trim(),
        difficulty: formData.difficulty,
        totalQuestions: parseInt(formData.totalQuestions),
        durationMinutes: parseInt(formData.durationMinutes),
        startTime: new Date(formData.startTime).toISOString(),
      };

      await examAPI.create(examData);
      
      showSuccess('Exam created successfully!');
      navigate(`/${academySlug}/dashboard`);
    } catch (err) {
      console.error('Failed to create exam:', err);
      showError(err.message || 'Failed to create exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get minimum date-time for input (now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)', paddingBottom: 'var(--spacing-3xl)' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid var(--border-color)',
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
            <span>Create Exam</span>
          </div>

          {/* Title */}
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
              ➕
            </div>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                Create New Exam
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                Schedule a new exam for your students
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container">
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit}>
            {/* Exam Title */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label htmlFor="title" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Exam Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Monthly Abacus Assessment - January 2026"
                className="form-input"
                style={{
                  width: '100%',
                  borderColor: errors.title ? '#ef4444' : undefined,
                }}
              />
              {errors.title && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
                  {errors.title}
                </p>
              )}
            </div>

            {/* Difficulty */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label htmlFor="difficulty" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Difficulty Level *
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="form-input"
                style={{ width: '100%' }}
              >
                <option value="easy">Easy - Beginner Level</option>
                <option value="medium">Medium - Intermediate Level</option>
                <option value="hard">Hard - Advanced Level</option>
              </select>
              {errors.difficulty && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
                  {errors.difficulty}
                </p>
              )}
            </div>

            {/* Grid for Questions and Duration */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-lg)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              {/* Total Questions */}
              <div>
                <label htmlFor="totalQuestions" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Number of Questions *
                </label>
                <input
                  type="number"
                  id="totalQuestions"
                  name="totalQuestions"
                  value={formData.totalQuestions}
                  onChange={handleChange}
                  min="1"
                  max="100"
                  className="form-input"
                  style={{
                    width: '100%',
                    borderColor: errors.totalQuestions ? '#ef4444' : undefined,
                  }}
                />
                {errors.totalQuestions && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
                    {errors.totalQuestions}
                  </p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="durationMinutes" style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-xs)'
                }}>
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  id="durationMinutes"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleChange}
                  min="5"
                  max="300"
                  className="form-input"
                  style={{
                    width: '100%',
                    borderColor: errors.durationMinutes ? '#ef4444' : undefined,
                  }}
                />
                {errors.durationMinutes && (
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
                    {errors.durationMinutes}
                  </p>
                )}
              </div>
            </div>

            {/* Start Time */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <label htmlFor="startTime" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                min={getMinDateTime()}
                className="form-input"
                style={{
                  width: '100%',
                  borderColor: errors.startTime ? '#ef4444' : undefined,
                }}
              />
              {errors.startTime && (
                <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
                  {errors.startTime}
                </p>
              )}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
                End time will be automatically calculated based on duration
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              paddingTop: 'var(--spacing-lg)',
              borderTop: '1px solid var(--border-color)',
            }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ minWidth: '150px' }}
              >
                {loading ? 'Creating...' : 'Create Exam'}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/${academySlug}/dashboard`)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="card" style={{
          maxWidth: '800px',
          margin: 'var(--spacing-xl) auto 0',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe'
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <div style={{ fontSize: '1.5rem' }}>ℹ️</div>
            <div>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#1e40af',
                marginBottom: 'var(--spacing-xs)'
              }}>
                Important Notes
              </h3>
              <ul style={{
                margin: 0,
                paddingLeft: 'var(--spacing-lg)',
                color: '#1e40af',
                fontSize: '0.875rem',
              }}>
                <li>Questions will be automatically selected from the question bank based on difficulty</li>
                <li>Students can only start the exam during the scheduled time window</li>
                <li>The exam will automatically close after the duration expires</li>
                <li>Make sure you have enough questions in the database for the selected difficulty</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;
