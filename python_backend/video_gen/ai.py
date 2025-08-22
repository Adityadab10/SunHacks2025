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
    # Load pipeline - keep it simple
    pipe = DiffusionPipeline.from_pretrained(
        "damo-vilab/text-to-video-ms-1.7b",
        torch_dtype=torch.float16,
        variant="fp16"
    )
    
    # Move everything to GPU
    pipe = pipe.to("cuda")
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
        
        # Generate video
        with torch.inference_mode():
            result = pipe(req.prompt, num_inference_steps=req.steps)
            video_frames = result.frames  # could be numpy or PIL

        # Track peak memory
        current_memory = get_gpu_memory_mb()
        if current_memory['allocated'] > peak_memory['allocated']:
            peak_memory = current_memory

        # Handle different frame formats
        logger.info(f"Raw frames type: {type(video_frames)}")
        if isinstance(video_frames, list) and len(video_frames) > 0:
            logger.info(f"First frame type: {type(video_frames[0])}, shape: {getattr(video_frames[0], 'shape', 'N/A')}")
        elif hasattr(video_frames, 'shape'):
            logger.info(f"Frames shape: {video_frames.shape}")

        # Convert to list of individual frames
        frame_list = []
        if isinstance(video_frames, np.ndarray):
            if len(video_frames.shape) == 5:  # (batch, frames, height, width, channels)
                logger.info(f"Converting 5D array of shape {video_frames.shape} to frame list")
                # Take the first batch and iterate through frames
                batch = video_frames[0]  # Shape: (16, 256, 256, 3)
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
            # Check if it's a list of 4D arrays that need to be split
            for item in video_frames:
                if isinstance(item, np.ndarray) and len(item.shape) == 4:
                    for i in range(item.shape[0]):
                        frame_list.append(item[i])
                else:
                    frame_list.append(item)
        else:
            frame_list = video_frames

        # Normalize frames to ensure proper channel format
        fixed_frames = []
        for i, f in enumerate(frame_list):
            try:
                if hasattr(f, "convert"):  
                    # It's a PIL.Image
                    rgb_frame = f.convert("RGB")
                    frame_array = np.array(rgb_frame)
                    fixed_frames.append(frame_array.astype(np.uint8))
                    
                elif isinstance(f, np.ndarray):
                    # Already numpy - fix channels and dimensions
                    frame = f.copy()
                    
                    # Handle different shapes
                    if len(frame.shape) == 4:
                        logger.error(f"Frame {i}: Still 4D after splitting: {frame.shape}")
                        # Take first frame if it's still a batch
                        frame = frame[0] if frame.shape[0] > 0 else frame[0:1].squeeze(0)
                    
                    if len(frame.shape) == 2:  # grayscale -> expand to RGB
                        frame = np.stack([frame] * 3, axis=-1)
                    elif len(frame.shape) == 3:
                        if frame.shape[-1] == 1:  # single channel -> expand
                            frame = np.repeat(frame, 3, axis=-1)
                        elif frame.shape[-1] == 4:  # RGBA -> RGB
                            frame = frame[:, :, :3]
                        elif frame.shape[-1] == 2:  # 2 channels -> expand to 3
                            # Add a third channel (copy first channel)
                            third_channel = frame[:, :, 0:1]
                            frame = np.concatenate([frame, third_channel], axis=-1)
                        elif frame.shape[-1] > 4:
                            logger.warning(f"Frame {i}: Too many channels {frame.shape[-1]}, taking first 3")
                            frame = frame[:, :, :3]
                    
                    # Ensure uint8 and proper range
                    if frame.dtype != np.uint8:
                        if frame.max() <= 1.0:
                            frame = (frame * 255).astype(np.uint8)
                        else:
                            frame = np.clip(frame, 0, 255).astype(np.uint8)
                    
                    # Final validation
                    if len(frame.shape) != 3 or frame.shape[-1] != 3:
                        logger.error(f"Frame {i}: Final shape {frame.shape} is invalid")
                        # Create a valid RGB frame
                        frame = np.zeros((256, 256, 3), dtype=np.uint8)
                    
                    fixed_frames.append(frame)
                else:
                    logger.error(f"Frame {i}: Unsupported type {type(f)}, creating fallback")
                    fallback_frame = np.zeros((256, 256, 3), dtype=np.uint8)
                    fixed_frames.append(fallback_frame)
                    
            except Exception as frame_error:
                logger.error(f"Error processing frame {i}: {frame_error}")
                # Create a black RGB frame as fallback
                fallback_frame = np.zeros((256, 256, 3), dtype=np.uint8)
                fixed_frames.append(fallback_frame)

        if not fixed_frames:
            raise ValueError("No valid frames generated")

        # Verify all frames have correct shape
        for i, frame in enumerate(fixed_frames):
            if len(frame.shape) != 3 or frame.shape[-1] != 3:
                logger.error(f"Frame {i} shape issue: {frame.shape}")
                # Fix it
                if len(frame.shape) == 2:
                    fixed_frames[i] = np.stack([frame] * 3, axis=-1)
                elif frame.shape[-1] != 3:
                    fixed_frames[i] = frame[:, :, :3] if frame.shape[-1] > 3 else np.stack([frame[:, :, 0]] * 3, axis=-1)

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