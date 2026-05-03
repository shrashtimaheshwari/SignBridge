import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function GoogleSignInButton() {
  const { googleLogin } = useAuth();
  const initialized = useRef(false);
  const btnRef = useRef(null);

  useEffect(() => {
    if (window.google && !initialized.current) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse
      });
      
      window.google.accounts.id.renderButton(
        btnRef.current,
        { theme: 'filled_blue', size: 'large', shape: 'pill', text: 'continue_with', width: 330 }
      );
      
      initialized.current = true;
    } else if (!window.google) {
      console.warn("Google Identity script not loaded yet.");
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    const res = await googleLogin(response.credential);
    if (!res.success) {
      alert("Google Sign In failed: " + res.message);
    }
  };

  return (
    <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div ref={btnRef}></div>
    </div>
  );
}
