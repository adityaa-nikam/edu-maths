import React from 'react';
import Navbar from '../../common/Navbar/Navbar';
import Footer from '../../common/Footer/Footer';

const PublicLayout = ({ children }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
