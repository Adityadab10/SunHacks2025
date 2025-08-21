# YouTube Video Summarization API

This API allows you to summarize YouTube videos using Google's Gemini AI.

## Endpoints

### 1. Summarize Video
**POST** `/api/youtube/summarize`

Summarizes a YouTube video using Gemini AI.

**Request Body:**
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "summaryType": "detailed" // optional: "brief", "detailed", "bullet-points"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "VIDEO_ID",
      "title": "Video Title",
      "author": "Channel Name",
      "duration": "10:30",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID"
    },
    "summary": {
      "type": "detailed",
      "content": "Generated summary content...",
      "generatedAt": "2025-08-21T12:00:00.000Z"
    }
  }
}
```

### 2. Get Transcript
**POST** `/api/youtube/transcript`

Gets the transcript of a YouTube video.

**Request Body:**
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "video": {
      "id": "VIDEO_ID",
      "title": "Video Title",
      "author": "Channel Name",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID"
    },
    "transcript": "Full video transcript..."
  }
}
```

### 3. Health Check
**GET** `/api/youtube/health`

Checks if the YouTube API service is running.

**Response:**
```json
{
  "success": true,
  "message": "YouTube API service is running",
  "timestamp": "2025-08-21T12:00:00.000Z"
}
```

## Summary Types

- **brief**: 2-3 sentence summary
- **detailed**: Comprehensive summary with key points and takeaways
- **bullet-points**: Main topics in bullet point format

## Environment Variables

Make sure to set these environment variables in your `.env` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Add it to your `.env` file

## Error Handling

The API returns appropriate error messages for:
- Invalid YouTube URLs
- Videos without available transcripts
- API key issues
- Network errors

## Example Usage

### Using curl:

```bash
# Summarize a video
curl -X POST http://localhost:5000/api/youtube/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "summaryType": "detailed"
  }'

# Get transcript only
curl -X POST http://localhost:5000/api/youtube/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

### Using JavaScript fetch:

```javascript
// Summarize video
const response = await fetch('/api/youtube/summarize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    summaryType: 'detailed'
  })
});

const data = await response.json();
console.log(data);
```
