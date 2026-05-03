# SignBridge - Sign Language Recognition & Translation Video Calling App

## 1. PROJECT TITLE AND DESCRIPTION
Welcome to the SignBridge - AI Sign Language Translator & Video Call Platform! This application provides a real-time 2-way peer-to-peer web video calling experience layered with local Python-driven Artificial Intelligence that reads your hand patterns and translates your American Sign Language (ASL) alphabets into continuous floating subtitles for the person on the other end.

## 2. FEATURES
- **Real-time ASL A-Z recognition**: Accurate scale/rotation invariant translation of hands.
- **MediaPipe hand landmark detection**: Extracting 63 positional points + 15 fingertip distances.
- **Word and sentence formation**: Temporal buffering smoothing algorithm predicting raw text chunks.
- **Peer-to-peer WebRTC video call**: Native browser secure connections.
- **Live sign language subtitles during call**: Real-time Socket.io text translation streaming.

## 3. TECH STACK
| Layer           | Technology                                |
|-----------------|-------------------------------------------|
| Frontend        | React.js + Vite                           |
| Backend         | FastAPI + Uvicorn (Python 3.11.9)         |
| Real-time       | python-socketio + socket.io-client        |
| Computer Vision | MediaPipe 0.10.9 + OpenCV 4.9             |
| ML Model        | Pretrained ASL classifier (Random Forest) |
| Video Call      | WebRTC + STUN (Google STUN servers)       |

## 4. PROJECT STRUCTURE
```
sign-language-app/
├── backend/                  # FastAPI & Socket.IO server layer
│   ├── main.py               # Application entry & CORS handling
│   ├── predictor.py          # AI logic & feature extraction 
│   ├── socket_manager.py     # Translation & WebRTC event routing
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React UI layer
│   ├── src/                  
│   │   ├── components/       # SignTranslator.jsx & VideoCall.jsx
│   │   ├── App.jsx           # Global component layout structure
│   │   └── socket.js         # Singleton socket manager
├── ml_scripts/               # OpenCV scripts and model creation logs
├── model/                    # Serialized .pkl weights & labels
└── README.md                 # Project documentation
```

## 5. SETUP INSTRUCTIONS

**Step 1:** Download or clone project into your local directory.
**Step 2:** Create conda environment with Python 3.11.9
```bash
conda create -n signlang python=3.11.9
conda activate signlang
```
**Step 3:** Install Python packages
```bash
cd backend
pip install -r requirements.txt
```
*(If errors occur, manually install via: pip install mediapipe opencv-python scikit-learn==1.4.1.post1 numpy fastapi uvicorn python-socketio[asyncio])*

**Step 4:** Download pretrained model
```bash
python ml_scripts/download_model.py
```
**Step 5:** Verify model
```bash
python ml_scripts/test_model_load.py
```
**Step 6:** Install frontend packages
```bash
cd frontend && npm install
```

## 6. HOW TO RUN

You need two distinct terminal windows.
**Terminal 1 (Backend):**
```bash
conda activate signlang
uvicorn backend.main:socket_app --reload --port 8000
```
**Terminal 2 (Frontend):**
```bash
cd frontend 
npm run dev
```
**Browser:** Open http://localhost:5173

## 7. HOW TO USE (For New Users)
1. Open the URL when both servers are successfully running.
2. Grant Web Camera permissions when browsers prompt it.
3. Click **"Start Camera"** under the Sign Language section.
4. Align your right hand in the screen showing ASL letters.
5. Wait for the word buffer to accumulate words, stringing them into sentences dynamically. 

## 8. HOW TO TEST VIDEO CALL (Two Tabs)
1. Open up **Google Chrome**.
2. Navigate to `http://localhost:5173` on Tab 1.
3. Navigate to `http://localhost:5173` on Tab 2 (Keep both side-by-side).
4. Enter the same Room ID (e.g. `demo`) into both.
5. Click **Join Room** on both tabs sequentially. The video portals should activate.
6. Create an AI translation signed sentence on Tab 1.
7. Observe the remote WebRTC viewport on Tab 2 properly projecting a subtitle!

## 9. TROUBLESHOOTING

| Problem | Cause | Fix |
|---|---|---|
| Camera not working | Browser permission | Allow in browser settings |
| No predictions | Model not loaded | Check /health endpoint |
| Socket not connecting | Backend not running | Start FastAPI first |
| numpy error | Version conflict | `pip install numpy==1.26.4` |
| mediapipe DLL error | Missing VC++ | Install Windows Visual C++ Redistributable |
| Video call failing | Wrong socket version | Use `socket.io-client 4.x` |

## 10. FUTURE IMPROVEMENTS
- Word-level recognition beyond alphabets utilizing LSTM sequences over static frames.
- Numbers 0-9 support alongside letters A-Z without mathematical collision.
- Two-hand gesture support utilizing the MediaPipe Right+Left pipeline.
- Mobile responsive UI modifications for native iOS integration.
- Deployment to cloud servers (Heroku/Render, Vercel/Netlify).
