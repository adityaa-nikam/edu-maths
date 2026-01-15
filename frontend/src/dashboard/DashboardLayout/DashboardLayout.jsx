import React, { useState } from 'react';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile only
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
    const location = useLocation();
    const { academySlug } = useParams();
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/', { replace: true });
        } catch (error) {
            console.error('Logout error:', error);
            // Force navigation even if signOut fails
            navigate('/', { replace: true });
        }
    };

    // Helper to check if link is active
    const isActive = (path) => location.pathname === path;

    // Navigation items
    const navItems = [
        {
            path: `/${academySlug}/dashboard`,
            icon: '🏠',
            label: 'Dashboard',
        },
        {
            path: `/${academySlug}/students`,
            icon: '👥',
            label: 'Students',
        },
        {
            path: `/${academySlug}/exams`,
            icon: '📝',
            label: 'Exams',
        },
        {
            path: `/${academySlug}/results`,
            icon: '📊',
            label: 'Results',
        },
        {
            path: `/${academySlug}/settings`,
            icon: '⚙️',
            label: 'Settings',
        },
    ];

    return (
        <div className="dashboard-layout">
            {/* Top Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-container">
                    {/* Desktop Collapse Toggle */}
                    <button
                        className={`dashboard-collapse-toggle ${isCollapsed ? 'active' : ''}`}
                        onClick={toggleCollapse}
                        aria-label="Toggle sidebar"
                    >
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        className={`dashboard-mobile-toggle ${isSidebarOpen ? 'active' : ''}`}
                        onClick={toggleSidebar}
                        aria-label="Toggle sidebar"
                    >
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                        <span className="hamburger-line"></span>
                    </button>

                    {/* Logo */}
                    <Link to="/" className="dashboard-logo">
                        📚 EduMaths
                    </Link>

                    {/* User Info */}
                    <div className="dashboard-user-info">
                        <span className="dashboard-academy-name">{academySlug}</span>
                        <div className="dashboard-user-avatar">
                            👤
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard-main">
                {/* Sidebar */}
                <aside className={`dashboard-sidebar ${isSidebarOpen ? 'dashboard-sidebar--open' : ''} ${isCollapsed ? 'dashboard-sidebar--collapsed' : ''}`}>
                    {/* Sidebar Logo */}
                    <div className="dashboard-sidebar-logo">
                        <span className="dashboard-sidebar-logo-icon">📚</span>
                        {!isCollapsed && <span className="dashboard-sidebar-logo-text">EduMaths</span>}
                    </div>

                    <nav className="dashboard-nav">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`dashboard-nav-item ${isActive(item.path) ? 'dashboard-nav-item--active' : ''}`}
                                onClick={() => setIsSidebarOpen(false)}
                                title={isCollapsed ? item.label : ''}
                            >
                                <span className="dashboard-nav-icon">{item.icon}</span>
                                {!isCollapsed && <span className="dashboard-nav-label">{item.label}</span>}
                            </Link>
                        ))}
                    </nav>

                    {/* Logout */}
                    <div className="dashboard-sidebar-footer">
                        <button 
                            onClick={handleLogout} 
                            className="dashboard-logout-btn"
                            title={isCollapsed ? 'Logout' : ''}
                            style={{ 
                                background: 'none',
                                border: 'none',
                                width: '100%',
                                textAlign: 'left',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            <span className="dashboard-nav-icon">🚪</span>
                            {!isCollapsed && <span className="dashboard-nav-label">Logout</span>}
                        </button>
                    </div>
                </aside>

                {/* Overlay for mobile */}
                {isSidebarOpen && (
                    <div
                        className="dashboard-overlay"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="dashboard-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
