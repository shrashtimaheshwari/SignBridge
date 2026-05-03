import subprocess
import sys
import os

# The exact path to the Python executable inside your signlang conda bubble
CONDA_PYTHON = r"C:\Users\shras\miniconda3\envs\signlang\python.exe"

if __name__ == "__main__":
    if not os.path.exists(CONDA_PYTHON):
        print(f"❌ Error: Could not find Python at {CONDA_PYTHON}")
        print("Please make sure your conda environment is named 'signlang'.")
        sys.exit(1)

    print("🚀 Starting ML Service using the 'signlang' conda environment...")
    
    # Get the project root directory (one level up from this script)
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # This completely bypasses VS Code terminal issues by forcing the correct Python
    try:
        subprocess.run(
            [CONDA_PYTHON, "-m", "uvicorn", "ml_service.ml_server:app", "--port", "8001"],
            cwd=project_root,
            check=True
        )
    except KeyboardInterrupt:
        print("\n🛑 ML Service stopped by user.")
