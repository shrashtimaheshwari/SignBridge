import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pickle
import os

def main():
    data_file = 'dataset/landmark_data_augmented.csv'
    model_file = 'model/model.pkl'
    
    if not os.path.exists(data_file):
        print(f"Error: {data_file} not found.")
        return
        
    df = pd.read_csv(data_file)
    X = df.drop('label', axis=1)
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Check accuracy of old model if it exists
    if os.path.exists(model_file):
        try:
            with open(model_file, 'rb') as f:
                old_model = pickle.load(f)
            old_pred = old_model.predict(X_test)
            old_acc = accuracy_score(y_test, old_pred)
            print(f"Old model accuracy on augmented test set: {old_acc:.4f}")
        except Exception as e:
            print(f"Could not load old model to check accuracy: {e}")
            
    print("Training new model with n_estimators=200, max_depth=20, min_samples_split=5 on all CPU cores...")
    new_model = RandomForestClassifier(n_estimators=200, max_depth=20, min_samples_split=5, n_jobs=-1, random_state=42)
    new_model.fit(X_train, y_train)
    
    new_pred = new_model.predict(X_test)
    new_acc = accuracy_score(y_test, new_pred)
    print(f"New model accuracy: {new_acc:.4f}")
    
    with open(model_file, 'wb') as f:
        pickle.dump(new_model, f)
    print("New model saved to model/model.pkl")

if __name__ == "__main__":
    main()
