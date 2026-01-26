# EduMaths Design System - Quick Reference

## 🎨 Color Palette

```css
/* Primary */
--primary-purple: #6366f1
--primary-purple-dark: #4f46e5
--primary-purple-light: #818cf8

/* Accents */
--accent-pink: #ec4899
--accent-orange: #f97316
--accent-teal: #14b8a6

/* Semantic */
--success: #22c55e
--error: #ef4444
--warning: #eab308
--info: #3b82f6
```

## 📏 Spacing Scale

```css
--spacing-xs: 0.5rem   /* 8px */
--spacing-sm: 0.75rem  /* 12px */
--spacing-md: 1rem     /* 16px */
--spacing-lg: 1.5rem   /* 24px */
--spacing-xl: 2rem     /* 32px */
--spacing-2xl: 3rem    /* 48px */
--spacing-3xl: 4rem    /* 64px */
```

## 🔤 Typography

```css
/* Hero Title */
.hero-title
  - 3.5rem (56px)
  - Weight: 900
  - Gradient background

/* Page Title */
.page-title
  - 2.5rem (40px)
  - Weight: 800
  - Centered

/* Section Title */
.section-title
  - 1.875rem (30px)
  - Weight: 700
```

## 🎴 Components

### Card
```jsx
<div className="card">
  {/* Content */}
</div>

// Variants
className="card card--sm"        // Smaller padding
className="card card--lg"        // Larger padding
className="card card--interactive" // Hover effects
```

### Buttons
```jsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-outline">Outline</button>

// Modifiers
className="btn btn-primary btn-full"  // Full width
className="btn btn-primary btn-lg"    // Large
className="btn btn-primary btn-sm"    // Small
```

### Form Input
```jsx
<div className="form-group">
  <label className="form-label">Label</label>
  <input 
    type="text" 
    className="form-input"
    placeholder="Placeholder"
  />
</div>
```

### Alerts
```jsx
<div className="alert alert--error">Error message</div>
<div className="alert alert--success">Success message</div>
<div className="alert alert--info">Info message</div>
<div className="alert alert--warning">Warning message</div>
```

## 📦 Layout Utilities

### Containers
```jsx
<div className="container">           {/* Default container */}
<div className="container container--sm">  {/* Small container */}
<div className="container container--md">  {/* Medium container */}
```

### Page Container
```jsx
<div className="page-container">
  {/* Vertically centered full-height content */}
</div>
```

### Grid
```jsx
<div className="grid grid-cols-3 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

### Flexbox
```jsx
<div className="flex gap-3 justify-center items-center">
  {/* Flex items */}
</div>
```

## ✨ Animations

```jsx
<div className="animate-fade-in">Fade in on load</div>
<div className="animate-slide-up">Slide up on load</div>

{/* Stagger animation for lists */}
<div className="stagger-item">Item 1</div>
<div className="stagger-item">Item 2</div>
<div className="stagger-item">Item 3</div>
```

## 📐 Common Patterns

### Auth Page (Login/Signup)
```jsx
<div className="page-container">
  <div className="container container--sm">
    <div className="card animate-fade-in">
      <h1 className="page-title">Title</h1>
      <p className="page-subtitle">Subtitle</p>
      
      <form>
        {/* Form fields */}
      </form>
    </div>
  </div>
</div>
```

### Section with Cards
```jsx
<div className="py-6">
  <div className="container">
    <h2 className="section-title">Section Title</h2>
    <p className="section-subtitle">Description</p>
    
    <div className="grid grid-cols-3 gap-4">
      <div className="card card--interactive stagger-item">
        {/* Card content */}
      </div>
    </div>
  </div>
</div>
```

### Gradient Header
```jsx
<div style={{ 
  background: 'linear-gradient(135deg, var(--primary-purple), var(--primary-purple-dark))',
  padding: 'var(--spacing-3xl) var(--spacing-md)',
  color: 'white'
}}>
  {/* Header content */}
</div>
```

## 🎯 Best Practices

1. **Always use CSS variables** instead of hardcoded values
2. **Use utility classes** for spacing (mt-3, mb-4, py-5, etc.)
3. **Wrap forms in cards** for consistency
4. **Add animations** to page loads with `animate-fade-in`
5. **Use stagger-item** for lists of cards
6. **Keep max-width** on containers, not full screen
7. **Include placeholders** in all inputs
8. **Add hover states** to interactive elements

## 🚀 Quick Start Template

```jsx
import React from 'react';

const MyComponent = () => {
  return (
    <div className="page-container">
      <div className="container container--md">
        <div className="card animate-fade-in">
          <h1 className="page-title">Page Title</h1>
          <p className="page-subtitle">Friendly subtitle text</p>
          
          {/* Your content here */}
          
          <button className="btn btn-primary btn-full mt-4">
            Action Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyComponent;
```

---

**Remember**: The entire design system is defined in `src/index.css`. 
All colors, spacing, and components can be customized there!
