import React from 'react';
import RoomLobby from '../components/RoomLobby';
import { useNavigate } from 'react-router-dom';

export default function VideoCallPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: '#00cfff', cursor: 'pointer', fontWeight: 'bold' }}>
          &larr; Back to Mode Selection
        </button>
      </div>
      <div style={{ width: '100%' }}>
        <RoomLobby />
      </div>
    </div>
  );
}
