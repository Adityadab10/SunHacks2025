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

    // Prepare prompts for all 3 summary types
    const prompts = {
      brief: `Summarize this YouTube video in 2-3 sentences. Do not add any introductory phrases.

Title: ${metadata.title}
Channel: ${metadata.channel}

${transcript}`,

      detailed: `Summarize the transcript into detailed paragraphs with key points and takeaways. Output must start directly with the content. Do not say things like "Here is the summary" or similar.

Title: ${metadata.title}
Channel: ${metadata.channel}
Duration: ${metadata.duration}

${transcript}`,

      bulletPoints: `Summarize the transcript into bullet points only. No introductions, no closing sentences. Output must start directly with bullet points.

Title: ${metadata.title}
Channel: ${metadata.channel}

${transcript}`
    };

    // Generate all 3 summaries using Gemini
    console.log("Generating all summaries with Gemini for extension...");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
    
    const [briefResult, detailedResult, bulletPointsResult] = await Promise.all([
      model.generateContent(prompts.brief),
      model.generateContent(prompts.detailed),
      model.generateContent(prompts.bulletPoints)
    ]);

    const briefSummary = await briefResult.response;
    const detailedSummary = await detailedResult.response;
    const bulletPointsSummary = await bulletPointsResult.response;

    // Validate responses
    if (!briefSummary.text() || !detailedSummary.text() || !bulletPointsSummary.text()) {
      throw new Error("Failed to generate one or more summaries");
    }

    // Return response without saving to database
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
        summaries: {
          brief: {
            type: "brief",
            content: briefSummary.text().trim(),
            generatedAt: new Date().toISOString(),
          },
          detailed: {
            type: "detailed",
            content: detailedSummary.text().trim(),
            generatedAt: new Date().toISOString(),
          },
          bulletPoints: {
            type: "bullet-points",
            content: bulletPointsSummary.text().trim(),
            generatedAt: new Date().toISOString(),
          }
        },
        generatedAt: new Date().toISOString()
      },
    });
  } catch (error) {
    console.error("Error summarizing video for extension:", error);
    
    let errorMessage = "Failed to summarize video";
    if (error.message.includes("transcript")) {
      errorMessage = "Could not fetch video transcript. The video might not have captions available or may be private.";
    } else if (error.message.includes("GEMINI_API_KEY")) {
      errorMessage = "AI service configuration error. Please check API key.";
    } else if (error.message.includes("Invalid YouTube URL")) {
      errorMessage = "Invalid YouTube URL provided.";
    } else if (error.message.includes("generate summaries")) {
      errorMessage = error.message;
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
        generatedAt: new Date().toISOString()
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