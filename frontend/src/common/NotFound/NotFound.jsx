import React from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import notFoundAnimation from '../../assets/animations/404-animation.json';
import './NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="notfound-container">
            <div className="notfound-content">
                <div className="notfound-animation">
                    <Lottie
                        animationData={notFoundAnimation}
                        loop={true}
                        autoplay={true}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>

                <h1 className="notfound-title">Page Not Found</h1>
                <p className="notfound-subtitle">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="notfound-actions">
                    <button
                        className="notfound-btn notfound-btn-primary"
                        onClick={() => navigate(-1)}
                    >
                        ← Go Back
                    </button>
                    <button
                        className="notfound-btn notfound-btn-secondary"
                        onClick={() => navigate('/')}
                    >
                        🏠 Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
