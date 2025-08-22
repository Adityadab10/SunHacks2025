import React, { useState } from "react";
import { sendChatMessage, generateThreadId } from "../services/apiService";

const ChatExample = () => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId] = useState(() => generateThreadId());

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const result = await sendChatMessage(message, "Anil Deshmukh", threadId);
      setResponse(result.response);
      console.log("Chat response:", result);
    } catch (error) {
      console.error("Chat error:", error);
      setResponse("Error: Failed to get response from server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">
        Chat with AI Teacher
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Message:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask me anything about your studies..."
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            rows={3}
          />
        </div>

        <button
          onClick={handleSendMessage}
          disabled={loading || !message.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>

        {response && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Response:
            </label>
            <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
              <p className="text-gray-300 whitespace-pre-wrap">{response}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatExample;
