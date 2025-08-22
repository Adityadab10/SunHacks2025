import torch
from fastapi import FastAPI
from pydantic import BaseModel
from diffusers import DiffusionPipeline, DPMSolverMultistepScheduler
from diffusers.utils import export_to_video
from fastapi.responses import FileResponse
import tempfile

# Load pipeline once when API starts
pipe = DiffusionPipeline.from_pretrained(
    "damo-vilab/text-to-video-ms-1.7b",
    torch_dtype=torch.float16,
    variant="fp16"
)
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)
pipe.enable_model_cpu_offload()

# FastAPI app
app = FastAPI()

class GenerateRequest(BaseModel):
    prompt: str
    steps: int = 25

@app.post("/generate")
def generate_video(req: GenerateRequest):
    # Run model
    video_frames = pipe(req.prompt, num_inference_steps=req.steps).frames
    
    # Save to temporary mp4 file
    tmpfile = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    video_path = export_to_video(video_frames, output_video_path=tmpfile.name)

    # Return file as downloadable response
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename="generated_video.mp4"
    )
