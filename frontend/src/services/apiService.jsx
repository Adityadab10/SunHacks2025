import axios from "axios";

// Python backend server URL from environment variables
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8080";

// Utility function to clean up response text from backend
const cleanResponseText = (responseText) => {
  if (!responseText) return "";

  // If it's already clean text without metadata, return as is
  if (
    typeof responseText === "string" &&
    !responseText.includes("content=") &&
    !responseText.includes("additional_kwargs")
  ) {
    return responseText.trim();
  }

  let cleanText = responseText.toString();

  // Handle the specific format: content='...' additional_kwargs={} response_metadata=...
  // Extract everything between content=' and ' before additional_kwargs
  const contentMatch = cleanText.match(/content='(.*?)'\s+additional_kwargs/s);
  if (contentMatch) {
    cleanText = contentMatch[1];
  } else {
    // Fallback: Extract content from content='...' pattern
    const simpleContentMatch = cleanText.match(
      /content='([^']*(?:\\.[^']*)*)'/s
    );
    if (simpleContentMatch) {
      cleanText = simpleContentMatch[1];
    } else {
      // Fallback: Extract content from content="..." pattern
      const contentMatchDouble = cleanText.match(
        /content="([^"]*(?:\\.[^"]*)*)"/s
      );
      if (contentMatchDouble) {
        cleanText = contentMatchDouble[1];
      }
    }
  }

  // Clean up formatting and escaped characters
  cleanText = cleanText
    // Replace escaped newlines with actual newlines
    .replace(/\\n/g, "\n")
    // Replace escaped quotes
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    // Remove remaining metadata patterns if any
    .replace(/additional_kwargs=\{[^}]*\}/g, "")
    .replace(/response_metadata=\{[^}]*\}/g, "")
    .replace(/id='[^']*'/g, "")
    .replace(/usage_metadata=\{[^}]*\}/g, "")
    // Clean up extra whitespace but preserve intentional line breaks
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  return cleanText;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: SERVER_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
  headers: {
    "Content-Type": "application/json",
  },
});

// Simple chat endpoint
export const sendChatMessage = async (
  message,
  teacher = "Anil Deshmukh",
  threadId = "default"
) => {
  try {
    const response = await api.post("/chat", {
      message,
      teacher,
      thread_id: threadId,
    });

    // Clean the response text
    const cleanedResponse = {
      ...response.data,
      response: cleanResponseText(response.data.response),
    };

    return cleanedResponse;
  } catch (error) {
    console.error(
      "Error sending chat message:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Upload file and chat endpoint
export const uploadFileAndChat = async (
  file,
  message,
  teacher = "Anil Deshmukh",
  threadId = null
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("message", message);
    formData.append("teacher", teacher);
    if (threadId) {
      formData.append("thread_id", threadId);
    }

    const response = await api.post("/upload-and-chat", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Clean the response text
    const cleanedResponse = {
      ...response.data,
      response: cleanResponseText(response.data.response),
    };

    return cleanedResponse;
  } catch (error) {
    console.error(
      "Error uploading file and chatting:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Generate flashcards from file or text
export const generateFlashcards = async (
  file = null,
  message = "Generate flashcards from the following content",
  teacher = "Anil Deshmukh",
  threadId = null
) => {
  try {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("message", message);
    formData.append("teacher", teacher);
    if (threadId) {
      formData.append("thread_id", threadId);
    }

    const response = await api.post("/flashcards", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error generating flashcards:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Health check endpoint
export const checkHealth = async () => {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    console.error(
      "Error checking server health:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Utility function to generate a unique thread ID
export const generateThreadId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default api;
