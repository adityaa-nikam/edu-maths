import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--neutral-900)',
      color: 'white',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div className="py-6">
          <div className="grid grid-cols-3 gap-5">
            {/* Brand Section */}
            <div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                marginBottom: 'var(--spacing-md)',
                color: 'white'
              }}>
                📚 EduMaths
              </h3>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--neutral-300)',
                lineHeight: '1.6'
              }}>
                Educational platform for mathematics learning and assessment.
                Empowering teachers and students worldwide.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: 'var(--spacing-md)',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Quick Links
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}>
                <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <a
                    href="/"
                    style={{
                      color: 'var(--neutral-300)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      transition: 'color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'white'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--neutral-300)'}
                  >
                    Home
                  </a>
                </li>
                <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <a
                    href="/login"
                    style={{
                      color: 'var(--neutral-300)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      transition: 'color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'white'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--neutral-300)'}
                  >
                    Teacher Login
                  </a>
                </li>
                <li style={{ marginBottom: 'var(--spacing-sm)' }}>
                  <a
                    href="/signup"
                    style={{
                      color: 'var(--neutral-300)',
                      textDecoration: 'none',
                      fontSize: '0.95rem',
                      transition: 'color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'white'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--neutral-300)'}
                  >
                    Get Started
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: 'var(--spacing-md)',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Contact
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0'
              }}>
                <li style={{
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--neutral-300)',
                  fontSize: '0.95rem'
                }}>
                  📧 info@edumaths.com
                </li>
                <li style={{
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--neutral-300)',
                  fontSize: '0.95rem'
                }}>
                  📱 +1234567890
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          borderTop: '1px solid var(--neutral-700)',
          paddingTop: 'var(--spacing-lg)',
          paddingBottom: 'var(--spacing-lg)',
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0',
            color: 'var(--neutral-400)',
            fontSize: '0.875rem'
          }}>
            © 2026 EduMaths. All rights reserved. Made with ❤️ for education.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

