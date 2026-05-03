"""
test_model_load.py — Phase 2: Model Loading & Prediction Test
==============================================================

This script verifies that the trained model works correctly by:
1. Loading model.pkl from the model/ folder
2. Loading labels.pkl from the model/ folder
3. Creating fake landmark data (random 63 features)
4. Running a prediction on the fake data
5. Printing the predicted letter and confidence

Compatible with: Python 3.11.9, scikit-learn 1.4.0
"""

import os
import sys
import pickle

import numpy as np

# ----------------------------------------------------------------
# Path setup
# ----------------------------------------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_DIR = os.path.join(PROJECT_ROOT, "model")


def main():
    print()
    print("=" * 55)
    print("  🧪 Model Loading & Prediction Test")
    print("=" * 55)
    print()

    # ── Step 1: Load the trained model ──
    model_path = os.path.join(MODEL_DIR, "model.pkl")

    if not os.path.exists(model_path):
        print("  ❌ model/model.pkl not found!")
        print("  Run this first: python ml_scripts/download_model.py")
        sys.exit(1)

    try:
        with open(model_path, "rb") as f:
            model = pickle.load(f)
        print("  ✅ Model loaded: OK")
        print(f"     Type: {type(model).__name__}")
    except Exception as e:
        print(f"  ❌ Failed to load model: {e}")
        sys.exit(1)

    # ── Step 2: Load label list ──
    labels_path = os.path.join(MODEL_DIR, "labels.pkl")

    if not os.path.exists(labels_path):
        print("  ⚠️  model/labels.pkl not found, using default A-Z")
        labels = [chr(i) for i in range(ord("A"), ord("Z") + 1)]
    else:
        try:
            with open(labels_path, "rb") as f:
                labels = pickle.load(f)
            print(f"  ✅ Labels loaded: OK ({len(labels)} classes)")
            print(f"     Classes: {labels}")
        except Exception as e:
            print(f"  ⚠️  Failed to load labels: {e}")
            labels = [chr(i) for i in range(ord("A"), ord("Z") + 1)]

    # ── Step 3: Create fake test input ──
    # Simulates 21 hand landmarks × 3 coordinates + 15 distance features = 78 total
    # In real usage, these come from MediaPipe after wrist normalization + distances
    fake_input = np.random.rand(1, 78).astype(np.float32)
    print()
    print(f"  📊 Test input shape: {fake_input.shape}")
    print(f"     (1 sample × 78 features = 63 coords + 15 rotation-immune distances)")

    # ── Step 4: Run prediction ──
    try:
        # Get prediction probabilities
        probabilities = model.predict_proba(fake_input)[0]

        # Get the predicted class index and confidence
        predicted_index = np.argmax(probabilities)
        confidence = probabilities[predicted_index]

        # Map index to letter
        # For Random Forest, model.classes_ gives the actual class labels
        if hasattr(model, "classes_"):
            predicted_letter = model.classes_[predicted_index]
        else:
            predicted_letter = labels[predicted_index] if predicted_index < len(labels) else "?"

        print()
        print("─" * 55)
        print(f"  🔤 Predicted letter : {predicted_letter}")
        print(f"  📈 Confidence       : {confidence * 100:.2f}%")
        print("─" * 55)

        # Show top 3 predictions
        top_3_indices = np.argsort(probabilities)[::-1][:3]
        print()
        print("  Top 3 predictions:")
        for i, idx in enumerate(top_3_indices):
            if hasattr(model, "classes_"):
                letter = model.classes_[idx]
            else:
                letter = labels[idx] if idx < len(labels) else "?"
            prob = probabilities[idx]
            print(f"    {i + 1}. {letter} — {prob * 100:.2f}%")

    except Exception as e:
        print(f"\n  ❌ Prediction failed: {e}")
        sys.exit(1)

    # ── Step 5: Final status ──
    print()
    print("=" * 55)
    print("  ✅ Model is ready to use")
    print()
    print("  NOTE: The prediction above is from RANDOM fake data,")
    print("  so the letter and low confidence are expected.")
    print("  Real predictions from actual hand landmarks will be")
    print("  much more accurate.")
    print("=" * 55)
    print()


if __name__ == "__main__":
    main()
