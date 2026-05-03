import React, { useState } from 'react';

export default function RoomInfoBar({ roomCode }) {
  const [copyText, setCopyText] = useState("Copy Code");

  const fullUrl = `${window.location.origin}/app/room/${roomCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy Code"), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my SignBridge call',
          text: 'Join my sign language video call!',
          url: fullUrl
        });
      } catch (err) {
        // user cancelled or error ignoring
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div style={{ background: 'rgba(20, 20, 25, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ color: '#a9a9b3', fontWeight: 'bold' }}>Room Code:</span>
        <span style={{ background: 'rgba(0, 207, 255, 0.1)', color: '#00cfff', padding: '0.4rem 0.8rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '2px' }}>
          {roomCode}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={handleCopy} className="btn btn-gray" style={{ minWidth: '120px' }}>
          {copyText}
        </button>
        <button onClick={handleShare} className="btn btn-blue">
          Share
        </button>
      </div>
    </div>
  );
}
