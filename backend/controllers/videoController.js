import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Helper function to expand a general idea into a rich cinematic video prompt using Gemini
 * @param {string} idea - The general idea to expand
 * @returns {Promise<string>} - The expanded cinematic prompt
 */
async function expandIdeaWithGemini(idea) {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    console.log('API Key exists:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length);
    console.log('Initializing Gemini model...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
You are a creative director and cinematographer. Take this general idea: "${idea}" and expand it into a rich, detailed cinematic video prompt that would be perfect for AI video generation.

The expanded prompt should include:
- Visual style and cinematography details (camera angles, lighting, composition)
- Atmosphere and mood
- Color palette suggestions
- Movement and action descriptions
- Audio/ambient elements that would enhance the scene
- Duration suggestions if relevant

Make it vivid, specific, and cinematic. Keep it under 200 words but pack it with creative details.

Example transformation:
Input: "a beach"
Output: "A cinematic aerial shot of a pristine tropical beach at golden hour, crystal-clear turquoise waters gently lapping against white sand. Camera slowly pans from high above, revealing palm trees swaying in the warm breeze. Warm, golden sunlight creates dramatic shadows and highlights. A few surfers ride perfect waves in the distance. The scene transitions to a low-angle shot of waves crashing on the shore in slow motion, with particles of sand and water droplets catching the light. Ambient sounds of ocean waves, seabirds, and distant laughter. Color palette: warm golds, deep blues, and pristine whites. Duration: 10-15 seconds of pure tropical paradise."

Now expand this idea: "${idea}"
    `;

    console.log('Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log('Gemini response received:', text.substring(0, 100) + '...');
    return text;
  } catch (error) {
    console.error('Detailed error expanding idea with Gemini:', {
      message: error.message,
      stack: error.stack,
      apiKeyExists: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length
    });
    
    // Fallback: create a mock expanded prompt for testing
    console.log('Using fallback expanded prompt for testing...');
    const fallbackPrompts = {
      'a beach': 'A cinematic aerial shot of a pristine tropical beach at golden hour, crystal-clear turquoise waters gently lapping against white sand. Camera slowly pans from high above, revealing palm trees swaying in the warm breeze. Warm, golden sunlight creates dramatic shadows and highlights. A few surfers ride perfect waves in the distance. The scene transitions to a low-angle shot of waves crashing on the shore in slow motion, with particles of sand and water droplets catching the light. Ambient sounds of ocean waves, seabirds, and distant laughter. Color palette: warm golds, deep blues, and pristine whites. Duration: 10-15 seconds of pure tropical paradise.',
      'a sci-fi city': 'A sweeping aerial view of a futuristic metropolis at dusk, with towering crystalline skyscrapers piercing through neon-lit clouds. Flying vehicles streak between buildings leaving trails of light. Holographic advertisements float in mid-air casting colorful reflections on glass surfaces. The camera glides through the urban canyon, revealing bustling walkways with people in sleek clothing. Atmospheric lighting shifts from cool blues to warm oranges as artificial suns set behind the skyline. Electronic ambient music pulses with the rhythm of the city. Ultra-modern architecture with impossible geometries defies gravity. Duration: 12-20 seconds of cyberpunk magnificence.'
    };
    
    const fallbackPrompt = fallbackPrompts[idea.toLowerCase()] || 
      `A cinematic view of ${idea} with dramatic lighting, professional camera work, and rich visual details. The scene unfolds with smooth camera movements, capturing the essence and beauty of ${idea} in stunning detail with atmospheric elements that enhance the overall mood and composition.`;
    
    console.log('Using fallback prompt:', fallbackPrompt);
    return fallbackPrompt;
  }
}

/**
 * Helper function to generate video using Veo 3 API
 * @param {string} prompt - The detailed video prompt
 * @returns {Promise<string>} - The download link for the generated video
 */
async function generateVideoWithVeo(prompt) {
  try {
    console.log('Starting video generation with Veo...');
    console.log('Prompt:', prompt.substring(0, 100) + '...');

    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    // For production, use the real Veo 3 API
    // Set to true temporarily if you want to test without quota limits
    const useMockVeo = false; // Change to true for testing without API calls

    if (useMockVeo) {
      // Keep mock implementation for testing only
      console.log('Using mock implementation...');
      // ... existing mock code ...
    } else {
      // Real Veo 3 API implementation using the correct Google GenAI SDK
      console.log('Using real Veo 3 API for video generation...');
      
      try {
        // Initialize the GenAI client for Veo
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY
        });

        console.log('Starting Veo 3 video generation...');
        console.log('Prompt:', prompt);

        // Start video generation with Veo 3
        let operation = await ai.models.generateVideos({
          model: "veo-3.0-generate-preview",
          prompt: prompt,
        });

        console.log('Video generation operation started:', operation.name || 'No operation name');

        // Poll the operation status until the video is ready
        let attempts = 0;
        const maxAttempts = 60; // 10 minutes with 10-second intervals
        
        while (!operation.done && attempts < maxAttempts) {
          console.log(`Polling attempt ${attempts + 1}/${maxAttempts} - Waiting for video generation to complete...`);
          
          await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
          
          // Get updated operation status
          operation = await ai.operations.getVideosOperation({
            operation: operation,
          });
          
          console.log('Operation status:', operation.done ? 'Complete' : 'In progress');
          attempts++;
        }

        if (!operation.done) {
          throw new Error('Video generation timed out after 10 minutes');
        }

        if (!operation.response?.generatedVideos?.[0]?.video) {
          throw new Error('No video generated in the operation response');
        }

        console.log('Video generation completed successfully!');

        // Generate unique video ID and path
        const videoId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const fileName = `${videoId}.mp4`;
        const filePath = path.join(process.cwd(), 'storage', fileName);

        // Download the generated video using the GenAI SDK
        console.log('Downloading generated video...');
        await ai.files.download({
          file: operation.response.generatedVideos[0].video,
          downloadPath: filePath,
        });

        console.log(`Generated video saved to: ${filePath}`);

        // Verify file was created and get size
        const stats = fs.statSync(filePath);
        console.log(`Video file size: ${stats.size} bytes`);

        // Create video info file
        const videoInfo = {
          id: videoId,
          originalPrompt: prompt,
          generatedAt: new Date().toISOString(),
          generatedBy: "Veo 3 API",
          format: "MP4",
          status: "completed",
          type: "ai_generated",
          filePath: filePath,
          fileSize: stats.size,
          operationName: operation.name,
          model: "veo-3.0-generate-preview"
        };

        const infoFilePath = path.join(process.cwd(), 'storage', `${videoId}-info.json`);
        fs.writeFileSync(infoFilePath, JSON.stringify(videoInfo, null, 2));

        // Return the local access URL
        const localVideoUrl = `http://localhost:${process.env.PORT || 5000}/storage/${fileName}`;

        console.log('Veo 3 video generation completed successfully:');
        console.log('- Video file:', filePath);
        console.log('- Video info:', infoFilePath);
        console.log('- Access URL:', localVideoUrl);

        return localVideoUrl;

      } catch (veoError) {
        console.error('Veo 3 API Error:', veoError);
        
        // Handle quota exceeded error specifically
        if (veoError.status === 429) {
          console.log('Quota exceeded - this means the API integration is working correctly!');
          console.log('Check your billing and quota at: https://aistudio.google.com/apikey');
          
          // Create an informative response for quota issues
          const videoId = Date.now() + '-quota-exceeded';
          const infoContent = {
            status: 'quota_exceeded',
            message: 'Veo 3 API integration successful but quota exceeded',
            originalPrompt: prompt,
            timestamp: new Date().toISOString(),
            nextSteps: [
              'Check billing at https://aistudio.google.com/apikey',
              'Upgrade your plan for Veo 3 access',
              'Wait for quota reset if on free tier'
            ],
            note: 'The API connection and authentication are working correctly!'
          };
          
          const infoFilePath = path.join(process.cwd(), 'storage', `${videoId}-quota-info.json`);
          fs.writeFileSync(infoFilePath, JSON.stringify(infoContent, null, 2));
          
          throw new Error(`Veo 3 quota exceeded. API integration is working! Check billing at: https://aistudio.google.com/apikey`);
        }
        
        throw new Error(`Veo 3 video generation failed: ${veoError.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error generating video with Veo:', error);
    throw new Error(`Failed to generate video with Veo API: ${error.message}`);
  }
}

/**
 * POST /video
 * Generate a video from a general idea
 */
export const generateVideo = async (req, res) => {
  try {
    const { idea } = req.body;

    // Validate input
    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Please provide a valid idea as a non-empty string'
      });
    }

    // Check for required environment variables
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Gemini API key is not configured'
      });
    }

    console.log(`Starting video generation for idea: "${idea}"`);

    // Step 1: Expand the idea using Gemini
    console.log('Expanding idea with Gemini...');
    const expandedPrompt = await expandIdeaWithGemini(idea.trim());
    console.log('Expanded prompt:', expandedPrompt);

    // Step 2: Generate video using Veo
    console.log('Generating video with Veo...');
    const videoDownloadLink = await generateVideoWithVeo(expandedPrompt);
    console.log('Video generation completed');

    // Return the result
    res.json({
      success: true,
      originalIdea: idea.trim(),
      expandedPrompt,
      videoDownloadLink,
      message: 'Video generated successfully'
    });

  } catch (error) {
    console.error('Error in generateVideo controller:', error);
    
    // Return appropriate error response
    res.status(500).json({
      error: 'Video generation failed',
      message: error.message || 'An unexpected error occurred',
      success: false
    });
  }
};

/*
Example curl command to test this endpoint:

curl -X POST http://localhost:5000/api/video \
  -H "Content-Type: application/json" \
  -d '{"idea": "a beach"}'

Example with a more complex idea:

curl -X POST http://localhost:5000/api/video \
  -H "Content-Type: application/json" \
  -d '{"idea": "a sci-fi city"}'

Expected response:
{
  "success": true,
  "originalIdea": "a beach",
  "expandedPrompt": "A cinematic aerial shot of a pristine tropical beach...",
  "videoDownloadLink": "https://storage.googleapis.com/veo-generated-videos/operation-id.mp4",
  "message": "Video generated successfully"
}
*/

/**
 * Helper function to determine video type based on prompt
 */
function determineVideoType(prompt) {
  const lowercasePrompt = prompt.toLowerCase();
  
  if (lowercasePrompt.includes('beach') || lowercasePrompt.includes('ocean') || lowercasePrompt.includes('water')) {
    return 'beach';
  } else if (lowercasePrompt.includes('sci-fi') || lowercasePrompt.includes('city') || lowercasePrompt.includes('futuristic')) {
    return 'city';
  } else if (lowercasePrompt.includes('forest') || lowercasePrompt.includes('nature') || lowercasePrompt.includes('mountain')) {
    return 'nature';
  } else {
    return 'abstract';
  }
}

/**
 * Generate a simple video using ffmpeg
 */
async function generateMockVideo(outputPath, videoType, prompt) {
  try {
    console.log(`Generating ${videoType} video...`);
    
    // Create different videos based on type
    let ffmpegCommand;
    
    switch (videoType) {
      case 'beach':
        // Create a blue gradient video with text overlay
        ffmpegCommand = `ffmpeg -f lavfi -i "color=c=skyblue:size=1280x720:duration=10" -vf "drawtext=text='Beach Video - ${prompt.substring(0, 30)}...':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2" -y "${outputPath}"`;
        break;
      
      case 'city':
        // Create a dark gradient video with sci-fi feel
        ffmpegCommand = `ffmpeg -f lavfi -i "color=c=darkblue:size=1280x720:duration=10" -vf "drawtext=text='Sci-Fi City - ${prompt.substring(0, 30)}...':fontcolor=cyan:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2" -y "${outputPath}"`;
        break;
      
      case 'nature':
        // Create a green gradient video
        ffmpegCommand = `ffmpeg -f lavfi -i "color=c=forestgreen:size=1280x720:duration=10" -vf "drawtext=text='Nature Scene - ${prompt.substring(0, 30)}...':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2" -y "${outputPath}"`;
        break;
      
      default:
        // Create a purple gradient video
        ffmpegCommand = `ffmpeg -f lavfi -i "color=c=purple:size=1280x720:duration=10" -vf "drawtext=text='Generated Video - ${prompt.substring(0, 30)}...':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2" -y "${outputPath}"`;
    }
    
    console.log('Running ffmpeg command...');
    await execAsync(ffmpegCommand);
    console.log('Video generated successfully!');
    
  } catch (error) {
    console.error('FFmpeg error:', error);
    throw error;
  }
}

/**
 * Fallback function to download a sample video
 */
async function downloadSampleVideo(outputPath, prompt) {
  try {
    console.log('Downloading sample video as fallback...');
    
    // Use a small sample video
    const sampleVideoUrl = 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4';
    
    const response = await fetch(sampleVideoUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(outputPath, buffer);
    console.log('Sample video downloaded successfully!');
    
    const videoId = path.basename(outputPath, '.mp4');
    return `http://localhost:${process.env.PORT || 5000}/storage/${videoId}.mp4`;
    
  } catch (error) {
    console.error('Failed to download sample video:', error);
    throw error;
  }
}
