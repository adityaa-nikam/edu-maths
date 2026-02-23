import React from 'react';
import Lottie from 'lottie-react';
import calculatorAnimation from '../../assets/animations/calculator-loader.json';
import './Preloader.css';

const Preloader = ({ exiting }) => {
    return (
        <div className={`preloader ${exiting ? 'preloader-exit' : ''}`}>
            <div className="preloader-content">
                <Lottie
                    animationData={calculatorAnimation}
                    loop={true}
                    autoplay={true}
                    style={{
                        width: '300px',
                        height: '300px'
                    }}
                />
                <h2 className="preloader-title">EduMaths</h2>
                <p className="preloader-text">Loading your learning experience...</p>
            </div>
        </div>
    );
};

export default Preloader;
