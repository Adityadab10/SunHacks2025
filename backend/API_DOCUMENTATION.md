# YouTube Video Summarization API

This API allows you to summarize YouTube videos using Google's Gemini AI with 3 different summary types and stores them in MongoDB.

## Endpoints

### 1. Summarize Video (All Types)

**POST** `/api/youtube/summarize`

Summarizes a YouTube video using Gemini AI, returns all 3 summary types, and saves to database.

**Request Body:**

```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "userId": "user_mongodb_id"
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
      "channel": "Channel Name",
      "duration": "10:30",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID"
    },
    "summaries": {
      "brief": {
        "type": "brief",
        "content": "Brief 2-3 sentence summary...",
        "generatedAt": "2025-01-21T12:00:00.000Z"
      },
      "detailed": {
        "type": "detailed",
        "content": "Detailed comprehensive summary...",
        "generatedAt": "2025-01-21T12:00:00.000Z"
      },
      "bulletPoints": {
        "type": "bullet-points",
        "content": "• Key point 1\n• Key point 2\n• Key point 3...",
        "generatedAt": "2025-01-21T12:00:00.000Z"
      }
    },
    "savedId": "mongodb_record_id",
    "isExisting": false
  }
}
```

### 2. Get User YouTube History

**GET** `/api/youtube/history/:userId`

Gets a user's YouTube video summarization history.

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 5,
    "videos": [
      {
        "id": "mongodb_record_id",
        "videoId": "VIDEO_ID",
        "title": "Video Title",
        "channel": "Channel Name",
        "duration": "10:30",
        "url": "https://www.youtube.com/watch?v=VIDEO_ID",
        "createdAt": "2025-01-21T12:00:00.000Z",
        "updatedAt": "2025-01-21T12:00:00.000Z"
      }
    ]
  }
}
```

### 3. Get Specific YouTube Summary

**GET** `/api/youtube/summary/:id`

Gets a specific YouTube video summary by MongoDB record ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "video": {
      "id": "VIDEO_ID",
      "title": "Video Title",
      "channel": "Channel Name",
      "duration": "10:30",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID"
    },
    "summaries": {
      "brief": {
        "type": "brief",
        "content": "Brief summary...",
        "generatedAt": "2025-01-21T12:00:00.000Z"
      },
      "detailed": {
        "type": "detailed",
        "content": "Detailed summary...",
        "generatedAt": "2025-01-21T12:00:00.000Z"
      },
      "bulletPoints": {
        "type": "bullet-points",
        "content": "• Key points...",
        "generatedAt": "2025-01-21T12:00:00.000Z"
      }
    },
    "savedId": "mongodb_record_id",
    "createdAt": "2025-01-21T12:00:00.000Z",
    "updatedAt": "2025-01-21T12:00:00.000Z"
  }
}
```

### 4. Get Transcript

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

### 5. Health Check

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

## MongoDB Schema

The YouTube schema stores the following fields:

- `userId`: MongoDB ObjectId referencing the user
- `videoId`: YouTube video ID
- `title`: Video title
- `channel`: Channel name  
- `duration`: Video duration
- `url`: Full YouTube URL
- `briefSummary`: Brief summary content
- `detailedSummary`: Detailed summary content (optional)
- `bulletPointsSummary`: Bullet points summary content (optional)
- `createdAt`: Record creation timestamp
- `updatedAt`: Record update timestamp

## Summary Types

All three types are now generated automatically and stored:

- **brief**: 2-3 sentence summary (required)
- **detailed**: Comprehensive summary with key points and takeaways  
- **bulletPoints**: Main topics in bullet point format

## Features

- **Duplicate Prevention**: If a user tries to summarize the same video twice, the existing summary is returned
- **History Tracking**: All summarized videos are stored and can be retrieved later
- **User Association**: Each summary is linked to a specific user
- **Comprehensive Storage**: Stores video metadata along with all summary types

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
    "userId": "user_mongodb_id"
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
// Get all summary types
const response = await fetch("/api/youtube/summarize", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    userId: "user_mongodb_id"
  }),
});

const data = await response.json();
console.log(data.data.summaries.brief.content);
console.log(data.data.summaries.detailed.content);
console.log(data.data.summaries.bulletPoints.content);
```
