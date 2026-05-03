import React, { useState, useEffect, useRef } from 'react';
import RoomInfoBar from './RoomInfoBar';
import { detectJ, detectZ } from '../utils/motionDetector';

export default function VideoCall({ socket, roomCode }) {
  const [myRole, setMyRole] = useState(null); 
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [remoteSubtitle, setRemoteSubtitle] = useState("");
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Integrated Translation States
  const [currentSentence, setCurrentSentence] = useState("");
  const [copied, setCopied] = useState(false);
  const [translationActive, setTranslationActive] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  
  const captureCanvasRef = useRef(null);
  const isProcessingRef = useRef(false);
  const predictionsBuffer = useRef([]);
  const pinkyBuffer = useRef([]);
  const indexBuffer = useRef([]);
  const lastHandTime = useRef(Date.now());
  const cooldownActive = useRef(false);
  const cooldownTimer = useRef(null);

  const ttsEnabledRef = useRef(true);
  const toggleTts = () => {
    const newVal = !ttsEnabled;
    setTtsEnabled(newVal);
    ttsEnabledRef.current = newVal;
  };

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const subtitleTimerRef = useRef(null);
  const eventsRegistered = useRef(false);
  const spokenWordsCount = useRef(0);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice_candidate', {
          candidate: event.candidate,
          room_id: roomCode
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setConnectionStatus('disconnected');
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const joinRoom = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true, audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      socket.emit('join_room', { room_id: roomCode });
      setConnectionStatus('waiting');
      setErrorMsg("");
    } catch (err) {
      setErrorMsg('Camera and microphone access required. Please allow permissions.');
    }
  };

  const autoJoinRegistered = useRef(false);
  useEffect(() => {
    if (roomCode && socket && !autoJoinRegistered.current) {
      autoJoinRegistered.current = true;
      joinRoom();
    }
  }, [roomCode, socket]);

  useEffect(() => {
    if (!socket || eventsRegistered.current) return;
    eventsRegistered.current = true;

    socket.on('room_joined', async (data) => {
      setMyRole(data.role);
      createPeerConnection();
    });

    socket.on('user_joined', async () => {
      const pc = peerConnectionRef.current;
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_offer', { 
        offer: offer, room_id: roomCode 
      });
    });

    socket.on('webrtc_offer', async (data) => {
      const pc = peerConnectionRef.current;
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc_answer', { 
        answer: answer, room_id: roomCode 
      });
    });

    socket.on('webrtc_answer', async (data) => {
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.answer)
      );
    });

    socket.on('ice_candidate', async (data) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (err) {
        console.error('ICE candidate error:', err);
      }
    });

    socket.on('receive_subtitle', (data) => {
      setRemoteSubtitle(data.text);
      setShowSubtitle(true);
      if (subtitleTimerRef.current) {
        clearTimeout(subtitleTimerRef.current);
      }
      subtitleTimerRef.current = setTimeout(() => {
        setShowSubtitle(false);
      }, 4000);

      // TEXT TO SPEECH 
      if (ttsEnabledRef.current && data.text.endsWith(' ')) {
        const words = data.text.trim().split(' ').filter(w => w.length > 0);
        if (words.length > spokenWordsCount.current) {
          const latestWord = words[words.length - 1];
          const utterance = new SpeechSynthesisUtterance(latestWord);
          window.speechSynthesis.speak(utterance);
          spokenWordsCount.current = words.length;
        }
      } else if (data.text.length === 0) {
        spokenWordsCount.current = 0;
      }
    });

    // Native Prediction Listener embedded in VideoCall
    const handlePrediction = (data) => {
      isProcessingRef.current = false;
      
      if (data.hand_detected && data.pinky_tip && data.index_tip) {
        lastHandTime.current = Date.now();
        
        // Update buffers (max 20 entries)
        pinkyBuffer.current.push(data.pinky_tip);
        if (pinkyBuffer.current.length > 20) pinkyBuffer.current.shift();
      
        indexBuffer.current.push(data.index_tip);
        if (indexBuffer.current.length > 20) indexBuffer.current.shift();
      
        // Check J
        if (!cooldownActive.current && detectJ(pinkyBuffer.current)) {
          setCurrentSentence(prev => prev + 'J');
          pinkyBuffer.current = [];
          
          cooldownActive.current = true;
          if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
          cooldownTimer.current = setTimeout(() => { cooldownActive.current = false; }, 1500);
          return;
        }
        
        // Check Z
        if (!cooldownActive.current && detectZ(indexBuffer.current)) {
          setCurrentSentence(prev => prev + 'Z');
          indexBuffer.current = [];
          
          cooldownActive.current = true;
          if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
          cooldownTimer.current = setTimeout(() => { cooldownActive.current = false; }, 1500);
          return;
        }
      }

      if (data.hand_detected && data.letter) {
        lastHandTime.current = Date.now();
        if (data.letter.toLowerCase() === 'space' || data.letter.toLowerCase() === 'del' || data.letter.toLowerCase() === 'nothing') {
          return;
        }
        predictionsBuffer.current.push(data.letter);
        if (predictionsBuffer.current.length > 10) predictionsBuffer.current.shift();

        if (!cooldownActive.current) {
          const buf = predictionsBuffer.current;
          const counts = {};
          buf.forEach(l => counts[l] = (counts[l] || 0) + 1);
          const topLetter = Object.keys(counts).sort((a,b) => counts[b] - counts[a])[0];
          
          if (counts[topLetter] >= 7) {
            setCurrentSentence(prev => prev + topLetter);
            predictionsBuffer.current = [];
            cooldownActive.current = true;
            if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
            cooldownTimer.current = setTimeout(() => { cooldownActive.current = false; }, 1500);
          }
        }
      } else if (!data.hand_detected) {
        if (Date.now() - lastHandTime.current > 2000) {
          setCurrentSentence(prev => {
            if (prev.length > 0 && prev[prev.length - 1] !== ' ') {
              return prev + ' ';
            }
            return prev;
          });
          lastHandTime.current = Date.now();
        }
      }
    };

    socket.on('prediction_result', handlePrediction);
    socket.on('prediction_error', (data) => {
      isProcessingRef.current = false;
      console.warn('Prediction error:', data.message);
    });

    socket.on('room_full', () => {
      setErrorMsg('Room is full. Please try a different Room ID.');
      setConnectionStatus('idle');
    });

    socket.on('user_left', () => {
      setConnectionStatus('disconnected');
      setErrorMsg('The other user has left the call.');
    });

    return () => {
      eventsRegistered.current = false;
      socket.off('room_joined');
      socket.off('user_joined');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('ice_candidate');
      socket.off('receive_subtitle');
      socket.off('prediction_result', handlePrediction);
      socket.off('prediction_error');
      socket.off('room_full');
      socket.off('user_left');
    };
  }, [socket, roomCode]);

  // Frame Sender hook grabbing WebRTC webcam
  useEffect(() => {
    let intervalId;
    if ((connectionStatus === 'connected' || connectionStatus === 'waiting') && translationActive && isVideoOn) {
      intervalId = setInterval(() => {
        if (isProcessingRef.current) return;
        if (!localVideoRef.current || !captureCanvasRef.current) return;
        if (localVideoRef.current.readyState !== 4) return;

        const canvas = captureCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(localVideoRef.current, 0, 0, 320, 240);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        const base64Data = base64.split(',')[1];

        isProcessingRef.current = true;
        socket.emit('process_frame', base64Data);
      }, 200);
    }
    return () => clearInterval(intervalId);
  }, [connectionStatus, translationActive, isVideoOn, socket]);

  // Emit current generated sentence
  useEffect(() => {
    if (typeof currentSentence === 'string' && connectionStatus === 'connected' && roomCode) {
      socket.emit('send_subtitle', { 
        text: currentSentence, 
        room_id: roomCode 
      });
    }
  }, [currentSentence, connectionStatus, roomCode, socket]);

  const endCall = () => {
    socket.emit('leave_room', { room_id: roomCode });
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    setConnectionStatus('idle');
    setMyRole(null);
    setRemoteSubtitle('');
    setShowSubtitle(false);
    setCurrentSentence('');
    spokenWordsCount.current = 0;
  };

  const toggleTranslation = () => {
    setTranslationActive(!translationActive);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
      }
    }
  };

  const deleteLastLetter = () => {
    setCurrentSentence(prev => prev.slice(0, -1));
  };

  const copyText = () => {
    navigator.clipboard.writeText(currentSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let statusText = "Ready to Join";
  if (connectionStatus === "waiting") statusText = "Waiting for other user...";
  if (connectionStatus === "connected") statusText = "🟢 Connected";
  if (connectionStatus === "disconnected") statusText = "🔴 Disconnected";

  return (
    <div className="videocall-card" style={{ width: '100%', maxWidth: '1200px', padding: '1.5rem' }}>
      <RoomInfoBar roomCode={roomCode} />

      <div className="status-row" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
        <span className={`status-badge status-${connectionStatus}`}>
          {statusText}
        </span>
        <div style={{display: 'flex', gap: '8px'}}>
          <button onClick={toggleTts} className={`btn ${ttsEnabled ? 'btn-green' : 'btn-gray'}`}>
            Read Aloud: {ttsEnabled ? 'ON' : 'OFF'}
          </button>
          {connectionStatus !== 'idle' && (
            <button onClick={endCall} className="btn btn-red">
              End Call
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="error-message">{errorMsg}</div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', width: '100%', flex: 1, minHeight: 0 }}>

        {/* Left Column: Video Feed */}
        <div style={{ flex: '1 1 450px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div className="videos-grid" style={{ flex: 1, minHeight: 0, marginBottom: 0 }}>
            <div className="video-wrapper remote-wrapper">
              <p className="video-label">Remote User</p>
              <video ref={remoteVideoRef} autoPlay playsInline />
              <div className={`subtitle-overlay ${showSubtitle ? 'visible' : 'hidden'}`}>
                {remoteSubtitle}
              </div>
            </div>

            <div className="video-wrapper local-wrapper">
              <p className="video-label">You</p>
              <video ref={localVideoRef} autoPlay muted playsInline />
            </div>
          </div>
        </div>

        {/* Right Column: Text Area and Buttons */}
        <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: 0 }}>
          <canvas ref={captureCanvasRef} width={320} height={240} style={{ display: 'none' }} />
          
          <textarea 
            className="sentence-box"
            value={currentSentence}
            readOnly
            placeholder="Your translated sign language text will appear here..."
            style={{ flex: 1, minHeight: '120px', width: '100%', boxSizing: 'border-box' }}
          />

          <div className="button-row" style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button onClick={toggleVideo} className={`btn ${isVideoOn ? 'btn-green' : 'btn-red'}`}>
              Video {isVideoOn ? 'ON' : 'OFF'}
            </button>
            <button onClick={toggleAudio} className={`btn ${isAudioOn ? 'btn-green' : 'btn-red'}`}>
              Mic {isAudioOn ? 'ON' : 'OFF'}
            </button>
            <button onClick={toggleTranslation} className={`btn ${translationActive ? 'btn-blue' : 'btn-gray'}`}>
              Translation {translationActive ? 'ON' : 'OFF'}
            </button>
            <button onClick={() => setCurrentSentence("")} className="btn btn-gray">
              Clear Text
            </button>
            <button onClick={deleteLastLetter} className="btn btn-red" style={{ background: 'rgba(255, 50, 50, 0.1)', color: '#ff6b6b', border: '1px solid rgba(255, 50, 50, 0.3)' }}>
              Delete
            </button>
            <button onClick={copyText} className="btn btn-blue">
              {copied ? "Copied!" : "Copy Text"}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
