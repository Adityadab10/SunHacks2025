#!/usr/bin/env python3
"""
Quick test to check pipeline parameters and test basic generation
"""
import requests
import json
import time

def test_pipeline_info():
    """Test what parameters the pipeline supports"""
    try:
        response = requests.get("http://localhost:8000/pipeline-info")
        if response.status_code == 200:
            info = response.json()
            print("📋 Pipeline Information:")
            print(f"   Class: {info.get('pipeline_class', 'Unknown')}")
            print(f"   Supported parameters: {info.get('supported_parameters', [])}")
            print(f"   Has guidance_scale: {info.get('has_guidance_scale', False)}")
            print(f"   Has generator: {info.get('has_generator', False)}")
            return info
        else:
            print(f"❌ Failed to get pipeline info: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Error getting pipeline info: {e}")
        return None

def test_basic_generation():
    """Test basic video generation"""
    print("\n🎬 Testing Basic Generation")
    
    test_prompt = "a red apple on a blue table"
    
    payload = {
        "prompt": test_prompt,
        "steps": 12,
        "seed": 42
    }
    
    try:
        print(f"   Testing prompt: '{test_prompt}'")
        start_time = time.time()
        
        response = requests.post(
            "http://localhost:8000/generate",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            with open("test_basic.mp4", "wb") as f:
                f.write(response.content)
            duration = time.time() - start_time
            print(f"   ✅ Basic generation successful! Saved to test_basic.mp4 ({duration:.1f}s)")
            return True
        else:
            print(f"   ❌ Basic generation failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error during basic generation: {e}")
        return False

def test_color_generation():
    """Test color-enhanced generation"""
    print("\n🎨 Testing Color-Enhanced Generation")
    
    test_prompt = "a rainbow over a green field with colorful flowers"
    
    payload = {
        "prompt": test_prompt,
        "steps": 12,
        "seed": 123
    }
    
    try:
        print(f"   Testing prompt: '{test_prompt}'")
        start_time = time.time()
        
        response = requests.post(
            "http://localhost:8000/generate-color",
            json=payload,
            timeout=60
        )
        
        if response.status_code == 200:
            with open("test_color.mp4", "wb") as f:
                f.write(response.content)
            duration = time.time() - start_time
            print(f"   ✅ Color generation successful! Saved to test_color.mp4 ({duration:.1f}s)")
            return True
        else:
            print(f"   ❌ Color generation failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error during color generation: {e}")
        return False

def main():
    print("🔧 Video Generation Test Suite")
    print("=" * 40)
    
    # Check if server is running
    try:
        response = requests.get("http://localhost:8000/")
        if response.status_code != 200:
            print("❌ Server not responding. Make sure the server is running on port 8000")
            return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("   Start the server with: python ai.py")
        return
    
    print("✅ Server is running")
    
    # Test pipeline info
    pipeline_info = test_pipeline_info()
    
    # Test basic generation
    basic_success = test_basic_generation()
    
    # Test color generation
    color_success = test_color_generation()
    
    print("\n📊 Test Summary:")
    print(f"   Basic generation: {'✅ PASS' if basic_success else '❌ FAIL'}")
    print(f"   Color generation: {'✅ PASS' if color_success else '❌ FAIL'}")
    
    if basic_success and color_success:
        print("\n🎉 All tests passed! Compare test_basic.mp4 vs test_color.mp4")
    elif basic_success:
        print("\n⚠️ Basic generation works, but color enhancement has issues")
    else:
        print("\n❌ Generation has issues. Check server logs for details.")

if __name__ == "__main__":
    main()
