import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/LandingPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '60vh', gap: '2rem' }}>
      <h2 style={{ color: '#fff', fontSize: '2.5rem', margin: 0 }}>Select Session Mode</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', width: '100%', maxWidth: '900px', padding: '1rem' }}>
        
        <div 
          onClick={() => navigate('/app/video')} 
          className="translator-card" 
          style={{ cursor: 'pointer', flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(0, 207, 255, 0.3)', transition: 'transform 0.2s ease', padding: '2.5rem 2rem' }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📹</div>
          <h3 style={{ color: '#00cfff', fontSize: '1.5rem', margin: '0 0 1rem 0' }}>Video Call Room</h3>
          <p style={{ color: '#a9a9b3', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>Connect with another person using WebRTC while actively translating American Sign Language live on-screen.</p>
        </div>

        <div 
          onClick={() => navigate('/app/solo')} 
          className="translator-card" 
          style={{ cursor: 'pointer', flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(123, 94, 167, 0.3)', transition: 'transform 0.2s ease', padding: '2.5rem 2rem' }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🙌</div>
          <h3 style={{ color: '#7b5ea7', fontSize: '1.5rem', margin: '0 0 1rem 0' }}>Solo Translation</h3>
          <p style={{ color: '#a9a9b3', textAlign: 'center', margin: 0, lineHeight: '1.5' }}>Practice or translate American Sign Language locally using your camera directly into text without joining a call.</p>
        </div>

      </div>
    </div>
  );
}
