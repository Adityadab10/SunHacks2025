import React, { useState } from "react";
import toast from "react-hot-toast";

const YouTubeTest = () => {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error("Please enter a YouTube URL");
      return;
    }

    // Basic YouTube URL validation
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(url)) {
      toast.error("Please enter a valid YouTube URL");
      return;
    }

    setLoading(true);
    setSummary("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/youtube/summarize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to summarize video");
      }

      setSummary(data.summary);
      toast.success("Video summarized successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to summarize video");
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setUrl("");
    setSummary("");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            YouTube Video Summarizer
          </h1>

          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  YouTube URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Summarizing...
                    </div>
                  ) : (
                    "Summarize Video"
                  )}
                </button>

                <button
                  type="button"
                  onClick={clearResults}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200"
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>

          {summary && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-400">
                Summary
              </h2>
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {summary}
                </div>
              </div>
            </div>
          )}

          {/* Example URLs for testing */}
          <div className="mt-8 bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">
              Example URLs for Testing:
            </h3>
            <div className="space-y-2">
              <button
                onClick={() =>
                  setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
                }
                className="block w-full text-left px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-blue-400 hover:text-blue-300 transition-colors duration-200"
                disabled={loading}
              >
                https://www.youtube.com/watch?v=dQw4w9WgXcQ
              </button>
              <button
                onClick={() => setUrl("https://youtu.be/dQw4w9WgXcQ")}
                className="block w-full text-left px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-blue-400 hover:text-blue-300 transition-colors duration-200"
                disabled={loading}
              >
                https://youtu.be/dQw4w9WgXcQ
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Click on any example URL to populate the input field, then click
              "Summarize Video" to test the API.
            </p>
          </div>

          {/* API Information */}
          <div className="mt-8 bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">
              API Information:
            </h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>
                <strong>Endpoint:</strong> POST /api/youtube/summarize
              </p>
              <p>
                <strong>Backend URL:</strong> http://localhost:5000
              </p>
              <p>
                <strong>Expected Response:</strong> JSON with summary field
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeTest;
