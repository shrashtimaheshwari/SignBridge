import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import '../App.css'; 
import '../components/LandingPage.css'; 

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (res.success) {
      navigate("/app");
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="landing-container" style={{ position: 'relative', justifyContent: 'center' }}>
      <Link to="/" style={{ position: 'absolute', top: '2rem', left: '2rem', color: '#00cfff', textDecoration: 'none', fontSize: '1rem', fontWeight: 'bold' }}>&larr; Back to Home</Link>
      <div className="translator-card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="landing-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Sign In</h2>
        <p style={{ color: '#a9a9b3', marginBottom: '2rem' }}>Welcome back to AI Sign Language Translator</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            className="sentence-box" 
            style={{ minHeight: 'auto', padding: '0.8rem 1rem' }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type={showPwd ? "text" : "password"} 
              placeholder="Password" 
              className="sentence-box" 
              style={{ minHeight: 'auto', padding: '0.8rem 1rem', width: '100%' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPwd(!showPwd)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#00cfff', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/forgot-password" style={{ color: '#a9a9b3', textDecoration: 'none', fontSize: '0.9rem' }}>Forgot password?</Link>
          </div>
          
          <button type="submit" className="btn btn-primary-pulse" style={{ marginTop: '1rem' }}>
            Sign In
          </button>
          
          <GoogleSignInButton />
        </form>
        
        <p style={{ marginTop: '2rem', color: '#a9a9b3' }}>
          Don't have an account? <Link to="/register" style={{ color: '#00cfff', textDecoration: 'none', fontWeight: 'bold' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
