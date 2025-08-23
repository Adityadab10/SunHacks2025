#!/usr/bin/env python3
"""
Comprehensive test for color video generation improvements
Tests both endpoints and generates comparison videos
"""
import requests
import json
import time
import os

def test_color_comparison():
    """Test color generation improvements with side-by-side comparison"""
    print("🎨 Color Video Generation Comparison Test")
    print("=" * 50)
    
    # Test prompts specifically designed to show color differences
    test_cases = [
        {
            "name": "Rainbow Scene",
            "prompt": "a beautiful rainbow arcing over a lush green meadow with colorful wildflowers",
            "description": "Should show vibrant rainbow colors and green landscape"
        },
        {
            "name": "Sunset Beach",
            "prompt": "golden sunset over turquoise ocean waves with orange and pink sky",
            "description": "Should show warm sunset colors and blue ocean"
        },
        {
            "name": "Tropical Parrot",
            "prompt": "bright red and blue parrot with yellow wings in tropical rainforest",
            "description": "Should show vivid bird colors and green jungle"
        },
        {
            "name": "Flower Garden",
            "prompt": "vibrant flower garden with red roses, blue delphiniums, and yellow sunflowers",
            "description": "Should show distinct flower colors"
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}/4: {test_case['name']}")
        print(f"   Prompt: {test_case['prompt']}")
        print(f"   Expected: {test_case['description']}")
        
        case_results = {
            "name": test_case["name"],
            "prompt": test_case["prompt"],
            "original_success": False,
            "enhanced_success": False,
            "original_time": 0,
            "enhanced_time": 0
        }
        
        payload = {
            "prompt": test_case["prompt"],
            "steps": 16,
            "seed": 42 + i  # Different seed for each test
        }
        
        # Test original endpoint
        print("   🔄 Testing original /generate...")
        try:
            start_time = time.time()
            response = requests.post("http://localhost:8000/generate", json=payload, timeout=120)
            
            if response.status_code == 200:
                filename = f"original_{i}_{test_case['name'].lower().replace(' ', '_')}.mp4"
                with open(filename, "wb") as f:
                    f.write(response.content)
                case_results["original_success"] = True
                case_results["original_time"] = time.time() - start_time
                print(f"   ✅ Original saved: {filename} ({case_results['original_time']:.1f}s)")
            else:
                print(f"   ❌ Original failed: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Original error: {e}")
        
        # Test enhanced endpoint
        print("   🔄 Testing enhanced /generate-color...")
        try:
            start_time = time.time()
            response = requests.post("http://localhost:8000/generate-color", json=payload, timeout=120)
            
            if response.status_code == 200:
                filename = f"enhanced_{i}_{test_case['name'].lower().replace(' ', '_')}.mp4"
                with open(filename, "wb") as f:
                    f.write(response.content)
                case_results["enhanced_success"] = True
                case_results["enhanced_time"] = time.time() - start_time
                print(f"   ✅ Enhanced saved: {filename} ({case_results['enhanced_time']:.1f}s)")
            else:
                print(f"   ❌ Enhanced failed: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Enhanced error: {e}")
        
        results.append(case_results)
        time.sleep(2)  # Brief pause between tests
    
    # Summary
    print("\n📊 Test Results Summary")
    print("-" * 30)
    
    original_successes = sum(1 for r in results if r["original_success"])
    enhanced_successes = sum(1 for r in results if r["enhanced_success"])
    
    print(f"Original endpoint: {original_successes}/{len(test_cases)} successful")
    print(f"Enhanced endpoint: {enhanced_successes}/{len(test_cases)} successful")
    
    if enhanced_successes > 0:
        avg_enhanced_time = sum(r["enhanced_time"] for r in results if r["enhanced_success"]) / enhanced_successes
        print(f"Average enhanced generation time: {avg_enhanced_time:.1f}s")
    
    # List generated files
    print("\n📁 Generated Files:")
    for filename in sorted(os.listdir(".")):
        if filename.endswith(".mp4") and ("original_" in filename or "enhanced_" in filename):
            print(f"   {filename}")
    
    # Tips for comparison
    print("\n🎯 How to Compare Results:")
    print("1. Open the video files in a media player")
    print("2. Compare original_X_*.mp4 vs enhanced_X_*.mp4 for each test")
    print("3. Look for:")
    print("   - More vibrant colors in enhanced versions")
    print("   - Better color saturation")
    print("   - Less grayscale/monochrome appearance")
    print("   - More distinct color separation")
    
    return results

def test_prompt_enhancement():
    """Test how prompt enhancement affects color generation"""
    print("\n🎭 Prompt Enhancement Test")
    print("-" * 30)
    
    base_prompt = "a car on a street"
    
    test_variations = [
        {"name": "Basic", "prompt": base_prompt},
        {"name": "With Colors", "prompt": f"red {base_prompt} with blue sky"},
        {"name": "Enhanced", "prompt": f"vibrant colorful {base_prompt} with bright blue sky and green trees"},
        {"name": "Ultra Enhanced", "prompt": f"vivid bright colorful cinematic {base_prompt} with brilliant blue sky, emerald green trees, high saturation"}
    ]
    
    for i, variation in enumerate(test_variations, 1):
        print(f"\n   Test {i}: {variation['name']}")
        print(f"   Prompt: {variation['prompt']}")
        
        payload = {
            "prompt": variation["prompt"],
            "steps": 12,
            "seed": 999
        }
        
        try:
            response = requests.post("http://localhost:8000/generate-color", json=payload, timeout=60)
            
            if response.status_code == 200:
                filename = f"prompt_test_{i}_{variation['name'].lower()}.mp4"
                with open(filename, "wb") as f:
                    f.write(response.content)
                print(f"   ✅ Saved: {filename}")
            else:
                print(f"   ❌ Failed: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
    
    print("\n💡 Observe how prompt enhancement affects color quality!")

def main():
    # Check server availability
    try:
        response = requests.get("http://localhost:8000/")
        if response.status_code != 200:
            print("❌ Server not responding on port 8000")
            return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return
    
    print("✅ Server is running")
    
    # Run comprehensive tests
    comparison_results = test_color_comparison()
    test_prompt_enhancement()
    
    print("\n🎉 Comprehensive testing complete!")
    print("Check the generated .mp4 files to see the color improvements.")

if __name__ == "__main__":
    main()
