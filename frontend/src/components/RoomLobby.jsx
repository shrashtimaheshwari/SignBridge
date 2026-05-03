import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoomLobby() {
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/room/create");
      const data = await res.json();
      navigate(`/app/room/${data.room_code}`);
    } catch (err) {
      alert("Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!inputCode) return;
    const code = inputCode.includes('/room/')
      ? inputCode.split('/room/')[1].trim()
      : inputCode.trim();
    navigate(`/app/room/${code}`);
  };

  return (
    <div className="videocall-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '2rem 2.5rem', maxWidth: '500px', margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', width: '100%' }}>
        <h2 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1.6rem' }}>Start a new meeting</h2>
        <button 
          onClick={handleCreate} 
          disabled={loading}
          className="btn btn-primary-pulse" 
          style={{ width: '100%', maxWidth: '300px', fontSize: '1.05rem', padding: '0.9rem' }}>
          {loading ? "Creating..." : "Create New Room"}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '350px', margin: '0.5rem 0' }}>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        <span style={{ color: '#a9a9b3', padding: '0 1rem', fontSize: '0.9rem' }}>or join an existing meeting</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
      </div>

      <div style={{ width: '100%', maxWidth: '300px' }}>
        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input 
            type="text" 
            placeholder="Enter room code or paste link" 
            className="sentence-box"
            style={{ width: '100%', minHeight: 'auto', padding: '0.75rem 1.25rem', fontSize: '1rem', boxSizing: 'border-box' }}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
          />
          <button type="submit" disabled={!inputCode} className="btn btn-blue" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}>
            Join Room
          </button>
        </form>
      </div>

    </div>
  );
}
