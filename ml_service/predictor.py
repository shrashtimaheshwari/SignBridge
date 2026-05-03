"""
predictor.py — Phase 2: ASL Prediction Logic
==============================================================

This module loads the trained ASL sign language model and provides
methods to extract landmarks from images and predict the corresponding
letter.

Compatible with: Python 3.11.9, opencv-python 4.9.0.80,
mediapipe 0.10.9, tensorflow 2.15.0, scikit-learn 1.4.0
"""

import os
import pickle
import numpy as np
import cv2
import mediapipe as mp
import warnings

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# Try to import tensorflow in case a .h5 model is used later
try:
    from tensorflow.keras.models import load_model
except ImportError:
    load_model = None

# Set up paths relative to this file's location (backend/predictor.py -> ../model/)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_DIR = os.path.join(PROJECT_ROOT, "model")

class SignPredictor:
    """
    SignPredictor handles MediaPipe hand landmark extraction and runs the
    prediction using a pre-trained ASL classification model.
    """

    def __init__(self):
        """
        Initializes the SignPredictor.
        - Loads the model (.pkl or .h5) from the model/ folder.
        - Loads the label encoder (labels.pkl) if it exists.
        - Initializes MediaPipe Hands for real-time tracking.
        """
        self.model = None
        self.labels = []
        self.model_type = None  # 'pkl' (scikit-learn) or 'h5' (tensorflow)
        self.scaler = None # Placeholder if scaler is added later

        # 1. Load the Model
        model_pkl_path = os.path.join(MODEL_DIR, "model.pkl")
        model_h5_path = os.path.join(MODEL_DIR, "model.h5")

        if os.path.exists(model_pkl_path):
            with open(model_pkl_path, "rb") as f:
                self.model = pickle.load(f)
            self.model_type = 'pkl'
            print(f"SignPredictor: Loaded Scikit-Learn model from {model_pkl_path}")
        elif os.path.exists(model_h5_path) and load_model is not None:
            self.model = load_model(model_h5_path)
            self.model_type = 'h5'
            print(f"SignPredictor: Loaded TensorFlow model from {model_h5_path}")
        else:
            print("SignPredictor: WARNING - No model.pkl or model.h5 found in model/ folder!")

        # 2. Load the Label Encoder / Labels List
        labels_path = os.path.join(MODEL_DIR, "labels.pkl")
        if os.path.exists(labels_path):
            with open(labels_path, "rb") as f:
                self.labels = pickle.load(f)
            print(f"SignPredictor: Loaded labels: {self.labels}")
        else:
            # Default fallback labels
            self.labels = [chr(i) for i in range(ord("A"), ord("Z") + 1)]
            print("SignPredictor: WARNING - labels.pkl not found, using default A-Z")
            
        # 3. Load Scaler (if exists)
        scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
        if os.path.exists(scaler_path):
            with open(scaler_path, "rb") as f:
                self.scaler = pickle.load(f)
            print("SignPredictor: Loaded scaler.")

        # 4. Initialize MediaPipe Hands
        # Exact import style as requested
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )

        self.model_loaded = self.model is not None
        print("SignPredictor initialized successfully")

    def predict_from_landmarks(self, landmarks_array):
        """
        Runs the model prediction on an array of 63 landmark features.
        
        Args:
            landmarks_array (np.ndarray): Array of shape (63,) containing x,y,z coordinates.
            
        Returns:
            dict: { "letter": str, "confidence": float }
        """
        if not self.model_loaded:
            return {"letter": None, "confidence": 0.0}

        # Reshape to (1, 63) for model input
        input_data = landmarks_array.reshape(1, -1).astype(np.float32)
        
        # Apply scaler if available
        if self.scaler is not None:
            input_data = self.scaler.transform(input_data)

        predicted_letter = "?"
        confidence = 0.0

        try:
            if self.model_type == 'pkl':
                # Scikit-learn model (like Random Forest)
                if hasattr(self.model, "predict_proba"):
                    probabilities = self.model.predict_proba(input_data)[0]
                    pred_idx = np.argmax(probabilities)
                    confidence = float(probabilities[pred_idx])
                    
                    if hasattr(self.model, "classes_"):
                        predicted_letter = str(self.model.classes_[pred_idx])
                    else:
                        predicted_letter = str(self.labels[pred_idx])
                else:
                    # Fallback if model doesn't support predict_proba
                    pred = self.model.predict(input_data)[0]
                    predicted_letter = str(pred)
                    confidence = 1.0
                    
            elif self.model_type == 'h5':
                # TensorFlow/Keras model
                probabilities = self.model.predict(input_data, verbose=0)[0]
                pred_idx = np.argmax(probabilities)
                confidence = float(probabilities[pred_idx])
                predicted_letter = str(self.labels[pred_idx]) if pred_idx < len(self.labels) else "?"

        except Exception as e:
            print(f"Prediction error: {e}")
            return {"letter": None, "confidence": 0.0}

        return {"letter": predicted_letter, "confidence": confidence}

    def predict_from_frame(self, image_bgr):
        """
        Processes an OpenCV BGR image, extracts MediaPipe hand landmarks,
        and predicts the ASL letter.
        
        Args:
            image_bgr (np.ndarray): OpenCV image frame.
            
        Returns:
            dict: { "letter": str, "confidence": float }
        """
        if image_bgr is None:
            return {"letter": None, "confidence": 0.0}

        # 1. Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        # 2. Run MediaPipe Hands detection
        results = self.hands.process(image_rgb)

        # 3. If no hand found, return early
        if not results.multi_hand_landmarks:
            return {"letter": None, "confidence": 0.0}

        # 4. If hand found, extract and normalize landmarks
        hand_landmarks = results.multi_hand_landmarks[0]
        
        # Get wrist coordinates (landmark 0)
        wrist = hand_landmarks.landmark[0]
        wrist_x, wrist_y, wrist_z = wrist.x, wrist.y, wrist.z

        landmark_vector = []
        # Extract all 21 landmarks, normalize relative to wrist
        for lm in hand_landmarks.landmark:
            landmark_vector.append(lm.x - wrist_x)
            landmark_vector.append(lm.y - wrist_y)
            landmark_vector.append(lm.z - wrist_z)
            
        import math
        # SCALE INVARIANCE: Normalize by maximum absolute value
        max_val = max(abs(val) for val in landmark_vector)
        if max_val > 0:
            landmark_vector = [val / max_val for val in landmark_vector]

        # ROTATION IMMUNE FEATURES: Distance between fingertips
        key_points = [0, 4, 8, 12, 16, 20] # Wrist + 5 fingertips
        distances = []
        for i in range(len(key_points)):
            for j in range(i + 1, len(key_points)):
                p1 = hand_landmarks.landmark[key_points[i]]
                p2 = hand_landmarks.landmark[key_points[j]]
                dist = math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2)
                distances.append(dist)

        max_dist = max(distances) if len(distances) > 0 else 1.0
        if max_dist > 0:
            distances = [d / max_dist for d in distances]

        landmark_vector.extend(distances)

        # 5. Flatten to array of shape (78,)
        landmarks_array = np.array(landmark_vector, dtype=np.float32)

        # 6. Call predict_from_landmarks() and return the result
        result = self.predict_from_landmarks(landmarks_array)
        result["pinky_tip"] = {"x": hand_landmarks.landmark[20].x, "y": hand_landmarks.landmark[20].y}
        result["index_tip"] = {"x": hand_landmarks.landmark[8].x, "y": hand_landmarks.landmark[8].y}
        return result

