from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
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
from flashcards.flashcard_agent import graph
from flashcards.agent import agent
from langchain_core.messages import HumanMessage


app = FastAPI(title="Teacher Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

uploaded_files = {}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Simple chat endpoint"""
    try:
        # Build state for chat
        state = {
            "messages": [HumanMessage(content=request.message)],
            "teacher": request.teacher,
            "pdf_path": None
        }

        # Execute graph directly
        result = await agent.ainvoke(state, config={"configurable": {"thread_id": request.thread_id}})
        
        # Extract response from result
        if isinstance(result, dict) and 'messages' in result:
            response = result['messages'][-1].content
            return JSONResponse({
                "status": "success",
                "thread_id": request.thread_id,
                "response": response.content
            })
        else:
            raise ValueError("Invalid response format from graph")

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return JSONResponse(
            {"status": "error", "detail": str(e)},
            status_code=500
        )

@app.post("/upload-and-chat")
async def upload_and_chat_endpoint(
    file: UploadFile = File(...),
    message: str = "What is this document about?",
    teacher: str = "Anil Deshmukh",
    user_id: Optional[str] = None
):
    """Upload PDF and chat endpoint"""
    if user_id is None:
        user_id = str(uuid.uuid4())

    temp_file_path = None
    try:
        # Validate PDF
        if not file.filename.lower().endswith('.pdf'):
            return JSONResponse(
                {"status": "error", "detail": "Only PDF files supported"},
                status_code=400
            )

        # Save uploaded file
        content = await file.read()
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_file.write(content)
        temp_file.close()
        temp_file_path = temp_file.name

        uploaded_files[user_id] = temp_file_path

        # Build state for chat with PDF
        state = {
            "messages": [HumanMessage(content=message)],
            "teacher": teacher,
            "pdf_path": temp_file_path
        }

        # Execute graph directly
        result = await agent.ainvoke(state)
        
        # Extract response from result
        if isinstance(result, dict) and 'messages' in result:
            response = result['messages'][-1].content
            return JSONResponse({
                "status": "success",
                "thread_id": user_id,
                "filename": file.filename,
                "response": response
            })
        else:
            raise ValueError("Invalid response format from graph")

    except Exception as e:
        logger.error(f"Error in upload and chat endpoint: {e}")
        return JSONResponse(
            {"status": "error", "detail": str(e)},
            status_code=500
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                uploaded_files.pop(user_id, None)
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {e}")

@app.post("/flashcards")
async def flashcard_generation(
    file: Optional[UploadFile] = None,
    message: str = "Generate flashcards from the following content",
    teacher: str = "Anil Deshmukh",
    thread_id: Optional[str] = None
):
    """Direct flashcard generation endpoint"""
    if thread_id is None:
        thread_id = str(uuid.uuid4())

    temp_dir = None
    temp_file_path = None

    try:
        # Handle PDF file if provided
        if file:
            if not file.filename.lower().endswith(".pdf"):
                return JSONResponse(
                    {"status": "error", "detail": "Only PDF files supported"},
                    status_code=400,
                )

            temp_dir = tempfile.mkdtemp()
            temp_file_path = os.path.join(temp_dir, f"{thread_id}.pdf")

            file_content = await file.read()
            with open(temp_file_path, "wb") as f:
                f.write(file_content)

            await file.close()

        # Build state for flashcard generation
        state = {
            "messages": [HumanMessage(content=message)],
            "teacher": teacher,
            "pdf_path": temp_file_path,
        }

        # Generate flashcards
        try:
            result = await graph.ainvoke(state)
            print()

            result = result['result']
        
            flashcards = []
            for i in range(1, 11):
                question_key = f"question_{i}"
                answer_key = f"answer_{i}"
                
                if result[question_key] and result[answer_key]:
                    flashcards.append({
                        "question": result[question_key],
                        "answer": result[answer_key]
                    })

            if not flashcards:
                return JSONResponse(
                    {"status": "error", "detail": "No flashcards were generated"},
                    status_code=500
                )

            return JSONResponse({
                "status": "success",
                "flashcards": flashcards
            })

        except Exception as e:
            logger.error(f"Error in graph invocation: {e}")
            return JSONResponse(
                {"status": "error", "detail": str(e)},
                status_code=500
            )

    except Exception as e:
        logger.error(f"Error in flashcard generation: {e}")
        return JSONResponse(
            {"status": "error", "detail": str(e)},
            status_code=500
        )

    finally:
        # Cleanup temp files
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.error(f"Error removing temp file: {e}")

        if temp_dir and os.path.exists(temp_dir):
            try:
                os.rmdir(temp_dir)
            except Exception as e:
                logger.error(f"Error removing temp directory: {e}")
                
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.on_event("startup")
async def startup_event():
    logger.info("Teacher Agent API starting up...")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Teacher Agent API shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
