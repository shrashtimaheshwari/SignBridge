import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';
import '../App.css';
import '../components/LandingPage.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const validate = () => {
    let temp = {};
    if (formData.name.length < 2) temp.name = "Name must be at least 2 characters";
    if (!/\S+@\S+\.\S+/.test(formData.email)) temp.email = "Valid email required";
    if (formData.password.length < 6) temp.password = "Password must be at least 6 characters";
    if (formData.confirm !== formData.password) temp.confirm = "Passwords must match";
    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;
    
    const res = await register(formData.name, formData.email, formData.password);
    if (res.success) {
      navigate("/app");
    } else {
      setServerError(res.message);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="landing-container" style={{ position: 'relative', justifyContent: 'center' }}>
      <Link to="/" style={{ position: 'absolute', top: '2rem', left: '2rem', color: '#00cfff', textDecoration: 'none', fontSize: '1rem', fontWeight: 'bold' }}>&larr; Back to Home</Link>
      <div className="translator-card" style={{ maxWidth: '450px', width: '100%' }}>
        <h2 className="landing-title" style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>Create Account</h2>
        <p style={{ color: '#a9a9b3', marginBottom: '2rem' }}>Join AI Sign Language Translator</p>
        
        {serverError && <div className="error-message">{serverError}</div>}
        
        <form onSubmit={handleRegister} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input name="name" type="text" placeholder="Full Name" className="sentence-box" style={{ minHeight: 'auto', padding: '0.8rem 1rem' }} value={formData.name} onChange={handleChange} />
            {errors.name && <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.name}</span>}
          </div>
          <div>
             <input name="email" type="email" placeholder="Email Address" className="sentence-box" style={{ minHeight: 'auto', padding: '0.8rem 1rem' }} value={formData.email} onChange={handleChange} />
             {errors.email && <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{errors.email}</span>}
          </div>
          <div style={{ position: 'relative' }}>
             <input name="password" type={showPwd ? "text" : "password"} placeholder="Password" className="sentence-box" style={{ minHeight: 'auto', padding: '0.8rem 1rem', width: '100%' }} value={formData.password} onChange={handleChange} />
             <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#00cfff', cursor: 'pointer', fontWeight: 'bold' }}>{showPwd ? "Hide" : "Show"}</button>
             {errors.password && <span style={{ color: '#ff6b6b', fontSize: '0.85rem', display: 'block' }}>{errors.password}</span>}
          </div>
          <div>
             <input name="confirm" type={showPwd ? "text" : "password"} placeholder="Confirm Password" className="sentence-box" style={{ minHeight: 'auto', padding: '0.8rem 1rem' }} value={formData.confirm} onChange={handleChange} />
             {errors.confirm && <span style={{ color: '#ff6b6b', fontSize: '0.85rem', display: 'block' }}>{errors.confirm}</span>}
          </div>
          
          <button type="submit" className="btn btn-primary-pulse" style={{ marginTop: '1rem' }}>Sign Up</button>
          <GoogleSignInButton />
        </form>
        
        <p style={{ marginTop: '2rem', color: '#a9a9b3' }}>
          Already have an account? <Link to="/login" style={{ color: '#00cfff', textDecoration: 'none', fontWeight: 'bold' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
