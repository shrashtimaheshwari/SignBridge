import React, { useState, useEffect, useRef } from 'react';
import { detectJ, detectZ } from '../utils/motionDetector';

export default function SignTranslator({ socket, onSentenceChange }) {
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSentence, setCurrentSentence] = useState("");
  const [predictedLetter, setPredictedLetter] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [handDetected, setHandDetected] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [serverOnline, setServerOnline] = useState(socket ? socket.connected : false);

  const isProcessingRef = useRef(false);
  const predictionsBuffer = useRef([]);
  const pinkyBuffer = useRef([]);
  const indexBuffer = useRef([]);
  const lastHandTime = useRef(Date.now());
  const cooldownActive = useRef(false);
  const cooldownTimer = useRef(null);
  const eventsRegistered = useRef(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(true);
      setError("");
    } catch (err) {
      setError("Camera access denied. Please allow camera in your browser settings.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  // FRAME SENDING
  useEffect(() => {
    let intervalId;
    if (isCameraOn) {
      intervalId = setInterval(() => {
        if (isProcessingRef.current) return;
        if (!videoRef.current || !captureCanvasRef.current) return;
        if (videoRef.current.readyState !== 4) return;

        const canvas = captureCanvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        const base64Data = base64.split(',')[1];

        isProcessingRef.current = true;
        socket.emit('process_frame', base64Data);
      }, 200);
    }
    return () => clearInterval(intervalId);
  }, [isCameraOn, socket]);

  // RECEIVING PREDICTIONS
  useEffect(() => {
    if (!socket || eventsRegistered.current) return;
    eventsRegistered.current = true;

    const onConnect = () => setServerOnline(true);
    const onDisconnect = () => setServerOnline(false);

    const handleResult = (data) => {
      isProcessingRef.current = false;
      setHandDetected(data.hand_detected);
      
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
        setPredictedLetter(data.letter);
        setConfidence(data.confidence);

        // Add to buffer
        predictionsBuffer.current.push(data.letter);
        if (predictionsBuffer.current.length > 10) {
          predictionsBuffer.current.shift();
        }

        // Check if same letter 7+ times
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
            cooldownTimer.current = setTimeout(() => {
              cooldownActive.current = false;
            }, 1500);
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

    const handleError = (data) => {
      isProcessingRef.current = false;
      console.warn('Prediction error:', data.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('prediction_result', handleResult);
    socket.on('prediction_error', handleError);
    
    setServerOnline(socket.connected);

    return () => {
      eventsRegistered.current = false;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('prediction_result', handleResult);
      socket.off('prediction_error', handleError);
    };
  }, [socket]);

  // CALL onSentenceChange
  useEffect(() => {
    if (onSentenceChange) onSentenceChange(currentSentence);
  }, [currentSentence, onSentenceChange]);

  const deleteLastLetter = () => {
    setCurrentSentence(prev => prev.slice(0, -1));
  };

  const copyText = () => {
    navigator.clipboard.writeText(currentSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="translator-card" style={{ width: '100%', maxWidth: '1200px' }}>
      {!serverOnline && (
        <div className="error-message" style={{ marginBottom: '1rem' }}>
          Server offline — please start the backend server
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', width: '100%', flex: 1, minHeight: 0 }}>
        
        {/* Left Column: Camera and Predictions */}
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 0 }}>
          <div className="video-container" style={{ width: '100%', flexShrink: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            <canvas ref={captureCanvasRef} width={320} height={240} style={{ display: 'none' }} />
          </div>

          <div className="prediction-display">
            <div className="predicted-letter">
              {predictedLetter || "—"}
            </div>
            <div className="confidence-bar-container">
              <div className="confidence-bar-fill" style={{ width: `${confidence * 100}%` }} />
            </div>
            <span className="confidence-text">
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className={`status-badge ${handDetected ? 'detected' : 'not-detected'}`}>
            {handDetected ? "Hand Detected" : "No Hand"}
          </div>
        </div>

        {/* Right Column: Text Area and Buttons */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
          <textarea 
            className="sentence-box"
            value={currentSentence}
            readOnly
            placeholder="Your signed text will appear here..."
            style={{ flex: 1, minHeight: '150px' }}
          />

          {error && <div className="error-message">{error}</div>}

          <div className="button-row" style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={startCamera} disabled={isCameraOn} className="btn btn-green">
              Start Camera
            </button>
            <button onClick={stopCamera} disabled={!isCameraOn} className="btn btn-red">
              Stop Camera
            </button>
            <button onClick={() => setCurrentSentence("")} className="btn btn-gray">
              Clear Text
            </button>
            <button onClick={deleteLastLetter} className="btn btn-red" style={{ background: 'rgba(255, 50, 50, 0.1)', color: '#ff6b6b', border: '1px solid rgba(255, 50, 50, 0.3)' }}>
              Delete
            </button>
            <button onClick={copyText} className="btn btn-blue" style={{ gridColumn: 'span 2' }}>
              {copied ? "Copied!" : "Copy Text"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
