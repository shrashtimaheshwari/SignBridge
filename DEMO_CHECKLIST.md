# Final Project Demo Checklist

Use this checklist during your presentation to ensure a flawless execution of the Sign Language Video Calling project!

### PRE-DEMO SETUP:
- [ ] `conda activate signlang`
- [ ] `python verify_setup.py` → all green
- [ ] `python ml_scripts/test_model_load.py` → model loads OK
- [ ] `uvicorn backend.main:socket_app --port 8000` starts OK
- [ ] `http://localhost:8000/health` returns `model_loaded: true`
- [ ] `npm run dev` starts OK at `localhost:5173`

### SIGN LANGUAGE TEST:
- [ ] Click Start Camera → webcam appears
- [ ] Show hand → "Hand Detected" badge turns green
- [ ] Letters A B C show up correctly
- [ ] Hold same sign 1-2 seconds → letter added to sentence
- [ ] Clear Text button works
- [ ] Copy Text button works

### VIDEO CALL TEST:
- [ ] Open two browser tabs at `localhost:5173`
- [ ] Tab 1: enter "demo" as room ID → Join Room
- [ ] Tab 2: enter "demo" as room ID → Join Room
- [ ] Both video feeds appear
- [ ] Sign language in Tab 1 → subtitle in Tab 2 ✓
- [ ] End Call cleans up properly

### PRESENTATION PREPARATION:
- [ ] 2 minute demo script written
- [ ] Know how to explain MediaPipe landmarks (78 variables, 63 coordinates + 15 rotations).
- [ ] Know how to explain pretrained model (Random Forest Classifier).
- [ ] Know how to explain WebRTC P2P (Signaling through Socket.IO STUN bridging).
- [ ] Screenshots saved as backup if live demo fails.
- [ ] Laptop camera and mic physically tested.
