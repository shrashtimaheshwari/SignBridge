# Sign Language Recognition & Translation Video Calling App

## 1. PROJECT TITLE AND DESCRIPTION
Welcome to the SignBridge - AI Sign Language Translator & Video Call Platform! This application provides a real-time 2-way peer-to-peer web video calling experience layered with local Python-driven Artificial Intelligence that reads your hand patterns and translates your American Sign Language (ASL) alphabets into continuous floating subtitles for the person on the other end.

## 2. FEATURES
- **Real-time ASL A-Z recognition**: Accurate scale/rotation invariant translation of hands.
- **MediaPipe hand landmark detection**: Extracting 63 positional points + 15 fingertip distances.
- **Word and sentence formation**: Temporal buffering smoothing algorithm predicting raw text chunks.
- **Peer-to-peer WebRTC video call**: Native browser secure connections.
- **Live sign language subtitles during call**: Real-time Socket.io text translation streaming.
- **User Authentication**: Secure login and signup flows with MongoDB.

## 3. TECH STACK
| Layer           | Technology                                |
|-----------------|-------------------------------------------|
| Frontend        | React.js + Vite                           |
| Backend         | Express.js + Node.js                      |
| Database        | MongoDB Atlas                             |
| Real-time       | Socket.IO (Node) + socket.io-client       |
| AI Microservice | FastAPI + Uvicorn (Python 3.11.9)         |
| Computer Vision | MediaPipe 0.10.9 + OpenCV 4.9             |
| ML Model        | Pretrained ASL classifier (Random Forest) |
| Video Call      | WebRTC + STUN (Google STUN servers)       |

## 4. PROJECT STRUCTURE
```
sign-language-app/
├── backend/                  # Express.js & Socket.IO main server layer
│   ├── routes/               # API endpoint definitions
│   ├── middleware/           # Express middlewares (auth, etc.)
│   ├── models/               # MongoDB Mongoose schemas
│   ├── server.js             # Main backend application entry
│   └── package.json          # Node.js dependencies
├── frontend/                 # React UI layer
│   ├── src/                  
│   │   ├── components/       # UI Components (SignTranslator, VideoCall, RoomLobby)
│   │   ├── pages/            # Page Views (Login, Signup, ForgotPassword)
│   │   ├── App.jsx           # Global component layout structure
│   │   └── socket.js         # Singleton socket manager
│   └── package.json          # React dependencies
├── ml_service/               # Python AI/Computer Vision microservice
│   ├── main.py               # ML service runner script
│   ├── ml_server.py          # FastAPI server for predictions
│   ├── predictor.py          # AI logic & feature extraction 
│   └── requirements.txt      # Python dependencies
├── ml_scripts/               # Scripts to test/download the ML model
├── model/                    # Serialized .pkl weights & labels
└── README.md                 # Project documentation
```

## 5. SETUP INSTRUCTIONS

**Step 1:** Download or clone project into your local directory.

**Step 2:** Setup Python Environment for ML Service
```bash
conda create -n signlang python=3.11.9
conda activate signlang
```

**Step 3:** Install Python Packages
```bash
cd ml_service
pip install -r requirements.txt
```
*(If you face errors, you can manually install via: pip install mediapipe opencv-python scikit-learn==1.4.1.post1 numpy fastapi uvicorn)*

**Step 4:** Download pretrained model
```bash
python ml_scripts/download_model.py
```

**Step 5:** Install Backend & Frontend Packages
```bash
# In the root directory, install backend dependencies:
cd backend
npm install

# In the root directory, install frontend dependencies:
cd ../frontend
npm install
```

**Step 6:** Environment Variables
Ensure you have your `.env` files properly configured inside the `backend/` folder (e.g., MongoDB URI, JWT secrets).

## 6. HOW TO RUN

You need three distinct terminal windows to run all services.

**Terminal 1 (Express Backend):**
```bash
cd backend
npm run dev
```
*(Runs on http://localhost:3000)*

**Terminal 2 (React Frontend):**
```bash
cd frontend 
npm run dev
```
*(Runs on http://localhost:5173)*

**Terminal 3 (Python ML Service):**
```bash
conda activate signlang
python ml_service/main.py
```
*(Runs on http://localhost:8001)*

## 7. HOW TO USE (For New Users)
1. Open http://localhost:5173 in your browser.
2. Grant Web Camera permissions when prompted.
3. Authenticate / Login to the application.
4. Click **"Start Camera"** under the Sign Language section.
5. Align your right hand in the screen showing ASL letters.
6. The AI microservice will translate your signs and send the text back via the Express backend.

## 8. HOW TO TEST VIDEO CALL (Two Tabs)
1. Open up **Google Chrome**.
2. Navigate to `http://localhost:5173` on Tab 1.
3. Navigate to `http://localhost:5173` on Tab 2 (Keep both side-by-side).
4. Authenticate on both.
5. Enter the same Room ID (e.g. `demo`) into both.
6. Click **Join Room** on both tabs sequentially. The video portals should activate.
7. Create an AI translation signed sentence on Tab 1.
8. Observe the remote WebRTC viewport on Tab 2 properly projecting a subtitle!

## 9. TROUBLESHOOTING

| Problem | Cause | Fix |
|---|---|---|
| Prediction error: fetch failed | ML service is off | Make sure `python ml_service/main.py` is running |
| Database connection failed | Bad MongoDB URI | Check your `backend/.env` file |
| Camera not working | Browser permission | Allow in browser settings |
| Socket not connecting | Backend not running | Start the Express server first |
| mediapipe DLL error | Missing VC++ | Install Windows Visual C++ Redistributable |

## 10. FUTURE IMPROVEMENTS
- Word-level recognition beyond alphabets utilizing LSTM sequences over static frames.
- Numbers 0-9 support alongside letters A-Z without mathematical collision.
- Two-hand gesture support utilizing the MediaPipe Right+Left pipeline.
- Mobile responsive UI modifications for native iOS integration.
- Deployment to cloud servers (Heroku/Render, Vercel/Netlify).
