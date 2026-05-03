"""
download_model.py — Phase 2: Dataset Download + Model Training
==============================================================

WHY THIS SCRIPT EXISTS:
After researching Kaggle, GitHub, and Hugging Face, no pretrained ASL
classifier model exists that takes exactly 63 MediaPipe landmark
features as input. The standard approach used by everyone in the
community is:

    1. Use the "ASL Alphabet" dataset (87,000 images by grassknoted on Kaggle)
    2. Extract MediaPipe hand landmarks from those images
    3. Train a lightweight classifier (Random Forest) on the landmarks

This script automates steps 2 and 3.

DATASET:
    Kaggle: "ASL Alphabet" by grassknoted
    URL: https://www.kaggle.com/datasets/grassknoted/asl-alphabet
    Size: ~1 GB (87,000 images, 200x200px, 29 classes)
    We only use 26 classes (A-Z), skipping SPACE, DELETE, NOTHING.

MODEL:
    Type: Random Forest Classifier (scikit-learn)
    Input: 63 features (21 landmarks × 3 coordinates: x, y, z)
    Output: Letter index (0-25 → A-Z)
    Normalization: Wrist subtraction (landmark 0 subtracted from all)
    File: model/model.pkl
    Labels: model/labels.pkl

Compatible with: Python 3.11.9, scikit-learn 1.4.0, mediapipe 0.10.9
"""

import os
import sys
import pickle
import time

import numpy as np

# ----------------------------------------------------------------
# Path setup — project root is one level up from ml_scripts/
# ----------------------------------------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_DIR = os.path.join(PROJECT_ROOT, "model")
DATASET_DIR = os.path.join(PROJECT_ROOT, "dataset")

# How many images to process per letter (A-Z).
# 100 is a good balance between speed (~5-10 min) and accuracy (~90%+).
# Increase to 300 for better accuracy (~95%+), but takes ~20-30 min.
IMAGES_PER_CLASS = 150


def find_dataset():
    """
    Look for the ASL Alphabet dataset in common extraction paths.
    The Kaggle zip extracts to different structures depending on
    how the user extracts it.

    Returns the path to the directory containing A/, B/, ..., Z/ subdirectories,
    or None if not found.
    """
    # Common paths after extracting the Kaggle dataset
    possible_paths = [
        os.path.join(DATASET_DIR, "asl_alphabet_train", "asl_alphabet_train"),
        os.path.join(DATASET_DIR, "asl_alphabet_train"),
        os.path.join(DATASET_DIR, "asl-alphabet", "asl_alphabet_train", "asl_alphabet_train"),
        os.path.join(DATASET_DIR, "asl-alphabet", "asl_alphabet_train"),
        DATASET_DIR,  # If user placed letter folders directly in dataset/
    ]

    for path in possible_paths:
        if os.path.exists(path):
            # Check if it contains at least A/ and Z/ subdirectories
            has_A = os.path.isdir(os.path.join(path, "A"))
            has_Z = os.path.isdir(os.path.join(path, "Z"))
            if has_A and has_Z:
                return path

    return None


def print_download_instructions():
    """Print clear instructions for downloading the dataset from Kaggle."""
    print()
    print("=" * 62)
    print("  ❌  ASL Alphabet Dataset NOT FOUND")
    print("=" * 62)
    print()
    print("  You need to download the dataset before running this script.")
    print()
    print("  ─── OPTION 1: Kaggle CLI (recommended) ───────────────────")
    print()
    print("  Step 1: Install Kaggle CLI")
    print("    pip install kaggle")
    print()
    print("  Step 2: Set up Kaggle API key")
    print("    - Go to https://www.kaggle.com/settings")
    print("    - Click 'Create New Token' under API section")
    print("    - Save kaggle.json to C:\\Users\\<you>\\.kaggle\\kaggle.json")
    print()
    print("  Step 3: Download the dataset")
    print(f"    cd {DATASET_DIR}")
    print("    kaggle datasets download -d grassknoted/asl-alphabet")
    print()
    print("  Step 4: Extract the zip file into the dataset/ folder")
    print()
    print("  ─── OPTION 2: Manual Download ─────────────────────────────")
    print()
    print("  1. Go to: https://www.kaggle.com/datasets/grassknoted/asl-alphabet")
    print("  2. Sign in to Kaggle and click 'Download'")
    print("  3. Extract the ZIP file")
    print("  4. Place the contents so the structure looks like:")
    print()
    print("     dataset/")
    print("     └── asl_alphabet_train/")
    print("         └── asl_alphabet_train/")
    print("             ├── A/  (3000 images)")
    print("             ├── B/  (3000 images)")
    print("             ├── ...")
    print("             └── Z/  (3000 images)")
    print()
    print("  After downloading, run this script again:")
    print("    python ml_scripts/download_model.py")
    print()
    print("=" * 62)


def extract_landmarks_and_train(dataset_path):
    """
    Main pipeline: extract landmarks from images → train Random Forest → save model.

    Steps:
        1. Initialize MediaPipe Hands in static image mode
        2. For each letter A-Z, process up to IMAGES_PER_CLASS images
        3. For each image, extract 21 hand landmarks (x, y, z)
        4. Normalize by subtracting wrist (landmark 0) position
        5. Flatten to a 63-element vector
        6. Train a RandomForestClassifier on the extracted data
        7. Save model.pkl and labels.pkl to model/
    """
    # Import heavy libraries only when needed
    import cv2
    import mediapipe as mp
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score

    # ── Initialize MediaPipe Hands ──
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5,
    )

    # ── Define the 26 letter classes ──
    letters = [chr(i) for i in range(ord("A"), ord("Z") + 1)]

    all_data = []
    all_labels = []

    print()
    print("=" * 62)
    print("  📸  Extracting MediaPipe Landmarks from ASL Images")
    print(f"  Processing up to {IMAGES_PER_CLASS} images per letter (A-Z)")
    print("=" * 62)
    print()

    total_start = time.time()

    for idx, letter in enumerate(letters):
        letter_dir = os.path.join(dataset_path, letter)

        if not os.path.isdir(letter_dir):
            print(f"  ⚠️  Skipping '{letter}' — folder not found")
            continue

        # Get list of image files (limit to IMAGES_PER_CLASS)
        all_images = [
            f for f in os.listdir(letter_dir)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]
        images_to_process = all_images[:IMAGES_PER_CLASS]

        extracted = 0
        failed = 0

        for img_name in images_to_process:
            img_path = os.path.join(letter_dir, img_name)

            # Read image with OpenCV
            img = cv2.imread(img_path)
            if img is None:
                failed += 1
                continue

            # Convert BGR → RGB for MediaPipe
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

            # Run MediaPipe hand detection
            results = hands.process(img_rgb)

            if results.multi_hand_landmarks:
                hand_landmarks = results.multi_hand_landmarks[0]

                # Get wrist position (landmark 0) for normalization
                wrist = hand_landmarks.landmark[0]
                wrist_x = wrist.x
                wrist_y = wrist.y
                wrist_z = wrist.z

                # Extract all 21 landmarks, normalized by wrist position
                # This makes the features position-invariant
                landmark_vector = []
                for lm in hand_landmarks.landmark:
                    landmark_vector.append(lm.x - wrist_x)
                    landmark_vector.append(lm.y - wrist_y)
                    landmark_vector.append(lm.z - wrist_z)

                import math
                # SCALE INVARIANCE: Normalize by the maximum absolute value
                # This ensures the model works perfectly whether your hand
                # is 5 inches from the camera or 5 feet away.
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

                # landmark_vector is now a list of 78 floats (63 coords + 15 distances)
                all_data.append(landmark_vector)
                all_labels.append(letter)
                extracted += 1
            else:
                failed += 1

        elapsed = time.time() - total_start
        progress = f"[{idx + 1:2d}/26]"
        print(
            f"  {progress} {letter}: {extracted:3d} extracted, "
            f"{failed:3d} no-hand — {elapsed:.0f}s elapsed"
        )

    # Close MediaPipe
    hands.close()

    # ── Validate extracted data ──
    if len(all_data) < 100:
        print(f"\n  ❌ Only {len(all_data)} samples extracted. Not enough to train.")
        print("  Make sure the dataset images contain clear hand signs.")
        sys.exit(1)

    # ── Convert to numpy arrays ──
    X = np.array(all_data, dtype=np.float32)
    y = np.array(all_labels)

    unique_labels = sorted(list(set(y)))

    print()
    print("─" * 62)
    print(f"  📊 Dataset Summary:")
    print(f"     Total samples : {len(X)}")
    print(f"     Feature shape : {X.shape} (samples × 63 features)")
    print(f"     Classes found : {len(unique_labels)} ({unique_labels[0]}-{unique_labels[-1]})")
    print("─" * 62)

    # ── Train / Test Split ──
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print()
    print(f"  🏋️ Training Random Forest (100 trees)...")
    print(f"     Train set: {len(X_train)} samples")
    print(f"     Test set : {len(X_test)} samples")

    train_start = time.time()

    # ── Train Random Forest ──
    model = RandomForestClassifier(
        n_estimators=100,    # 100 decision trees
        max_depth=None,      # No max depth — let trees grow fully
        random_state=42,     # Reproducible results
        n_jobs=-1,           # Use all CPU cores
    )
    model.fit(X_train, y_train)

    train_time = time.time() - train_start
    print(f"     Training time: {train_time:.1f}s")

    # ── Evaluate on test set ──
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"     ✅ Test Accuracy: {accuracy * 100:.2f}%")

    # ── Save model and labels ──
    os.makedirs(MODEL_DIR, exist_ok=True)

    model_path = os.path.join(MODEL_DIR, "model.pkl")
    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    print(f"\n  💾 Model saved to: model/model.pkl")

    labels_path = os.path.join(MODEL_DIR, "labels.pkl")
    with open(labels_path, "wb") as f:
        pickle.dump(unique_labels, f)
    print(f"  💾 Labels saved to: model/labels.pkl")

    total_time = time.time() - total_start
    print()
    print("=" * 62)
    print(f"  ✅ Model saved to model/ folder successfully")
    print(f"  ⏱️  Total time: {total_time:.0f} seconds ({total_time / 60:.1f} minutes)")
    print()
    print("  Model is now ready to be used in predictions.")
    print("=" * 62)
    print()


def main():
    print()
    print("  🤖 ASL Sign Language Model — Download & Train Pipeline")
    print()

    # Step 1 — Check if dataset exists
    dataset_path = find_dataset()

    if dataset_path is None:
        print_download_instructions()
        sys.exit(1)

    print(f"  ✅ Dataset found at: {dataset_path}")

    # Step 2 — Check if model already exists
    model_path = os.path.join(MODEL_DIR, "model.pkl")
    if os.path.exists(model_path):
        print(f"  ⚠️  model/model.pkl already exists!")
        response = input("  Overwrite? (y/n): ").strip().lower()
        if response != "y":
            print("  Skipped. Existing model kept.")
            return

    # Step 3 — Extract landmarks and train
    extract_landmarks_and_train(dataset_path)


if __name__ == "__main__":
    main()
