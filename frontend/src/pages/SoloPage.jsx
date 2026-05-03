import React, { useState } from 'react';
import SignTranslator from '../components/SignTranslator';
import socket from '../socket';
import { useNavigate } from 'react-router-dom';

export default function SoloPage() {
  const [sentence, setSentence] = useState("");
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ width: '100%', marginBottom: '1rem', maxWidth: '800px', display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={() => navigate('/app')} style={{ background: 'none', border: 'none', color: '#00cfff', cursor: 'pointer', fontWeight: 'bold' }}>
          &larr; Back to Mode Selection
        </button>
      </div>
      <div className="layout-column" style={{ maxWidth: '800px', width: '100%' }}>
        <SignTranslator socket={socket} onSentenceChange={setSentence} />
      </div>
    </div>
  );
}
