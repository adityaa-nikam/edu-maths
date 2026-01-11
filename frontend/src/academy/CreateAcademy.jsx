import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError } from '../utils/notifications';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

const CreateAcademy = () => {
  const navigate = useNavigate();
  const { teacher, academy, createAcademy, isAuthenticated, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Redirect if teacher already has an academy
  useEffect(() => {
    if (!authLoading && academy) {
      navigate(`/${academy.slug}/dashboard`, { replace: true });
    }
  }, [academy, authLoading, navigate]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Auto-generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
    if (errors.name) {
      setErrors({ ...errors, name: '' });
    }
  };

  const handleSlugChange = (e) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, slug });
    if (errors.slug) {
      setErrors({ ...errors, slug: '' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Academy name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Academy name must be at least 3 characters';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (formData.slug.length < 3) {
      newErrors.slug = 'Slug must be at least 3 characters';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.logoUrl && !isValidUrl(formData.logoUrl)) {
      newErrors.logoUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await createAcademy({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        logoUrl: formData.logoUrl.trim() || undefined,
        description: formData.description.trim() || undefined,
      });

      if (result.success) {
        showSuccess('Academy created successfully!');
        // Redirect to dashboard
        setTimeout(() => {
          navigate(`/${result.academy.slug}/dashboard`, { replace: true });
        }, 1000);
      } else if (result.alreadyExists && result.academy) {
        // Academy already exists - store it and redirect
        showSuccess('Welcome back! Redirecting to your academy...');
        setTimeout(() => {
          navigate(`/${result.academy.slug}/dashboard`, { replace: true });
        }, 1000);
      } else {
        // Handle specific errors
        if (result.message.includes('slug') && result.message.includes('taken')) {
          setErrors({ slug: 'This slug is already taken. Please choose a different one.' });
        } else {
          setGeneralError(result.message);
        }
      }
    } catch (error) {
      console.error('Create academy error:', error);
      setGeneralError(error.message || 'Failed to create academy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  // Don't render if already has academy (will redirect)
  if (academy) {
    return <LoadingSpinner fullScreen message="Redirecting to dashboard..." />;
  }

  return (
    <div className="page-container">
      <div className="container container--sm">
        <div className="card animate-fade-in">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
            <h1 className="page-title">Create Your Academy</h1>
            <p className="page-subtitle">
              Set up your educational institution and start managing exams
            </p>
            {teacher && (
              <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.875rem',
                marginTop: 'var(--spacing-sm)' 
              }}>
                Welcome, {teacher.firstName || teacher.email}!
              </p>
            )}
          </div>

          {/* General Error */}
          {generalError && (
            <ErrorAlert 
              message={generalError} 
              onClose={() => setGeneralError('')}
            />
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Academy Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Academy Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                placeholder="e.g., EduMaths Academy"
                value={formData.name}
                onChange={handleNameChange}
                disabled={loading}
                required
              />
              {errors.name && (
                <span className="form-error">{errors.name}</span>
              )}
              <small className="form-hint">
                This will be displayed on your academy's public page
              </small>
            </div>

            {/* Slug */}
            <div className="form-group">
              <label htmlFor="slug" className="form-label">
                Academy Slug *
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                className={`form-input ${errors.slug ? 'form-input--error' : ''}`}
                placeholder="e-g-edumaths-academy"
                value={formData.slug}
                onChange={handleSlugChange}
                disabled={loading}
                required
              />
              {errors.slug && (
                <span className="form-error">{errors.slug}</span>
              )}
              <small className="form-hint">
                Your academy URL will be: {window.location.origin}/{formData.slug || 'your-slug'}
              </small>
            </div>

            {/* Logo URL */}
            <div className="form-group">
              <label htmlFor="logoUrl" className="form-label">
                Logo URL (Optional)
              </label>
              <input
                type="url"
                id="logoUrl"
                name="logoUrl"
                className={`form-input ${errors.logoUrl ? 'form-input--error' : ''}`}
                placeholder="https://example.com/logo.png"
                value={formData.logoUrl}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.logoUrl && (
                <span className="form-error">{errors.logoUrl}</span>
              )}
              <small className="form-hint">
                Direct URL to your academy's logo image
              </small>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                className="form-input"
                placeholder="Tell students about your academy..."
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                rows={4}
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
              <small className="form-hint">
                Brief description of your academy (max 500 characters)
              </small>
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: 'var(--spacing-xl)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <>
                    <span style={{ 
                      display: 'inline-block',
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                      marginRight: 'var(--spacing-sm)',
                      verticalAlign: 'middle',
                    }} />
                    Creating Academy...
                  </>
                ) : (
                  'Create Academy'
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div style={{
            marginTop: 'var(--spacing-xl)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}>
            <h4 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              marginBottom: 'var(--spacing-xs)',
              color: 'var(--text-secondary)',
            }}>
              📋 What's Next?
            </h4>
            <ul style={{ 
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              margin: '0',
              paddingLeft: 'var(--spacing-lg)',
              lineHeight: '1.6',
            }}>
              <li>Create student accounts</li>
              <li>Design and schedule exams</li>
              <li>Monitor student performance</li>
              <li>Share your academy link with students</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAcademy;
