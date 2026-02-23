import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { examAPI } from '../services/api';
import { showSuccess, showError } from '../utils/notifications';
import DashboardLayout from './DashboardLayout/DashboardLayout';
import './CreateExamCalendar.css';

const CreateExamCalendar = () => {
  const { academySlug } = useParams();
  const navigate = useNavigate();
  const { academy } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [step, setStep] = useState(1); // 1: Calendar, 2: Time, 3: Details

  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'easy',
    totalQuestions: 10,
    durationMinutes: 30,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return days;
  };

  // Generate time slots
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const time = new Date();
        time.setHours(hour, minute, 0, 0);
        slots.push({
          time,
          label: time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
        });
      }
    }
    return slots;
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isTimeDisabled = (timeSlot) => {
    if (!selectedDate) return true;
    const dateTime = new Date(selectedDate);
    dateTime.setHours(timeSlot.time.getHours(), timeSlot.time.getMinutes());
    return dateTime < new Date();
  };

  const handleDateSelect = (dayObj) => {
    if (!dayObj.isCurrentMonth || isDateDisabled(dayObj.date)) return;
    setSelectedDate(dayObj.date);
    setStep(2);
  };

  const handleTimeSelect = (timeSlot) => {
    if (isTimeDisabled(timeSlot)) return;
    setSelectedTime(timeSlot.time);
    setStep(3);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Exam title is required';
    else if (formData.title.length < 3)
      newErrors.title = 'Title must be at least 3 characters';

    const q = parseInt(formData.totalQuestions);
    if (!q || q < 1) newErrors.totalQuestions = 'Minimum 1 question';
    else if (q > 100) newErrors.totalQuestions = 'Maximum 100 questions';

    const d = parseInt(formData.durationMinutes);
    if (!d || d < 5) newErrors.durationMinutes = 'Minimum 5 minutes';
    else if (d > 300) newErrors.durationMinutes = 'Maximum 300 minutes';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || !selectedDate || !selectedTime) {
      showError('Please complete all fields');
      return;
    }

    const startTime = new Date(selectedDate);
    startTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());

    const payload = {
      academyId: academy.id,
      title: formData.title.trim(),
      difficulty: formData.difficulty,
      totalQuestions: Number(formData.totalQuestions),
      durationMinutes: Number(formData.durationMinutes),
      startTime: startTime.toISOString(),
    };

    try {
      setLoading(true);
      await examAPI.create(payload);
      showSuccess('Exam created successfully');
      navigate(`/${academySlug}/dashboard`);
    } catch (err) {
      showError(err.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const days = getDaysInMonth(currentDate);
  const timeSlots = getTimeSlots();

  const changeMonth = (direction) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
  };

  const getScheduledDateTime = () => {
    if (!selectedDate || !selectedTime) return null;
    const dt = new Date(selectedDate);
    dt.setHours(selectedTime.getHours(), selectedTime.getMinutes());
    return dt;
  };

  return (
    <DashboardLayout>
      <div className="exam-calendar-container">
        <div className="exam-calendar-wrapper">
          {/* Left Sidebar */}
          <div className="exam-sidebar">
            <div className="exam-info-section">
              <h2 className="exam-title-display">Create New Exam</h2>

              <div className="exam-meta">
                <div className="meta-item">
                  <span className="meta-icon">⏱️</span>
                  <span className="meta-text">{formData.durationMinutes}m</span>
                </div>

                {step >= 3 && (
                  <>
                    <div className="meta-item">
                      <span className="meta-icon">📝</span>
                      <span className="meta-text">
                        {formData.totalQuestions} questions
                      </span>
                    </div>

                    <div className="meta-item">
                      <span className="meta-icon">📊</span>
                      <span className="meta-text">
                        {formData.difficulty.charAt(0).toUpperCase() +
                          formData.difficulty.slice(1)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {getScheduledDateTime() && (
                <div className="scheduled-time">
                  <div className="scheduled-label">Scheduled for:</div>
                  <div className="scheduled-date">
                    {getScheduledDateTime().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="scheduled-time-value">
                    {getScheduledDateTime().toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
              <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Select Date</div>
              </div>
              <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Select Time</div>
              </div>
              <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Exam Details</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="exam-main-content">
            {/* Step 1: Calendar */}
            {step === 1 && (
              <div className="calendar-section">
                <div className="calendar-header">
                  <h3>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <div className="calendar-nav">
                    <button onClick={() => changeMonth(-1)} className="nav-btn">
                      ←
                    </button>
                    <button onClick={() => changeMonth(1)} className="nav-btn">
                      →
                    </button>
                  </div>
                </div>

                <div className="calendar-weekdays">
                  {weekDays.map((day) => (
                    <div key={day} className="weekday">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="calendar-days">
                  {days.map((dayObj, idx) => {
                    const isToday =
                      dayObj.date.toDateString() === new Date().toDateString();
                    const isSelected =
                      selectedDate &&
                      dayObj.date.toDateString() === selectedDate.toDateString();
                    const isDisabled =
                      !dayObj.isCurrentMonth || isDateDisabled(dayObj.date);

                    return (
                      <button
                        key={idx}
                        className={`calendar-day ${!dayObj.isCurrentMonth ? 'other-month' : ''
                          } ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''
                          } ${isDisabled ? 'disabled' : ''}`}
                        onClick={() => handleDateSelect(dayObj)}
                        disabled={isDisabled}
                      >
                        {dayObj.day}
                        {isToday && <span className="today-dot"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Time Selection */}
            {step === 2 && (
              <div className="time-section">
                <div className="section-header">
                  <button onClick={() => setStep(1)} className="back-btn">
                    ← Back
                  </button>
                  <h3>
                    Select Time for{' '}
                    {selectedDate?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                </div>

                <div className="time-picker-container">
                  <div className="form-group">
                    <label>Choose a time</label>
                    <input
                      type="time"
                      className="form-input time-input"
                      onChange={(e) => {
                        if (e.target.value) {
                          const [hours, minutes] = e.target.value.split(':');
                          const time = new Date();
                          time.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                          // Check if time is in the past
                          const dateTime = new Date(selectedDate);
                          dateTime.setHours(parseInt(hours), parseInt(minutes));

                          if (dateTime >= new Date()) {
                            setSelectedTime(time);
                          }
                        }
                      }}
                      style={{ fontSize: '18px', padding: '16px' }}
                    />
                  </div>

                  <button
                    className="btn-create"
                    onClick={() => selectedTime && setStep(3)}
                    disabled={!selectedTime}
                    style={{ width: '100%', marginTop: '24px' }}
                  >
                    Continue to Exam Details
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Exam Details */}
            {step === 3 && (
              <div className="details-section">
                <div className="section-header">
                  <button onClick={() => setStep(2)} className="back-btn">
                    ← Back
                  </button>
                  <h3>Exam Details</h3>
                </div>

                <form onSubmit={handleSubmit} className="exam-form">
                  <div className="form-group">
                    <label>Exam Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Mathematics Final Exam"
                      className="form-input"
                    />
                    {errors.title && <p className="error-text">{errors.title}</p>}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Difficulty *</label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleChange}
                        className="form-input"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Total Questions *</label>
                      <input
                        type="number"
                        name="totalQuestions"
                        value={formData.totalQuestions}
                        onChange={handleChange}
                        min="1"
                        max="100"
                        className="form-input"
                      />
                      {errors.totalQuestions && (
                        <p className="error-text">{errors.totalQuestions}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Duration (minutes) *</label>
                    <input
                      type="number"
                      name="durationMinutes"
                      value={formData.durationMinutes}
                      onChange={handleChange}
                      min="5"
                      max="300"
                      className="form-input"
                    />
                    {errors.durationMinutes && (
                      <p className="error-text">{errors.durationMinutes}</p>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => navigate(`/${academySlug}/dashboard`)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-create"
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Exam'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateExamCalendar;
