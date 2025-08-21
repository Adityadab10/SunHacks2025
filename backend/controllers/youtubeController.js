import { GoogleGenerativeAI } from "@google/generative-ai";
import ytdl from "ytdl-core";
import { YoutubeTranscript } from "youtube-transcript";

// Initialize Gemini AI client (will be done in the function)
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

// Helper function to get video metadata
const getVideoMetadata = async (videoId) => {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);

    return {
      title: info.videoDetails.title || "YouTube Video",
      duration: info.videoDetails.lengthSeconds
        ? Math.floor(info.videoDetails.lengthSeconds / 60) +
          ":" +
          (info.videoDetails.lengthSeconds % 60).toString().padStart(2, "0")
        : "Unknown",
      channel: info.videoDetails.author?.name || "Unknown Channel",
    };
  } catch (error) {
    console.error("Error fetching video metadata:", error.message);
    // Return default metadata instead of throwing
    return {
      title: "YouTube Video",
      duration: "Unknown",
      channel: "Unknown Channel",
    };
  }
};

// Controller function to summarize YouTube video
export const summarizeVideo = async (req, res) => {
  try {
    // Initialize Gemini AI client here to ensure dotenv is loaded
    if (!genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "GEMINI_API_KEY environment variable is not set",
        });
      }
      console.log(
        "API Key loaded:",
        apiKey ? `${apiKey.substring(0, 10)}...` : "Not found"
      );
      genAI = new GoogleGenerativeAI(apiKey);
    }

    const { url, youtubeUrl, summaryType = "detailed" } = req.body;

    // Accept either 'url' or 'youtubeUrl' parameter
    const videoUrl = url || youtubeUrl;

    // Validate YouTube URL
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

    // Get video transcript first (this is the most important part)
    let transcript;
    try {
      transcript = await getVideoTranscript(videoId);
    } catch (error) {
      console.error("Transcript error:", error);
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Try to get video metadata (optional, fallback if fails)
    let metadata = { title: "YouTube Video", duration: "Unknown" };
    try {
      metadata = await getVideoMetadata(videoId);
    } catch (error) {
      console.warn("Could not fetch metadata, using defaults:", error.message);
    }

    // Prepare prompt based on summary type
    let prompt = "";
    switch (summaryType) {
      case "brief":
        prompt = `Please provide a brief summary (2-3 sentences) of this YouTube video:

Title: ${metadata.title}
Channel: ${metadata.channel}

Transcript:
${transcript}

Summary:`;
        break;
      case "detailed":
        prompt = `Please provide a detailed summary of this YouTube video including key points, main topics discussed, and important takeaways:

Title: ${metadata.title}
Channel: ${metadata.channel}
Duration: ${metadata.duration}

Transcript:
${transcript}

Detailed Summary:`;
        break;
      case "bullet-points":
        prompt = `Please provide a summary of this YouTube video in bullet point format, highlighting the main topics and key insights:

Title: ${metadata.title}
Channel: ${metadata.channel}

Transcript:
${transcript}

Summary (Bullet Points):`;
        break;
      default:
        prompt = `Please provide a comprehensive summary of this YouTube video:

Title: ${metadata.title}
Channel: ${metadata.channel}

Transcript:
${transcript}

Summary:`;
    }

    // Generate summary using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    // Return the response
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
        summary: {
          type: summaryType,
          content: summary,
          generatedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error summarizing video:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to summarize video",
    });
  }
};

// Controller function to get video transcript only
export const getTranscript = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
      });
    }

    const videoId = getVideoId(youtubeUrl);
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
          author: metadata.author,
          url: youtubeUrl,
        },
        transcript: transcript,
      },
    });
  } catch (error) {
    console.error("Error fetching transcript:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch transcript",
    });
  }
};
