import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";
import fetch from "node-fetch";

// Initialize Gemini AI client
let genAI;

// Helper function to extract video ID from YouTube URL
const getVideoId = (url) => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Helper function to get video transcript
const getVideoTranscript = async (videoId) => {
  try {
    const transcriptArray = await YoutubeTranscript.fetchTranscript(videoId);
    return transcriptArray.map((item) => item.text).join(" ");
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw new Error(
      "Could not fetch video transcript. The video might not have captions available."
    );
  }
};

// Helper function to convert ISO 8601 duration to readable format
const convertDuration = (isoDuration) => {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Helper function to get video metadata using YouTube Data API v3
const getVideoMetadata = async (videoId) => {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY;

    if (!API_KEY) {
      console.warn("YouTube API key not found, using fallback metadata");
      return {
        title: "YouTube Video",
        duration: "Unknown",
        channel: "Unknown Channel",
      };
    }

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        title: item.snippet.title || "YouTube Video",
        channel: item.snippet.channelTitle || "Unknown Channel",
        duration: item.contentDetails.duration
          ? convertDuration(item.contentDetails.duration)
          : "Unknown",
      };
    } else {
      throw new Error("Video not found");
    }
  } catch (error) {
    console.error("Error fetching video metadata:", error.message);
    return {
      title: "YouTube Video",
      duration: "Unknown",
      channel: "Unknown Channel",
    };
  }
};

// Controller function to summarize YouTube video for extension (no DB save)
export const summarizeVideoExtension = async (req, res) => {
  try {
    // Initialize Gemini AI client
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "GEMINI_API_KEY environment variable is not set",
        });
      }
      genAI = new GoogleGenerativeAI(apiKey);
    }

    const { url, youtubeUrl } = req.body;
    const videoUrl = url || youtubeUrl;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
      });
    }

    // Extract video ID
    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Invalid YouTube URL",
      });
    }

    console.log(`Processing video ID for extension: ${videoId}`);

    // Get video transcript
    let transcript;
    try {
      transcript = await getVideoTranscript(videoId);
      console.log(`Transcript fetched: ${transcript.substring(0, 100)}...`);
    } catch (error) {
      console.error("Transcript error:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Get video metadata
    const metadata = await getVideoMetadata(videoId);
    console.log("Metadata fetched:", metadata);

    // Generate simple summary with Gemini
    console.log("Generating simple summary with Gemini for extension...");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const prompt = `Please provide a concise summary of the following YouTube video transcript in 3-4 sentences:

Video Title: ${metadata.title}
Channel: ${metadata.channel}

Transcript:
${transcript.slice(0, 8000)} ${transcript.length > 8000 ? "...(truncated)" : ""}

Summary:`;

    console.log("Calling Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    console.log("Summary generated successfully!");

    // Return simplified response for extension
    res.json({
      success: true,
      summary: summary.trim(),
      title: metadata.title,
      videoId: videoId,
    });
  } catch (error) {
    console.error("Error summarizing video for extension:", error);

    let errorMessage = "Failed to summarize video";
    if (error.message.includes("transcript")) {
      errorMessage =
        "Could not fetch video transcript. The video might not have captions available or may be private.";
    } else if (error.message.includes("GEMINI_API_KEY")) {
      errorMessage = "AI service configuration error. Please check API key.";
    } else if (error.message.includes("Invalid YouTube URL")) {
      errorMessage = "Invalid YouTube URL provided.";
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
};

// Controller function to get video transcript only for extension
export const getTranscriptExtension = async (req, res) => {
  try {
    const { url, youtubeUrl } = req.body;
    const videoUrl = url || youtubeUrl;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
      });
    }

    const videoId = getVideoId(videoUrl);
    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: "Invalid YouTube URL",
      });
    }

    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      getVideoTranscript(videoId),
    ]);

    res.json({
      success: true,
      data: {
        video: {
          id: videoId,
          title: metadata.title,
          channel: metadata.channel,
          duration: metadata.duration,
          url: videoUrl,
        },
        transcript: transcript,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching transcript for extension:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch transcript",
    });
  }
};
//
