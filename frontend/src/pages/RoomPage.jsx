import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoCall from '../components/VideoCall';
import socket from '../socket';

export default function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1300px', margin: '0 auto' }}>
      <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: '#00cfff', cursor: 'pointer', fontWeight: 'bold' }}>
          &larr; Exit Room
        </button>
      </div>
      <div style={{ width: '100%' }}>
        <VideoCall socket={socket} roomCode={code} />
      </div>
    </div>
  );
}
