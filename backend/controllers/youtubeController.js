import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";
import fetch from "node-fetch";
import Youtube from "../model/youtube.js";

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
    // Return fallback metadata instead of throwing
    return {
      title: "YouTube Video",
      duration: "Unknown",
      channel: "Unknown Channel",
    };
  }
};

// Controller function to summarize YouTube video with all 3 types
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
        "Gemini API Key loaded:",
        apiKey ? `${apiKey.substring(0, 10)}...` : "Not found"
      );
      genAI = new GoogleGenerativeAI(apiKey);
    }

    const { url, youtubeUrl, userId } = req.body;

    // Accept either 'url' or 'youtubeUrl' parameter
    const videoUrl = url || youtubeUrl;

    // Validate required fields
    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
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

    console.log(`Processing video ID: ${videoId} for user: ${userId}`);

    // Check if this video has already been processed by this user
    const existingVideo = await Youtube.findOne({ userId, videoId });
    if (existingVideo) {
      console.log("Video already exists for this user, returning existing data");
      return res.json({
        success: true,
        data: {
          video: {
            id: existingVideo.videoId,
            title: existingVideo.title,
            channel: existingVideo.channel,
            duration: existingVideo.duration,
            url: existingVideo.url,
          },
          summaries: {
            brief: {
              type: "brief",
              content: existingVideo.briefSummary,
              generatedAt: existingVideo.createdAt.toISOString(),
            },
            detailed: {
              type: "detailed",
              content: existingVideo.detailedSummary || existingVideo.briefSummary,
              generatedAt: existingVideo.createdAt.toISOString(),
            },
            bulletPoints: {
              type: "bullet-points",
              content: existingVideo.bulletPointsSummary || existingVideo.briefSummary,
              generatedAt: existingVideo.createdAt.toISOString(),
            }
          },
          savedId: existingVideo._id,
          isExisting: true
        },
      });
    }

    // Get video transcript first (this is the most important part)
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

    // Get video metadata using YouTube Data API
    const metadata = await getVideoMetadata(videoId);
    console.log("Metadata fetched:", metadata);

    // Prepare prompts for all 3 summary types with markdown formatting
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

    // Generate all 3 summaries using Gemini in parallel
    console.log("Generating all summaries with Gemini...");
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });
    
    try {
      const [briefResult, detailedResult, bulletPointsResult] = await Promise.all([
        model.generateContent(prompts.brief),
        model.generateContent(prompts.detailed),
        model.generateContent(prompts.bulletPoints)
      ]);

      const briefSummary = await briefResult.response;
      const detailedSummary = await detailedResult.response;
      const bulletPointsSummary = await bulletPointsResult.response;

      console.log("All summaries generated successfully");

      // Validate that we got responses
      if (!briefSummary.text() || !detailedSummary.text() || !bulletPointsSummary.text()) {
        throw new Error("Failed to generate one or more summaries");
      }

      // Save to MongoDB
      const youtubeRecord = new Youtube({
        userId: userId,
        videoId: videoId,
        title: metadata.title,
        channel: metadata.channel,
        duration: metadata.duration,
        url: videoUrl,
        briefSummary: briefSummary.text().trim(),
        detailedSummary: detailedSummary.text().trim(),
        bulletPointsSummary: bulletPointsSummary.text().trim()
      });

      const savedRecord = await youtubeRecord.save();
      console.log("Video data saved to database with ID:", savedRecord._id);

      // Return the response with all 3 summary types
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
          savedId: savedRecord._id,
          isExisting: false
        },
      });
    } catch (aiError) {
      console.error("AI Generation error:", aiError);
      throw new Error(`Failed to generate summaries: ${aiError.message}`);
    }
  } catch (error) {
    console.error("Error summarizing video:", error);
    
    // Provide more specific error messages
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
          channel: metadata.channel,
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

// Add new controller function to get user's YouTube history
export const getUserYoutubeHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const youtubeHistory = await Youtube.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        count: youtubeHistory.length,
        videos: youtubeHistory.map(video => ({
          id: video._id,
          videoId: video.videoId,
          title: video.title,
          channel: video.channel,
          duration: video.duration,
          url: video.url,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error("Error fetching YouTube history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch YouTube history",
    });
  }
};

// Add controller function to get specific YouTube video summary
export const getYoutubeSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const youtubeRecord = await Youtube.findById(id);

    if (!youtubeRecord) {
      return res.status(404).json({
        success: false,
        error: "YouTube video summary not found",
      });
    }

    res.json({
      success: true,
      data: {
        video: {
          id: youtubeRecord.videoId,
          title: youtubeRecord.title,
          channel: youtubeRecord.channel,
          duration: youtubeRecord.duration,
          url: youtubeRecord.url,
        },
        summaries: {
          brief: {
            type: "brief",
            content: youtubeRecord.briefSummary,
            generatedAt: youtubeRecord.createdAt.toISOString(),
          },
          detailed: {
            type: "detailed",
            content: youtubeRecord.detailedSummary || youtubeRecord.briefSummary,
            generatedAt: youtubeRecord.createdAt.toISOString(),
          },
          bulletPoints: {
            type: "bullet-points",
            content: youtubeRecord.bulletPointsSummary || youtubeRecord.briefSummary,
            generatedAt: youtubeRecord.createdAt.toISOString(),
          }
        },
        savedId: youtubeRecord._id,
        createdAt: youtubeRecord.createdAt,
        updatedAt: youtubeRecord.updatedAt
      },
    });
  } catch (error) {
    console.error("Error fetching YouTube summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch YouTube summary",
    });
  }
};
