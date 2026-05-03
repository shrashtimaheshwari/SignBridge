import pandas as pd
import numpy as np
import random
import os

def main():
    input_file = 'dataset/landmark_data_78.csv'
    output_file = 'dataset/landmark_data_augmented.csv'
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found.")
        return

    df = pd.read_csv(input_file)
    original_count = len(df)
    
    augmented_rows = []
    
    for _, row in df.iterrows():
        label = row['label']
        features = row.drop('label').values.astype(float)
        
        # 1. Small random noise
        noise1 = np.random.normal(0, 0.01, 78)
        aug1 = features + noise1
        
        # 2. Scale variation (0.9 to 1.1x)
        scale = random.uniform(0.9, 1.1)
        aug2 = features * scale
        
        # 3. Tilt simulation (higher noise on first 63 only)
        noise3 = np.random.normal(0, 0.02, 63)
        aug3 = features.copy()
        aug3[:63] = features[:63] + noise3
        
        # 4 & 5: Combinations
        scale4 = random.uniform(0.9, 1.1)
        noise4 = np.random.normal(0, 0.01, 78)
        aug4 = (features * scale4) + noise4
        
        scale5 = random.uniform(0.9, 1.1)
        noise5 = np.random.normal(0, 0.02, 63)
        aug5 = features.copy() * scale5
        aug5[:63] = aug5[:63] + noise5
        
        # Add original plus augmented
        augmented_rows.append(row.values.tolist())
        augmented_rows.append([label] + aug1.tolist())
        augmented_rows.append([label] + aug2.tolist())
        augmented_rows.append([label] + aug3.tolist())
        augmented_rows.append([label] + aug4.tolist())
        augmented_rows.append([label] + aug5.tolist())
        
    df_aug = pd.DataFrame(augmented_rows, columns=df.columns)
    df_aug.to_csv(output_file, index=False)
    
    print(f"Original row count: {original_count}")
    print(f"New row count (including original): {len(df_aug)}")

if __name__ == "__main__":
    main()
