from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import asyncio
import tempfile
import os
import uuid
import logging
from datetime import datetime

# Import your existing modules
from flashcards.agent import (
    chat_with_teacher, 
    get_conversation_history, 
    cleanup_conversation,
    create_user_input,
    stream_graph_updates
)

app = FastAPI(title="Teacher Agent API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models
class ChatRequest(BaseModel):
    message: str
    teacher: str = "Anil Deshmukh"
    thread_id: str = "default"

class ChatWithPDFRequest(BaseModel):
    message: str
    teacher: str = "Anil Deshmukh"
    thread_id: str = "default"

class ThreadResponse(BaseModel):
    thread_id: str
    status: str
    message: str

class HistoryResponse(BaseModel):
    thread_id: str
    messages: List[dict]

# In-memory storage for uploaded files (use proper storage in production)
uploaded_files = {}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Teacher Agent API",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/chat",
            "upload_and_chat": "/upload-and-chat",
            "stream_chat": "/stream/chat",
            "stream_upload_chat": "/stream/upload-and-chat",
            "history": "/history/{thread_id}",
            "cleanup": "/cleanup/{thread_id}"
        }
    }

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Simple chat endpoint without streaming"""
    try:
        responses = []
        async for response in chat_with_teacher(
            message=request.message,
            teacher=request.teacher,
            thread_id=request.thread_id
        ):
            if response.get("content"):
                responses.append(response)
        
        return {
            "thread_id": request.thread_id,
            "responses": responses,
            "status": "success"
        }
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-and-chat")
async def upload_and_chat_endpoint(
    file: UploadFile = File(...),
    message: str = "What is this document about?",
    teacher: str = "Anil Deshmukh",
    thread_id: Optional[str] = None
):
    """Upload PDF and chat endpoint without streaming"""
    if thread_id is None:
        thread_id = str(uuid.uuid4())
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        # Store file info
        uploaded_files[thread_id] = temp_file.name
        
        responses = []
        async for response in chat_with_teacher(
            message=message,
            teacher=teacher,
            pdf_path=temp_file.name,
            thread_id=thread_id
        ):
            if response.get("content"):
                responses.append(response)
        
        return {
            "thread_id": thread_id,
            "filename": file.filename,
            "responses": responses,
            "status": "success"
        }
    
    except Exception as e:
        logger.error(f"Error in upload and chat endpoint: {e}")
        # Clean up temp file on error
        if thread_id in uploaded_files:
            try:
                os.unlink(uploaded_files[thread_id])
                del uploaded_files[thread_id]
            except:
                pass
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stream/chat")
async def stream_chat_endpoint(request: ChatRequest):
    """Streaming chat endpoint"""
    
    async def generate_stream():
        try:
            async for response in chat_with_teacher(
                message=request.message,
                teacher=request.teacher,
                thread_id=request.thread_id
            ):
                # Format for Server-Sent Events
                yield f"data: {json.dumps(response)}\n\n"
                
                # Add a small delay to prevent overwhelming the client
                await asyncio.sleep(0.1)
                
        except Exception as e:
            error_response = {
                "type": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_response)}\n\n"
        
        # Send completion signal
        yield f"data: {json.dumps({'type': 'complete', 'timestamp': datetime.now().isoformat()})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@app.post("/stream/upload-and-chat")
async def stream_upload_and_chat_endpoint(
    file: UploadFile = File(...),
    message: str = "What is this document about?",
    teacher: str = "Anil Deshmukh",
    thread_id: Optional[str] = None
):
    """Streaming upload and chat endpoint"""
    if thread_id is None:
        thread_id = str(uuid.uuid4())
    
    async def generate_stream():
        temp_file_path = None
        try:
            # Validate file type
            if not file.filename.lower().endswith('.pdf'):
                error_response = {
                    "type": "error",
                    "error": "Only PDF files are supported",
                    "timestamp": datetime.now().isoformat()
                }
                yield f"data: {json.dumps(error_response)}\n\n"
                return
            
            # Save uploaded file temporarily
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
            content = await file.read()
            temp_file.write(content)
            temp_file.close()
            temp_file_path = temp_file.name
            
            # Store file info
            uploaded_files[thread_id] = temp_file_path
            
            # Send upload confirmation
            upload_response = {
                "type": "upload_complete",
                "filename": file.filename,
                "thread_id": thread_id,
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(upload_response)}\n\n"
            
            # Start chat with PDF
            async for response in chat_with_teacher(
                message=message,
                teacher=teacher,
                pdf_path=temp_file_path,
                thread_id=thread_id
            ):
                yield f"data: {json.dumps(response)}\n\n"
                await asyncio.sleep(0.1)
                
        except Exception as e:
            error_response = {
                "type": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            yield f"data: {json.dumps(error_response)}\n\n"
            
            # Clean up on error
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                    if thread_id in uploaded_files:
                        del uploaded_files[thread_id]
                except:
                    pass
        
        # Send completion signal
        yield f"data: {json.dumps({'type': 'complete', 'timestamp': datetime.now().isoformat()})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@app.get("/history/{thread_id}")
async def get_history_endpoint(thread_id: str):
    """Get conversation history for a thread"""
    try:
        messages = get_conversation_history(thread_id)
        return HistoryResponse(thread_id=thread_id, messages=messages)
    
    except Exception as e:
        logger.error(f"Error getting history for {thread_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/cleanup/{thread_id}")
async def cleanup_endpoint(thread_id: str, background_tasks: BackgroundTasks):
    """Clean up conversation and resources"""
    try:
        # Clean up uploaded file
        if thread_id in uploaded_files:
            file_path = uploaded_files[thread_id]
            background_tasks.add_task(cleanup_file, file_path)
            del uploaded_files[thread_id]
        
        # Clean up conversation
        cleanup_conversation(thread_id)
        
        return ThreadResponse(
            thread_id=thread_id,
            status="success",
            message="Conversation and resources cleaned up"
        )
    
    except Exception as e:
        logger.error(f"Error cleaning up {thread_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/teachers")
async def get_teachers():
    """Get available teachers"""
    return {
        "teachers": [
            "Anil Deshmukh",
            "Kavita Iyer", 
            "Raghav Sharma",
            "Mary Fernandes"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

def cleanup_file(file_path: str):
    """Background task to clean up uploaded files"""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            logger.info(f"Cleaned up file: {file_path}")
    except Exception as e:
        logger.error(f"Error cleaning up file {file_path}: {e}")

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Teacher Agent API starting up...")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Teacher Agent API shutting down...")
    # Clean up all uploaded files
    for thread_id, file_path in uploaded_files.items():
        cleanup_file(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)