# Quick Start Guide - Layout Components

## Using Layout Components

### For Public Pages (Landing, Login, Signup, etc.)

```jsx
import PublicLayout from './components/PublicLayout/PublicLayout';

function MyPublicPage() {
  return (
    <PublicLayout>
      {/* Your page content goes here */}
      <div className="page-container">
        <h1>My Page</h1>
      </div>
    </PublicLayout>
  );
}
```

**Result:**
```
┌─────────────────────────────────┐
│         NAVBAR                  │ ← Logo + Navigation Links
├─────────────────────────────────┤
│                                 │
│                                 │
│       YOUR CONTENT              │
│                                 │
│                                 │
├─────────────────────────────────┤
│         FOOTER                  │ ← Contact & Links
└─────────────────────────────────┘
```

### For Dashboard Pages (Teacher Dashboard, Exams, etc.)

```jsx
import DashboardLayout from './components/DashboardLayout/DashboardLayout';

function MyDashboardPage() {
  return (
    <DashboardLayout>
      {/* Your dashboard content goes here */}
      <div className="py-6">
        <div className="container">
          <h1>My Dashboard</h1>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

**Desktop Result:**
```
┌──────────────────────────────────────┐
│  HEADER: Logo | Academy | Avatar     │
├─────────┬────────────────────────────┤
│ SIDEBAR │                            │
│         │                            │
│ 🏠 Dash │     YOUR CONTENT           │
│ 👥 Stud │                            │
│ 📝 Exam │                            │
│ 📊 Resu │                            │
│ ⚙️ Sett │                            │
│         │                            │
│ 🚪 Logo │                            │
├─────────┴────────────────────────────┤
│            FOOTER                    │
└──────────────────────────────────────┘
```

**Mobile Result (Sidebar Hidden):**
```
┌──────────────────────────────────────┐
│  ☰ Logo | Avatar                     │
├──────────────────────────────────────┤
│                                      │
│                                      │
│         YOUR CONTENT                 │
│         (Full Width)                 │
│                                      │
│                                      │
├──────────────────────────────────────┤
│            FOOTER                    │
└──────────────────────────────────────┘
```

## Customizing Navigation

### Navbar Links
Edit `src/components/Navbar/Navbar.jsx`:

```jsx
const navItems = [
  { path: '/', label: 'Home' },
  { path: '/login', label: 'Teacher Login' },
  { path: '/signup', label: 'Get Started', isPrimary: true }
];
```

### Sidebar Links
Edit `src/components/DashboardLayout/DashboardLayout.jsx`:

```jsx
const navItems = [
  { path: `/${academySlug}/dashboard`, icon: '🏠', label: 'Dashboard' },
  { path: `/${academySlug}/students`, icon: '👥', label: 'Students' },
  // Add more items...
];
```

## Styling Tips

### Using Design System Classes
All layouts use the global design system. Use these utilities:

```jsx
// Containers
<div className="container">         // Max-width container
<div className="container--sm">     // Smaller container
<div className="page-container">    // Centered page layout

// Cards
<div className="card">              // Standard card
<div className="card card--interactive"> // Hoverable card

// Spacing
<div className="py-6">              // Vertical padding
<div className="mb-5">              // Bottom margin
<div className="gap-4">             // Gap between flex/grid items

// Layout
<div className="flex justify-between items-center">
<div className="grid grid-cols-3 gap-4">
```

## Common Patterns

### Public Page with Centered Content
```jsx
<PublicLayout>
  <div className="page-container">
    <div className="container container--sm">
      <div className="card animate-fade-in">
        <h1 className="page-title">Title</h1>
        <p className="page-subtitle">Subtitle</p>
        {/* Content */}
      </div>
    </div>
  </div>
</PublicLayout>
```

### Dashboard Page with Header and Stats
```jsx
<DashboardLayout>
  {/* Header Section */}
  <div style={{
    background: 'linear-gradient(135deg, var(--primary-purple), var(--accent-pink))',
    padding: 'var(--spacing-3xl) var(--spacing-md)',
    color: 'white'
  }}>
    <div className="container">
      <h1>Welcome!</h1>
    </div>
  </div>

  {/* Content Section */}
  <div className="py-6">
    <div className="container">
      <div className="grid grid-cols-3 gap-4">
        {/* Cards... */}
      </div>
    </div>
  </div>
</DashboardLayout>
```

## Dos and Don'ts

### ✅ DO:
- Use layout components for all pages
- Use design system classes
- Keep content inside `<div className="container">`
- Add animations with `animate-fade-in`
- Use semantic HTML

### ❌ DON'T:
- Create custom navbar/footer for individual pages
- Use inline styles excessively (use CSS variables)
- Nest layouts inside each other
- Modify layout components directly for page-specific needs
- Override layout CSS in page components

## Troubleshooting

**Navbar not showing?**
- Make sure you wrapped your page with `<PublicLayout>`
- Check imports are correct

**Sidebar not working?**
- Verify academySlug is available in route params
- Check mobile responsiveness (sidebar is hidden on mobile by default)

**Footer appearing twice?**
- Remove any standalone `<Footer />` from pages
- Layouts already include footer

**Active route not highlighting?**
- Ensure the link path exactly matches the current route
- Check useLocation() is working properly

---

For more details, see `LAYOUT_COMPONENTS_SUMMARY.md`
