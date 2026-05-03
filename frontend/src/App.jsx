import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import signbridgeLogo from './assets/signbridge.png'
import './App.css'
import './components/VideoCall.css'

function App() {
  const { user, logout } = useAuth()

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "signbridge_token" && !e.newValue) {
        logout();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [logout]);

  return (
    <div className="app-container">
      <style>{`
        @media (max-width: 768px) {
          .user-name-display { display: none !important; }
        }
      `}</style>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem', boxSizing: 'border-box', borderBottom: 'none' }}>
        <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center' }}>
          <img src={signbridgeLogo} alt="SignBridge" style={{ height: '70px', objectFit: 'contain' }} />
        </div>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(90deg, #00cfff, #7b5ea7)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 0 15px rgba(0, 207, 255, 0.4)' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="user-name-display" style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                {user.name}
              </span>
            </div>
            <button onClick={logout} className="btn-red" style={{ padding: '0.5rem 1.25rem', borderRadius: '99px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease' }}>
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="main-layout" style={{ flexWrap: 'wrap' }}>
        <Outlet />
      </main>
    </div>
  )
}

export default App
