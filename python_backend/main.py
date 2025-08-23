from fastapi import FastAPI, File, UploadFile, HTTPException, Form
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
from flashcards.video_agent import graph_imp

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
    thread_id: Optional[str] = None  # Made optional

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
        state = {
            "messages": [HumanMessage(content=request.message)],
            "teacher": request.teacher,
            "pdf_path": None,
        }

        result = await agent.ainvoke(state, config={"configurable": {"thread_id": request.thread_id}})

        if isinstance(result, dict) and 'messages' in result:
            response = result['messages'][-1]
            response_content = extract_message_content(response)

            return JSONResponse({
                "status": "success",
                "thread_id": request.thread_id,
                "response": response_content
            })
        else:
            raise ValueError("Invalid response format from graph")

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        return JSONResponse(
            {"status": "error", "detail": str(e)},
            status_code=500
        )
def extract_message_content(message):
    """Extract clean text content from various message formats"""
    if hasattr(message, 'content'):
        content = message.content
        
        # If content is a string, return it directly
        if isinstance(content, str):
            return content.strip()
        
        # If content is a list (tool calls, etc.), extract text parts
        elif isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, dict):
                    if 'text' in item:
                        text_parts.append(item['text'])
                    elif 'content' in item:
                        text_parts.append(str(item['content']))
                elif isinstance(item, str):
                    text_parts.append(item)
                else:
                    text_parts.append(str(item))
            return ' '.join(text_parts).strip()
        
        # If content is a dict, try to find text
        elif isinstance(content, dict):
            if 'text' in content:
                return content['text'].strip()
            elif 'content' in content:
                return str(content['content']).strip()
            else:
                return str(content).strip()
    
    # Fallback: convert entire message to string and clean it
    message_str = str(message)
    
    # Try to extract just the main content using regex
    import re
    
    # Pattern to match content='...' 
    content_match = re.search(r"content='([^']*)'", message_str)
    if content_match:
        return content_match.group(1).strip()
    
    # Pattern to match content="..."
    content_match = re.search(r'content="([^"]*)"', message_str)
    if content_match:
        return content_match.group(1).strip()
    
    # If no pattern matches, return the full string (as fallback)
    return message_str.strip()


@app.post("/upload-and-chat")
async def upload_and_chat_endpoint(
    file: UploadFile = File(...),
    message: str = Form(...),
    teacher: str = Form("Anil Deshmukh"),
    thread_id: Optional[str] = Form(None)
):
    """Upload document and chat endpoint - supports PDF, DOCX, and PPTX"""
    logger.info(f"Received request - thread_id: {thread_id}, message: {message}, teacher: {teacher}")
    logger.info(f"File received: {file.filename}")
    
    # Generate thread_id if not provided
    if thread_id is None:
        thread_id = str(uuid.uuid4())
        logger.info(f"Generated new thread_id: {thread_id}")

    temp_file_path = None
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.docx', '.pptx']
        file_extension = os.path.splitext(file.filename.lower())[1]
        
        if file_extension not in allowed_extensions:
            return JSONResponse(
                {"status": "error", "detail": "Only PDF, DOCX, and PPTX files are supported"},
                status_code=400
            )

        # Save uploaded file
        content = await file.read()
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
        temp_file.write(content)
        temp_file.close()
        temp_file_path = temp_file.name

        uploaded_files[thread_id] = temp_file_path

        # Build state for chat with document
        state = {
            "messages": [HumanMessage(content=message)],
            "teacher": teacher,
            "pdf_path": temp_file_path,
            "user_id": thread_id
        }

        # Execute graph directly
        result = await agent.ainvoke(state, config={"configurable": {"thread_id": thread_id}})
        print("got the info: ", result)
        if result:
            points = result['messages'][-1].content
            return JSONResponse({
                "status": "success",
                "thread_id": thread_id,
                "filename": file.filename,
                "response": points
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
                uploaded_files.pop(thread_id, None)
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {e}")

@app.post("/flashcards")
async def flashcard_generation(
    file: Optional[UploadFile] = None,
    message: str = Form("Generate flashcards from the following content"),  # Use Form
    teacher: str = Form("Anil Deshmukh"),  # Use Form
    thread_id: Optional[str] = Form(None)  # Use Form
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
            print(result)
            result = result['result']
            flashcards = []
            quiz = []
            for i in range(1, 11):
                question_key = f"question_{i}"
                answer_key = f"answer_{i}"
                
                if result['flashcards'][question_key]:
                    flashcards.append({
                        "question": result['flashcards'][question_key],
                        "answer": result['flashcards'][answer_key]
                    })
                if result['quiz'][question_key]:
                    quiz.append({
                        "question": result['quiz'][question_key],
                        "options": result['quiz'][f"options_{i}"],
                        "answer": result['quiz'][answer_key]
                    })

            if not flashcards:
                return JSONResponse(
                    {"status": "error", "detail": "No flashcards were generated"},
                    status_code=500
                )

            return JSONResponse({
                "status": "success",
                "flashcards": flashcards,
                'quiz': quiz,
                'summary': result['summarize'],
                "important": result['important'],
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

@app.post("/video-desc")
async def video_desc(
    file: UploadFile = File(...),
    message: str = Form(...),
    teacher: str = Form("Anil Deshmukh"),
    thread_id: Optional[str] = Form(None)
):
    """Upload document and chat endpoint - supports PDF, DOCX, and PPTX"""
    logger.info(f"File received: {file.filename}")
    
    # Generate thread_id if not provided
    if thread_id is None:
        thread_id = str(uuid.uuid4())
        logger.info(f"Generated new thread_id: {thread_id}")

    temp_file_path = None
    try:
        # Validate file type
        allowed_extensions = ['.pdf', '.docx', '.pptx']
        file_extension = os.path.splitext(file.filename.lower())[1]
        
        if file_extension not in allowed_extensions:
            return JSONResponse(
                {"status": "error", "detail": "Only PDF, DOCX, and PPTX files are supported"},
                status_code=400
            )

        # Save uploaded file
        content = await file.read()
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
        temp_file.write(content)
        temp_file.close()
        temp_file_path = temp_file.name

        uploaded_files[thread_id] = temp_file_path

        # Build state for chat with document
        state = {
            "messages": [HumanMessage(content=message)],
            "pdf_path": temp_file_path,
        }

        # Execute graph directly
        result = await graph_imp.ainvoke(state, config={"configurable": {"thread_id": thread_id}})
        
        if result['result']:
            response_content = result['result']['points']
            return JSONResponse({
                "status": "success",
                "thread_id": thread_id,
                "filename": file.filename,
                "result": response_content
            })
        else:
            raise ValueError("Invalid response format from graph")

    except Exception as e:
        logger.error(f"Error in videp endpoint: {e}")
        return JSONResponse(
            {"status": "error", "detail": str(e)},
            status_code=500
        )
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                uploaded_files.pop(thread_id, None)
            except Exception as e:
                logger.error(f"Error cleaning up temp file: {e}")

                
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
    uvicorn.run(app, host="0.0.0.0", port=8080)