import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import signbridgeLogo from '../assets/signbridge.png';
import './LandingPage.css';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (user) {
      navigate("/app");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="landing-container" style={{ paddingTop: '0', justifyContent: 'flex-start' }}>
      
      <nav style={{ width: '100%', maxWidth: '1400px', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={signbridgeLogo} alt="SignBridge" style={{ height: '65px', objectFit: 'contain' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {loading ? null : user ? (
            <Link to="/app" className="btn btn-blue" style={{ textDecoration: 'none' }}>Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" style={{ color: '#00cfff', textDecoration: 'none', fontWeight: 'bold' }}>Login</Link>
              <Link to="/register" className="btn btn-blue" style={{ textDecoration: 'none' }}>Register</Link>
            </>
          )}
        </div>
      </nav>

      <div className="landing-content">
        <h1 className="landing-title">
          Connect Beyond Words <br />
          <span className="accent-text">AI Sign Language Translator</span>
        </h1>
        <p className="landing-subtitle">
          Experience seamless, real-time American Sign Language (ASL) translation. Break communication barriers instantly and connect with anyone in the world through our built-in, accessible video calling platform.
        </p>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🖐️</div>
            <h3>Real-Time Tracking</h3>
            <p>Smooth, highly accurate hand tracking that instantly recognizes your signs from any angle.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Instant Translation</h3>
            <p>Experience lightning-fast translation from sign language to text without any noticeable delay.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📹</div>
            <h3>Crystal Clear Video</h3>
            <p>Secure, high-quality video and audio calling designed to help you stay connected effortlessly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗣️</div>
            <h3>Live Captions & Audio</h3>
            <p>Automatically turns your sign language into readable subtitles and physically speaks them out loud.</p>
          </div>
        </div>

        <div className="landing-actions">
          <button className="btn-primary-pulse" onClick={handleStart}>
            Start Translating
          </button>
          <button className="btn-secondary" onClick={handleStart}>
            Join Room
          </button>
        </div>
      </div>
      
      <div className="landing-footer" style={{ paddingBottom: '2rem', marginTop: 'auto' }}>
        <p>Empowering the deaf and hard of hearing community to communicate freely.</p>
      </div>
    </div>
  );
}
