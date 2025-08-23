import torch
import os
import sys
import logging
import warnings
from typing import Optional
import uuid
import numpy as np
import tempfile
import time

# Remove memory constraints for maximum speed
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
os.environ["PYTHONWARNINGS"] = "ignore"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress warnings
warnings.filterwarnings("ignore")

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler
from diffusers.utils import export_to_video

def get_gpu_memory_mb():
    """Get GPU memory in MB"""
    if torch.cuda.is_available():
        return {
            "total": torch.cuda.get_device_properties(0).total_memory / (1024**2),
            "allocated": torch.cuda.memory_allocated() / (1024**2),
            "free": (torch.cuda.get_device_properties(0).total_memory - torch.cuda.memory_allocated()) / (1024**2)
        }
    return {"available": False}

logger.info("🚀 Loading pipeline for MAXIMUM SPEED on your 3.7GB GPU...")

try:
    # Load pipeline with improved settings for color generation
    pipe = DiffusionPipeline.from_pretrained(
        "damo-vilab/text-to-video-ms-1.7b",
        torch_dtype=torch.float16,
        variant="fp16",
        use_safetensors=True
    )
    
    # Move everything to GPU
    pipe = pipe.to("cuda")
    
    # Configure pipeline for better color generation (with error handling)
    try:
        pipe.vae.enable_slicing()
        pipe.vae.enable_tiling()
        logger.info("✅ VAE optimizations enabled")
    except AttributeError:
        logger.info("⚠️ VAE optimizations not available for this model")
    
    logger.info(f"📍 Pipeline on GPU: {next(pipe.unet.parameters()).device}")
    
    # CHOOSE YOUR SPEED STRATEGY:
    strategy = "BALANCED"  # Change this to test different approaches
    
    if strategy == "MAXIMUM_SPEED":
        # No CPU offloading - keep everything on GPU
        logger.info("🔥 MAXIMUM SPEED: Everything on GPU")
        pass  # No offloading
        
    elif strategy == "BALANCED":
        # Light CPU offloading for stability with your 3.7GB
        logger.info("⚡ BALANCED: Light CPU offloading for 3.7GB GPU")
        pipe.enable_model_cpu_offload()
        pipe.enable_attention_slicing(2)
        
    elif strategy == "SAFE":
        # Conservative for guaranteed stability
        logger.info("🛡️ SAFE: Conservative memory management")
        pipe.enable_sequential_cpu_offload()
        pipe.enable_attention_slicing(1)
    
    # Try to enable xformers for speed
    try:
        pipe.enable_xformers_memory_efficient_attention()
        logger.info("✅ xFormers enabled for speed")
    except:
        logger.info("⚠️ xFormers not available")
    
    # Use faster scheduler
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
    
    # Check memory usage after loading
    memory = get_gpu_memory_mb()
    logger.info(f"✅ Pipeline loaded! GPU memory: {memory['allocated']:.0f}MB / {memory['total']:.0f}MB")
    logger.info(f"🎯 Strategy: {strategy}")
    
except Exception as e:
    logger.error(f"❌ Failed to load: {e}")
    sys.exit(1)

# FastAPI app
app = FastAPI(title="Simple Fast Video API")

class VideoRequest(BaseModel):
    prompt: str = Field(..., max_length=200)
    steps: int = Field(default=20, ge=8, le=30)
    seed: Optional[int] = None

@app.get("/")
async def root():
    memory = get_gpu_memory_mb()
    return {
        "status": "🚀 Ready for fast video generation",
        "gpu_memory_mb": f"{memory['allocated']:.0f} / {memory['total']:.0f}",
        "strategy": "BALANCED",
        "tip": "Lower steps (10-15) = faster, higher steps (20-25) = better quality"
    }

@app.get("/pipeline-info")
async def get_pipeline_info():
    """Get information about the pipeline and supported parameters"""
    try:
        import inspect
        
        # Get the __call__ method signature
        call_signature = inspect.signature(pipe.__call__)
        parameters = list(call_signature.parameters.keys())
        
        return {
            "pipeline_class": pipe.__class__.__name__,
            "supported_parameters": parameters,
            "has_guidance_scale": "guidance_scale" in parameters,
            "has_generator": "generator" in parameters,
            "has_num_videos_per_prompt": "num_videos_per_prompt" in parameters,
            "has_num_inference_steps": "num_inference_steps" in parameters
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/generate-color")
async def generate_color_enhanced(req: VideoRequest):
    """Enhanced color generation with better post-processing"""
    logger.info(f"🎨 Generating COLORFUL video: '{req.prompt}' with {req.steps} steps")
    
    start_time = time.time()
    start_memory = get_gpu_memory_mb()
    peak_memory = start_memory
    
    try:
        # Set seed
        if req.seed:
            torch.manual_seed(req.seed)
        
        # Generate video with enhanced color settings
        with torch.inference_mode():
            # Add multiple color-focused keywords
            color_prompt = f"vibrant colors, high saturation, cinematic, colorful, vivid: {req.prompt}"
            
            # Use supported parameters for maximum color enhancement
            kwargs = {
                "prompt": color_prompt,
                "num_inference_steps": req.steps,
                "guidance_scale": 8.5,  # Higher guidance for better color
                "output_type": "np",  # Ensure numpy output for better processing
                "negative_prompt": "black and white, monochrome, grayscale, dull, faded"  # Avoid B&W
            }
            
            # Add generator if seed is provided
            if req.seed:
                kwargs["generator"] = torch.Generator().manual_seed(req.seed)
            
            result = pipe(**kwargs)
            video_frames = result.frames

        # Track peak memory
        current_memory = get_gpu_memory_mb()
        if current_memory['allocated'] > peak_memory['allocated']:
            peak_memory = current_memory

        # Enhanced frame processing for maximum color preservation
        logger.info(f"Processing frames for color enhancement...")
        processed_frames = []
        
        # Extract frames
        if hasattr(video_frames, 'shape') and len(video_frames.shape) == 5:
            frames = video_frames[0]  # Take first batch
        elif hasattr(video_frames, 'shape') and len(video_frames.shape) == 4:
            frames = video_frames
        elif isinstance(video_frames, list):
            frames = video_frames[0] if len(video_frames) > 0 else video_frames
        else:
            frames = video_frames
            
        # Process each frame with color enhancement
        for i in range(len(frames) if hasattr(frames, '__len__') else frames.shape[0]):
            frame = frames[i] if hasattr(frames, '__getitem__') else frames[i]
            
            # Convert to numpy if needed
            if hasattr(frame, 'convert'):  # PIL Image
                frame_array = np.array(frame.convert('RGB'))
            else:
                frame_array = frame.copy()
            
            # Ensure proper data type and range
            if frame_array.dtype != np.uint8:
                if frame_array.min() >= -1 and frame_array.max() <= 1:
                    # Normalized [-1, 1] to [0, 255]
                    frame_array = ((frame_array + 1.0) * 127.5).astype(np.uint8)
                elif frame_array.min() >= 0 and frame_array.max() <= 1:
                    # Normalized [0, 1] to [0, 255]
                    frame_array = (frame_array * 255.0).astype(np.uint8)
                else:
                    frame_array = np.clip(frame_array, 0, 255).astype(np.uint8)
            
            # Ensure RGB format
            if len(frame_array.shape) == 2:
                frame_array = np.stack([frame_array] * 3, axis=-1)
            elif frame_array.shape[-1] == 1:
                frame_array = np.repeat(frame_array, 3, axis=-1)
            elif frame_array.shape[-1] > 3:
                frame_array = frame_array[:, :, :3]
            
            # Apply color enhancement
            enhanced_frame = enhance_colors(frame_array)
            processed_frames.append(enhanced_frame)

        if not processed_frames:
            raise ValueError("No frames processed successfully")

        # Log color statistics
        sample_frame = processed_frames[0]
        r_mean, g_mean, b_mean = sample_frame[:,:,0].mean(), sample_frame[:,:,1].mean(), sample_frame[:,:,2].mean()
        logger.info(f"Enhanced frame colors - R: {r_mean:.1f}, G: {g_mean:.1f}, B: {b_mean:.1f}")

        video_id = str(uuid.uuid4())[:6]
        video_path = f"/tmp/video_color_{video_id}.mp4"
        
        logger.info(f"Exporting {len(processed_frames)} color-enhanced frames...")
        export_to_video(processed_frames, output_video_path=video_path, fps=8)
        
        end_time = time.time()
        logger.info(f"✅ Colorful video generated in {end_time - start_time:.1f}s")
        
        return FileResponse(
            video_path,
            media_type="video/mp4",
            filename=f"colorful_video_{video_id}.mp4"
        )
        
    except Exception as e:
        logger.error(f"❌ Color generation error: {e}")
        torch.cuda.empty_cache()
        raise HTTPException(status_code=500, detail=str(e))

def enhance_colors(frame_array):
    """Apply color enhancement to improve saturation and vibrancy"""
    frame = frame_array.astype(np.float32) / 255.0
    
    # Convert to HSV for better color manipulation
    try:
        import cv2
        hsv = cv2.cvtColor(frame, cv2.COLOR_RGB2HSV)
        
        # Enhance saturation (increase by 20%)
        hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.2, 0, 1)
        
        # Slightly increase value/brightness
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] * 1.1, 0, 1)
        
        # Convert back to RGB
        enhanced = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
        
    except ImportError:
        # Fallback enhancement without OpenCV
        logger.warning("OpenCV not available, using basic color enhancement")
        enhanced = frame.copy()
        
        # Simple contrast and brightness adjustment
        enhanced = enhanced * 1.1  # Increase brightness
        enhanced = np.clip(enhanced, 0, 1)
        
        # Increase color separation
        mean_color = enhanced.mean()
        enhanced = enhanced + (enhanced - mean_color) * 0.2
        enhanced = np.clip(enhanced, 0, 1)
    
    return (enhanced * 255).astype(np.uint8)

@app.post("/generate")
async def generate(req: VideoRequest):
    logger.info(f"🎬 Generating: '{req.prompt}' with {req.steps} steps")
    
    start_time = time.time()
    start_memory = get_gpu_memory_mb()
    peak_memory = start_memory
    
    try:
        # Set seed
        if req.seed:
            torch.manual_seed(req.seed)
        
        # Generate video with enhanced color settings
        with torch.inference_mode():
            # Add guidance for better color generation
            enhanced_prompt = f"high quality, colorful, vibrant, detailed: {req.prompt}"
            
            # Use supported parameters for better quality
            kwargs = {
                "prompt": enhanced_prompt,
                "num_inference_steps": req.steps,
                "guidance_scale": 7.5,  # Higher guidance for better adherence to prompt
                "output_type": "np"  # Ensure numpy output for better processing
            }
            
            # Add generator if seed is provided
            if req.seed:
                kwargs["generator"] = torch.Generator().manual_seed(req.seed)
            
            result = pipe(**kwargs)
            video_frames = result.frames

        # Track peak memory
        current_memory = get_gpu_memory_mb()
        if current_memory['allocated'] > peak_memory['allocated']:
            peak_memory = current_memory

        # Enhanced frame processing for better color preservation
        logger.info(f"Raw frames type: {type(video_frames)}")
        if isinstance(video_frames, list) and len(video_frames) > 0:
            logger.info(f"First frame type: {type(video_frames[0])}, shape: {getattr(video_frames[0], 'shape', 'N/A')}")
        elif hasattr(video_frames, 'shape'):
            logger.info(f"Frames shape: {video_frames.shape}")

        # Convert to list of individual frames with better color handling
        frame_list = []
        if isinstance(video_frames, np.ndarray):
            if len(video_frames.shape) == 5:  # (batch, frames, height, width, channels)
                logger.info(f"Converting 5D array of shape {video_frames.shape} to frame list")
                batch = video_frames[0]  # Take first batch
                for i in range(batch.shape[0]):
                    frame_list.append(batch[i])
            elif len(video_frames.shape) == 4:  # (frames, height, width, channels)
                logger.info(f"Converting 4D array of shape {video_frames.shape} to frame list")
                for i in range(video_frames.shape[0]):
                    frame_list.append(video_frames[i])
            elif len(video_frames.shape) == 3:  # Single frame
                frame_list = [video_frames]
            else:
                raise ValueError(f"Unexpected video frames shape: {video_frames.shape}")
        elif isinstance(video_frames, list):
            for item in video_frames:
                if isinstance(item, np.ndarray) and len(item.shape) == 4:
                    for i in range(item.shape[0]):
                        frame_list.append(item[i])
                else:
                    frame_list.append(item)
        else:
            frame_list = video_frames

        # Improved frame processing for color preservation
        fixed_frames = []
        for i, f in enumerate(frame_list):
            try:
                if hasattr(f, "convert"):  
                    # PIL Image - ensure RGB mode
                    if f.mode != "RGB":
                        rgb_frame = f.convert("RGB")
                    else:
                        rgb_frame = f
                    frame_array = np.array(rgb_frame)
                    # Ensure proper data type and range
                    if frame_array.dtype != np.uint8:
                        if frame_array.max() <= 1.0:
                            frame_array = (frame_array * 255).astype(np.uint8)
                        else:
                            frame_array = np.clip(frame_array, 0, 255).astype(np.uint8)
                    fixed_frames.append(frame_array)
                    
                elif isinstance(f, np.ndarray):
                    frame = f.copy()
                    
                    # Handle different array dimensions
                    if len(frame.shape) == 4:
                        logger.warning(f"Frame {i}: 4D shape {frame.shape}, taking first element")
                        frame = frame[0]
                    
                    # Ensure 3D array (height, width, channels)
                    if len(frame.shape) == 2:
                        # Grayscale - convert to RGB by repeating the single channel
                        frame = np.stack([frame, frame, frame], axis=-1)
                        logger.info(f"Frame {i}: Converted grayscale to RGB")
                    elif len(frame.shape) == 3:
                        if frame.shape[-1] == 1:
                            # Single channel - expand to RGB
                            frame = np.repeat(frame, 3, axis=-1)
                            logger.info(f"Frame {i}: Expanded single channel to RGB")
                        elif frame.shape[-1] == 4:
                            # RGBA - remove alpha channel
                            frame = frame[:, :, :3]
                            logger.info(f"Frame {i}: Removed alpha channel")
                        elif frame.shape[-1] != 3:
                            logger.warning(f"Frame {i}: Unexpected channels {frame.shape[-1]}, forcing to 3")
                            if frame.shape[-1] > 3:
                                frame = frame[:, :, :3]
                            else:
                                # Pad or repeat channels to get 3
                                while frame.shape[-1] < 3:
                                    frame = np.concatenate([frame, frame[:, :, :1]], axis=-1)
                                frame = frame[:, :, :3]
                    
                    # Normalize values to uint8 range [0, 255]
                    if frame.dtype == np.float32 or frame.dtype == np.float64:
                        if frame.min() >= 0.0 and frame.max() <= 1.0:
                            # Normalized float [0,1] -> [0,255]
                            frame = (frame * 255.0).astype(np.uint8)
                            logger.info(f"Frame {i}: Converted float [0,1] to uint8")
                        elif frame.min() >= -1.0 and frame.max() <= 1.0:
                            # Normalized float [-1,1] -> [0,255]
                            frame = ((frame + 1.0) * 127.5).astype(np.uint8)
                            logger.info(f"Frame {i}: Converted float [-1,1] to uint8")
                        else:
                            # Unknown range - clip to [0,255]
                            frame = np.clip(frame, 0, 255).astype(np.uint8)
                            logger.warning(f"Frame {i}: Clipped unknown float range to uint8")
                    elif frame.dtype != np.uint8:
                        # Other integer types - clip and convert
                        frame = np.clip(frame, 0, 255).astype(np.uint8)
                    
                    # Final shape validation
                    if len(frame.shape) != 3 or frame.shape[-1] != 3:
                        logger.error(f"Frame {i}: Invalid final shape {frame.shape}")
                        # Create a colorful test pattern instead of black
                        h, w = frame.shape[:2] if len(frame.shape) >= 2 else (256, 256)
                        frame = np.zeros((h, w, 3), dtype=np.uint8)
                        # Add some color to indicate this is a fallback
                        frame[:, :, 0] = 128  # Red channel
                        frame[:, :, 1] = 64   # Green channel
                        frame[:, :, 2] = 192  # Blue channel
                    
                    fixed_frames.append(frame)
                else:
                    logger.error(f"Frame {i}: Unsupported type {type(f)}")
                    # Create a colorful fallback frame
                    fallback_frame = np.full((256, 256, 3), [128, 64, 192], dtype=np.uint8)
                    fixed_frames.append(fallback_frame)
                    
            except Exception as frame_error:
                logger.error(f"Error processing frame {i}: {frame_error}")
                # Create a colorful error indicator frame
                error_frame = np.full((256, 256, 3), [255, 128, 0], dtype=np.uint8)  # Orange
                fixed_frames.append(error_frame)

        if not fixed_frames:
            raise ValueError("No valid frames generated")

        # Log color statistics for debugging
        if fixed_frames:
            sample_frame = fixed_frames[0]
            logger.info(f"Sample frame - Shape: {sample_frame.shape}, dtype: {sample_frame.dtype}")
            logger.info(f"Color stats - R: {sample_frame[:,:,0].mean():.1f}, G: {sample_frame[:,:,1].mean():.1f}, B: {sample_frame[:,:,2].mean():.1f}")
            logger.info(f"Value range - Min: {sample_frame.min()}, Max: {sample_frame.max()}")

        video_id = str(uuid.uuid4())[:6]
        video_path = f"/tmp/video_{video_id}.mp4"
        
        logger.info(f"Exporting {len(fixed_frames)} frames to video...")
        
        # Export video using the fixed frames
        export_to_video(fixed_frames, output_video_path=video_path, fps=8)
        
        end_time = time.time()
        logger.info(f"✅ Video generated in {end_time - start_time:.1f}s")
        
        return FileResponse(
            video_path,
            media_type="video/mp4",
            filename=f"video_{video_id}.mp4"
        )
        
    except torch.cuda.OutOfMemoryError as e:
        logger.error(f"💥 Out of memory! Peak usage: {peak_memory['allocated']:.0f}MB")
        torch.cuda.empty_cache()
        raise HTTPException(
            status_code=507, 
            detail=f"GPU memory exceeded ({peak_memory['allocated']:.0f}MB used). Try reducing steps to 12-15."
        )
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        torch.cuda.empty_cache()  # Clean up on any error
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/benchmark")
async def benchmark():
    """Quick speed test"""
    logger.info("🏃‍♂️ Running benchmark...")
    
    start = time.time()
    try:
        with torch.inference_mode():
            _ = pipe("test video", num_inference_steps=8)
        
        duration = time.time() - start
        memory = get_gpu_memory_mb()
        
        return {
            "benchmark": {
                "time_seconds": round(duration, 1),
                "steps": 8,
                "peak_memory_mb": round(memory['allocated']),
                "rating": "🚀 FAST" if duration < 30 else "⚡ GOOD" if duration < 60 else "🐌 SLOW"
            }
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/change-strategy/{strategy}")
async def change_strategy(strategy: str):
    """Change speed strategy (requires restart)"""
    strategies = {
        "maximum": "Everything on GPU - fastest but uses most memory",
        "balanced": "Light CPU offloading - good speed with stability", 
        "safe": "Heavy CPU offloading - slowest but most stable"
    }
    
    if strategy.lower() in strategies:
        return {
            "message": f"To use {strategy.upper()} strategy:",
            "instructions": [
                f"1. Edit line 30 in the code: strategy = \"{strategy.upper()}\"",
                "2. Restart the server",
                f"3. Strategy description: {strategies[strategy.lower()]}"
            ]
        }
    else:
        return {"error": "Valid strategies: maximum, balanced, safe"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)