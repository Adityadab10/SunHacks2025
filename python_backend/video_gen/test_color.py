#!/usr/bin/env python3
"""
Test script for improved color video generation
"""
import requests
import json
import time

def test_color_generation():
    """Test the new color-enhanced video generation"""
    base_url = "http://localhost:8000"
    
    # Test prompts that should produce colorful videos
    test_prompts = [
        "a beautiful rainbow over a green meadow with colorful flowers",
        "a red sports car driving through a vibrant sunset",
        "colorful balloons floating in a bright blue sky",
        "a tropical beach with turquoise water and golden sand"
    ]
    
    print("🎨 Testing Color-Enhanced Video Generation")
    print("=" * 50)
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n🎬 Test {i}/4: {prompt}")
        
        payload = {
            "prompt": prompt,
            "steps": 16,
            "seed": 42 + i
        }
        
        try:
            print("   Sending request to /generate-color...")
            start_time = time.time()
            
            response = requests.post(
                f"{base_url}/generate-color",
                json=payload,
                timeout=120
            )
            
            if response.status_code == 200:
                # Save the video
                filename = f"test_color_video_{i}.mp4"
                with open(filename, "wb") as f:
                    f.write(response.content)
                
                duration = time.time() - start_time
                print(f"   ✅ Success! Saved to {filename} ({duration:.1f}s)")
            else:
                print(f"   ❌ Error {response.status_code}: {response.text}")
                
        except requests.exceptions.Timeout:
            print("   ⏰ Timeout - video generation took too long")
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n🔍 Comparison Test: Original vs Enhanced")
    print("-" * 40)
    
    comparison_prompt = "a colorful parrot in a tropical rainforest"
    
    # Test original endpoint
    print("Testing original /generate endpoint...")
    try:
        response = requests.post(
            f"{base_url}/generate",
            json={"prompt": comparison_prompt, "steps": 16, "seed": 100},
            timeout=120
        )
        if response.status_code == 200:
            with open("original_video.mp4", "wb") as f:
                f.write(response.content)
            print("✅ Original video saved as original_video.mp4")
    except Exception as e:
        print(f"❌ Original endpoint error: {e}")
    
    # Test enhanced endpoint
    print("Testing enhanced /generate-color endpoint...")
    try:
        response = requests.post(
            f"{base_url}/generate-color",
            json={"prompt": comparison_prompt, "steps": 16, "seed": 100},
            timeout=120
        )
        if response.status_code == 200:
            with open("enhanced_video.mp4", "wb") as f:
                f.write(response.content)
            print("✅ Enhanced video saved as enhanced_video.mp4")
    except Exception as e:
        print(f"❌ Enhanced endpoint error: {e}")
    
    print("\n🎯 Tips for Better Color Videos:")
    print("1. Use descriptive color words in your prompts")
    print("2. Try prompts like 'vibrant', 'colorful', 'bright'")
    print("3. Use the /generate-color endpoint for better results")
    print("4. Compare original_video.mp4 vs enhanced_video.mp4")

if __name__ == "__main__":
    test_color_generation()
