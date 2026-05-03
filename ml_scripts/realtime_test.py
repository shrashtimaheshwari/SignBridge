"""
realtime_test.py — Phase 3: Realtime ASL Recognition
==============================================================

This script opens your webcam and tests the ASL model in real time.
It includes logic for word formation, cooldowns, space insertions, and 
clear/quit functionality.

Controls:
    Q     = Quit
    C     = Clear text
    SPACE = Add space

Compatible with: Python 3.11.9, opencv-python, mediapipe
"""

import sys
import os
import time
from collections import deque

import cv2
import numpy as np
import mediapipe as mp

# ── Add the project root to sys.path so we can import backend ──
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.predictor import SignPredictor

def main():
    print("Initializing SignPredictor...")
    predictor = SignPredictor()

    if not predictor.model_loaded:
        print("❌ Error: Predictor failed to load the model. Check Phase 2.")
        sys.exit(1)

    # ── MediaPipe Setup for Drawing ──
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles

    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.7,
        min_tracking_confidence=0.5
    )

    # ── Word Formation & Logic Variables ──
    predictions_buffer = deque(maxlen=10)
    current_word = ""
    full_sentence = ""
    
    cooldown_start = 0
    COOLDOWN_DURATION = 1.5  # seconds
    
    last_hand_time = time.time()
    SPACE_TIMEOUT = 2.0  # seconds

    # ── OpenCV Webcam Setup ──
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Error: Could not open webcam.")
        sys.exit(1)

    print("✅ Webcam opened successfully. Press Q to quit.")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Failed to grab frame.")
            break

        # Removed the cv2.flip line because the Kaggle dataset is trained on Right-Hands!
        # If we horizontally mirror the webcam, the X-axis inverses, 
        # destroying the model's ability to predict asymmetrical signs (P, K, G).
        h, w, c = frame.shape
        predicted_letter = "?"
        confidence = 0.0

        # Current time inside the loop
        current_time = time.time()

        # ── 1. MediaPipe Hand Detection ──
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(image_rgb)

        if results.multi_hand_landmarks:
            last_hand_time = current_time
            hand_landmarks = results.multi_hand_landmarks[0]

            # Draw hand landmarks natively on the frame
            mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style()
            )

            # ── 2. LANDMARK NORMALIZATION ──
            # (Per instructions, doing this in the realtime script)
            wrist_x = hand_landmarks.landmark[0].x
            wrist_y = hand_landmarks.landmark[0].y
            wrist_z = hand_landmarks.landmark[0].z

            landmark_vector = []
            for lm in hand_landmarks.landmark:
                # Subtract wrist coordinates from all coordinates to normalize
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

            # Flatten to numpy array (now shape 78)
            landmarks_array = np.array(landmark_vector, dtype=np.float32)

            # ── 3. Prediction ──
            # Pass normalized landmarks directly into the predictor
            prediction_result = predictor.predict_from_landmarks(landmarks_array)
            predicted_letter = prediction_result.get("letter", "?")
            confidence = prediction_result.get("confidence", 0.0)

            # ── 4. Word Formation Logic ──
            if current_time - cooldown_start > COOLDOWN_DURATION:
                # We removed the confidence > 0.6 check since RF models often have lower % scores.
                # Relying on 7 consecutive frames (the buffer limit) is enough to filter noise.
                predictions_buffer.append(predicted_letter)

                # Count occurrences of the most recent letter in the buffer
                if predictions_buffer.count(predicted_letter) >= 5:
                    # Letter confirmed!
                    current_word += predicted_letter
                    predictions_buffer.clear()
                    cooldown_start = current_time
        else:
            # ── Auto-Space Logic ──
            # If no hand is detected for > 2 seconds, and current_word has letters
            if current_word and (current_time - last_hand_time > SPACE_TIMEOUT):
                full_sentence += current_word + " "
                current_word = ""

        # ── 5. Display on Screen ──
        # Display Box to make text readable
        cv2.rectangle(frame, (0, 0), (w, 140), (0, 0, 0), -1)
        cv2.rectangle(frame, (0, h - 40), (w, h), (0, 0, 0), -1)

        # Top Left: Predicted Letter
        cv2.putText(frame, f"Predicted: {predicted_letter}", (10, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        # Below: Confidence
        cv2.putText(frame, f"Confidence: {confidence*100:.1f}%", (10, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        # Draw Cooldown Indicator
        if current_time - cooldown_start <= COOLDOWN_DURATION:
            cv2.putText(frame, "[COOLDOWN]", (10, 120),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # Middle Box: Current Word
        cv2.putText(frame, f"Current Word: {current_word}", (250, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 0), 2)

        # Bottom Box: Full Sentence
        cv2.putText(frame, f"Sentence: {full_sentence}", (250, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        # Bottom Right: Controls
        cv2.putText(frame, "C = Clear | SPACE = Add Space | Q = Quit", (10, h - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 2)

        # Show frame
        cv2.imshow("Sign Language Real-time Testing", frame)

        # ── 6. Keyboard Controls ──
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):         # Quit
            break
        elif key == ord('c'):       # Clear sentence/word
            current_word = ""
            full_sentence = ""
            predictions_buffer.clear()
        elif key == 32:             # SPACE manually auto-spaces
            if current_word:
                full_sentence += current_word + " "
                current_word = ""

    # ── Cleanup ──
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
