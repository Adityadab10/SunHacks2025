# API Integration Guide

This guide explains how to use the Python backend API with the frontend React application.

## Server Configuration

The Python backend server URL is configured through environment variables. Set `VITE_SERVER_URL` in your `.env` file:

```env
# For local development
VITE_SERVER_URL=http://localhost:8080

# For production
VITE_SERVER_URL=https://your-production-server.com
```

The API service will fallback to `http://localhost:8080` if no environment variable is set.

### Available Endpoints

1. **POST `/chat`** - Simple chat with AI teacher
2. **POST `/upload-and-chat`** - Upload document and chat about it
3. **POST `/flashcards`** - Generate flashcards from uploaded content
4. **GET `/health`** - Health check endpoint

## API Service Usage

Import the API service functions in your React components:

```javascript
import {
  sendChatMessage,
  uploadFileAndChat,
  generateFlashcards,
  generateThreadId,
  checkHealth,
} from "../services/apiService";
```

### 1. Simple Chat

```javascript
const handleChat = async () => {
  try {
    const result = await sendChatMessage(
      "Explain photosynthesis",
      "Anil Deshmukh",
      "unique-thread-id"
    );
    console.log(result.response);
  } catch (error) {
    console.error("Chat failed:", error);
  }
};
```

### 2. Upload File and Chat

```javascript
const handleFileUpload = async (file) => {
  try {
    const result = await uploadFileAndChat(
      file,
      "Summarize this document",
      "Anil Deshmukh",
      generateThreadId()
    );
    console.log(result.response);
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

### 3. Generate Flashcards

```javascript
const generateCards = async (file) => {
  try {
    const result = await generateFlashcards(
      file,
      "Generate flashcards from this content",
      "Anil Deshmukh",
      generateThreadId()
    );

    // Access flashcards
    result.flashcards.forEach((card) => {
      console.log("Q:", card.question);
      console.log("A:", card.answer);
    });

    // Access quiz questions
    result.quiz.forEach((q) => {
      console.log("Question:", q.question);
      console.log("Options:", q.options);
      console.log("Answer:", q.answer);
    });

    // Access summary
    console.log("Summary:", result.summary);
  } catch (error) {
    console.error("Flashcard generation failed:", error);
  }
};
```

### 4. Health Check

```javascript
const checkServerHealth = async () => {
  try {
    const result = await checkHealth();
    console.log("Server status:", result.status);
  } catch (error) {
    console.error("Server is down:", error);
  }
};
```

## Supported File Types

The backend supports the following file formats:

- **PDF** (.pdf)
- **Word Documents** (.docx)
- **PowerPoint Presentations** (.pptx)

## Error Handling

All API functions throw errors that should be caught and handled:

```javascript
try {
  const result = await generateFlashcards(file);
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error("Server error:", error.response.data);
  } else if (error.request) {
    // Request was made but no response received
    console.error("Network error:", error.message);
  } else {
    // Something else happened
    console.error("Error:", error.message);
  }
}
```

## Response Formats

### Chat Response

```json
{
  "status": "success",
  "thread_id": "unique-id",
  "response": "AI teacher response text"
}
```

### Upload and Chat Response

```json
{
  "status": "success",
  "thread_id": "unique-id",
  "filename": "document.pdf",
  "response": "AI analysis of the document"
}
```

### Flashcards Response

```json
{
  "status": "success",
  "flashcards": [
    {
      "question": "What is photosynthesis?",
      "answer": "The process by which plants make food using sunlight"
    }
  ],
  "quiz": [
    {
      "question": "What do plants need for photosynthesis?",
      "options": ["Water", "Sunlight", "CO2", "All of the above"],
      "answer": "All of the above"
    }
  ],
  "summary": "Document summary text"
}
```

## Thread Management

Use `generateThreadId()` to create unique conversation threads:

```javascript
const threadId = generateThreadId();
// Use the same threadId for related conversations
```

## Environment Setup

### 1. Configure Environment Variables

Copy the example environment file and configure your server URL:

```bash
cp .env.example .env
```

Edit `.env` and set your server URL:

```env
VITE_SERVER_URL=http://localhost:8080  # For local development
# or
VITE_SERVER_URL=https://your-domain.com  # For production
```

### 2. Start the Python Backend

Make sure your Python backend is running:

```bash
cd python_backend
python main.py
```

### 3. Start the Frontend

The frontend will automatically use the server URL from your environment:

```bash
cd frontend
npm run dev
# or
pnpm dev
```

## Example Components

- **Upload.jsx** - Full document upload and processing interface
- **ChatExample.jsx** - Simple chat interface example

## Troubleshooting

1. **CORS Issues**: The backend is configured to allow all origins in development
2. **File Size Limits**: Large files may timeout (30-second limit set)
3. **Server Connection**: Check if Python backend is running on port 8080
4. **File Types**: Ensure uploaded files are PDF, DOCX, or PPTX format
