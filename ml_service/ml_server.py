"""
ml_server.py — Lightweight ML Microservice
Runs on port 8001. Express backend calls POST /predict.
"""

import sys
import os
import base64
import numpy as np
import cv2
from fastapi import FastAPI
from pydantic import BaseModel

from ml_service.predictor import SignPredictor

app = FastAPI(title="SignBridge ML Service")

predictor = None
model_loaded = False


class PredictRequest(BaseModel):
    frame: str  # base64 encoded JPEG string


@app.on_event("startup")
def startup():
    global predictor, model_loaded
    try:
        print("🔄 Loading SignPredictor...")
        predictor = SignPredictor()
        model_loaded = predictor.model_loaded
        if model_loaded:
            print("✅ ML model loaded successfully.")
        else:
            print("⚠️ SignPredictor initialized but model not found.")
    except Exception as e:
        model_loaded = False
        print(f"❌ Failed to load SignPredictor: {e}")


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model_loaded}


@app.post("/predict")
def predict(req: PredictRequest):
    if not predictor or not model_loaded:
        return {"letter": None, "confidence": 0.0, "hand_detected": False,
                "pinky_tip": None, "index_tip": None}

    # Decode base64 to OpenCV image
    raw = req.frame
    if "," in raw:
        raw = raw.split(",")[1]
    img_bytes = base64.b64decode(raw)
    np_arr = np.frombuffer(img_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    result = predictor.predict_from_frame(image)

    return {
        "letter": result.get("letter"),
        "confidence": result.get("confidence", 0.0),
        "hand_detected": result.get("letter") is not None,
        "pinky_tip": result.get("pinky_tip"),
        "index_tip": result.get("index_tip")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ml_server:app", host="0.0.0.0", port=8001, reload=True)
