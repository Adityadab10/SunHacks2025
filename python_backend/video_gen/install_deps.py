#!/usr/bin/env python3
"""
Install dependencies for improved video generation
"""
import subprocess
import sys

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}: {e}")
        return False

def main():
    packages = [
        "uvicorn",
        "opencv-python",
        "opencv-python-headless",
        "pillow",
        "diffusers>=0.20.0",
        "transformers",
        "accelerate",
        "xformers"
    ]
    
    print("🔧 Installing dependencies for color video generation...")
    
    failed_packages = []
    for package in packages:
        if not install_package(package):
            failed_packages.append(package)
    
    if failed_packages:
        print(f"\n⚠️ Failed to install: {', '.join(failed_packages)}")
        print("You may need to install these manually or use conda")
    else:
        print("\n✅ All dependencies installed successfully!")
        print("You can now run the improved video generation server.")

if __name__ == "__main__":
    main()
