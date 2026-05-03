"""
verify_setup.py — Phase 1 Setup Verification
Run this from the project root (sign-language-app/) after installing all packages.
Usage:  python verify_setup.py
"""

import sys


def check_python_version():
    """Verify Python version is 3.11.x"""
    major, minor, micro = sys.version_info[:3]
    version_str = f"{major}.{minor}.{micro}"

    print("=" * 55)
    print("  Sign Language App — Environment Verification")
    print("=" * 55)
    print()

    if major == 3 and minor == 11:
        print(f"✅ Python version: {version_str} (compatible)")
    else:
        print(f"❌ Python version: {version_str} (expected 3.11.x)")
        print("   Please activate the correct conda environment:")
        print("   conda activate signlang")
        sys.exit(1)

    print()
    print("-" * 55)
    print("  Checking packages...")
    print("-" * 55)
    print()


def check_package(import_name, package_name, pip_name=None):
    """
    Try to import a package and print its version.
    Returns True if successful, False otherwise.
    """
    if pip_name is None:
        pip_name = package_name

    try:
        mod = __import__(import_name)
        # Get version — different packages store it differently
        version = getattr(mod, "__version__", None)
        if version is None:
            version = getattr(mod, "VERSION", "unknown")
        print(f"  ✅ OK      : {package_name:<16} v{version}")
        return True
    except ImportError:
        print(f"  ❌ MISSING : {package_name:<16} — run: pip install {pip_name}")
        return False


def main():
    check_python_version()

    packages = [
        # (import_name, display_name, pip_name)
        ("fastapi",      "fastapi",       "fastapi"),
        ("uvicorn",      "uvicorn",       "uvicorn[standard]"),
        ("socketio",     "socketio",      "python-socketio"),
        ("cv2",          "opencv",        "opencv-python"),
        ("mediapipe",    "mediapipe",     "mediapipe"),
        ("tensorflow",   "tensorflow",    "tensorflow"),
        ("numpy",        "numpy",         "numpy"),
        ("pandas",       "pandas",        "pandas"),
        ("sklearn",      "scikit-learn",  "scikit-learn"),
        ("PIL",          "Pillow",        "Pillow"),
    ]

    all_ok = True
    for import_name, display_name, pip_name in packages:
        if not check_package(import_name, display_name, pip_name):
            all_ok = False

    print()
    print("=" * 55)

    if all_ok:
        print("  🎉 All packages ready. You can start Phase 2.")
    else:
        print("  ⚠️  Fix the missing packages above before continuing.")

    print("=" * 55)
    print()


if __name__ == "__main__":
    main()
