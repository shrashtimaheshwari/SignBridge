import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { generateOTP, sendOTPEmail, saveOTPToStorage, verifyOTP, clearOTPFromStorage } from '../utils/otpService';
import '../App.css';
import '../components/LandingPage.css';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [enteredOTP, setEnteredOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  
  const navigate = useNavigate();

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    setLoading(true);
    try {
      const checkRes = await fetch("http://127.0.0.1:3000/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      });
      const checkData = await checkRes.json();
      
      if (!checkData.exists) {
        setError("No account found with this email address.");
        setLoading(false);
        return;
      }

      const otp = generateOTP();
      await sendOTPEmail(email, otp);
      saveOTPToStorage(email, otp);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Failed to send OTP. Check your email address or your EmailJS configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = (e) => {
    e.preventDefault();
    setError('');
    
    if (verifyOTP(enteredOTP)) {
      setStep(3);
    } else {
      setError("Incorrect OTP. Please try again.");
    }
  };

  const handleResend = () => {
    clearOTPFromStorage();
    setStep(1);
    setEnteredOTP('');
    setError('');
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    try {
      const storedEmail = localStorage.getItem("signbridge_reset_email");
      const res = await fetch("http://127.0.0.1:3000/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail, new_password: newPassword })
      });
      
      const data = await res.json();
      if (res.ok) {
        clearOTPFromStorage();
        setSuccessMsg("Password reset successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.detail || "Failed to reset password.");
      }
    } catch (err) {
      setError("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container" style={{ position: 'relative', justifyContent: 'center' }}>
      <div className="translator-card" style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="landing-title" style={{ fontSize: '2rem', margin: '0' }}>Reset Password</h2>
          <span style={{ color: '#00cfff', fontWeight: 'bold', fontSize: '0.9rem' }}>Step {step} of 3</span>
        </div>
        <p style={{ color: '#a9a9b3', marginBottom: '2rem' }}>Securely regain access to your account</p>
        
        {error && <div className="error-message">{error}</div>}
        {successMsg && <div className="error-message" style={{ background: 'rgba(50,255,100,0.1)', borderColor: 'rgba(50,255,100,0.3)', color: '#4ade80' }}>{successMsg}</div>}
        
        {step === 1 && (
          <form onSubmit={handleStep1} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="email" 
              placeholder="Email Address" 
              className="sentence-box" 
              style={{ minHeight: 'auto', padding: '0.8rem 1rem' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className="btn btn-primary-pulse" style={{ marginTop: '1rem' }}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>OTP sent to <strong style={{ color: '#00cfff' }}>{email}</strong></p>
            <input 
              type="text" 
              maxLength="6"
              placeholder="Enter 6-digit OTP" 
              className="sentence-box" 
              style={{ minHeight: 'auto', padding: '0.8rem 1rem', letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}
              value={enteredOTP}
              onChange={(e) => setEnteredOTP(e.target.value.replace(/\D/g, ''))}
              required
            />
            <button type="submit" className="btn btn-primary-pulse" style={{ marginTop: '1rem' }}>
              Verify OTP
            </button>
            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button type="button" onClick={handleResend} style={{ background: 'none', border: 'none', color: '#a9a9b3', cursor: 'pointer', textDecoration: 'underline' }}>Resend OTP</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input 
                type={showPwd ? "text" : "password"} 
                placeholder="New Password" 
                className="sentence-box" 
                style={{ minHeight: 'auto', padding: '0.8rem 1rem', width: '100%' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
            
            <input 
              type={showPwd ? "text" : "password"} 
              placeholder="Confirm Password" 
              className="sentence-box" 
              style={{ minHeight: 'auto', padding: '0.8rem 1rem' }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            <button type="submit" disabled={loading} className="btn btn-primary-pulse" style={{ marginTop: '1rem' }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#00cfff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>&larr; Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
