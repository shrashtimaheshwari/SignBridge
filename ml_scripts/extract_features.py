import os
import cv2
import mediapipe as mp
import pandas as pd
import numpy as np
import math

def extract_features(image_path, hands):
    image_bgr = cv2.imread(image_path)
    if image_bgr is None:
        return None

    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    if not results.multi_hand_landmarks:
        return None

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
    return landmark_vector

def main():
    dataset_dir = 'dataset/asl_alphabet_train/asl_alphabet_train'
    # Handle if unzipped straight to asl_alphabet_train
    if not os.path.exists(dataset_dir):
        dataset_dir = 'dataset/asl_alphabet_train'
        
    if not os.path.exists(dataset_dir):
        print(f"Error: Could not find training images at {dataset_dir}")
        return

    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5
    )

    all_features = []
    
    labels = sorted([d for d in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, d))])
    
    print("Starting feature extraction... This may take a while depending on the number of images.")
    
    for label in labels:
        if label in ['J', 'Z']:
            continue # Optionally skip J and Z if training model doesn't need them, but augment script handles them if present
            
        folder_path = os.path.join(dataset_dir, label)
        images = os.listdir(folder_path)
        
        # We can limit to e.g. 500 images per class to speed up if needed, 
        # but to recreate the exact file we process them all or a reasonable subset.
        count = 0
        for img_name in images:
            img_path = os.path.join(folder_path, img_name)
            features = extract_features(img_path, hands)
            if features is not None:
                all_features.append([label] + features)
                count += 1
                
        print(f"Extracted {count} valid hands for letter {label}")
        
    hands.close()
    
    cols = ['label'] + [f'f_{i}' for i in range(78)]
    df = pd.DataFrame(all_features, columns=cols)
    
    output_file = 'dataset/landmark_data_78.csv'
    df.to_csv(output_file, index=False)
    print(f"\nSuccessfully saved {len(df)} rows to {output_file}!")
    
if __name__ == "__main__":
    main()
