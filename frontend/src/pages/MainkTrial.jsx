import React, { useState } from "react";
import { message } from "antd"; // Import Ant Design message component

const API_BASE = "http://localhost:8000";

export default function TeacherAgentTestPage() {
  const [teacher, setTeacher] = useState("Anil Deshmukh");
  const [userMessage, setUserMessage] = useState("");
  const [threadId, setThreadId] = useState("default");
  const [loading, setLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfResponse, setPdfResponse] = useState("");

  // Handle simple text chat without PDF
  async function handleChat() {
    if (!userMessage.trim()) {
      message.warning("Please enter a message");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          teacher,
          thread_id: threadId
        }),
      });

      const data = await res.json();
      if (data.status === "success") {
        setChatResponse(data.response);
        message.success("Response received!");
      } else {
        message.error(data.detail || "Failed to get response");
      }
    } catch (e) {
      message.error(`Error: ${e.message}`);
      setChatResponse(`Error occurred: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Handle PDF upload and chat
  async function handlePdfChat() {
    if (!userMessage.trim()) {
      message.warning("Please enter a message");
      return;
    }
    if (!pdfFile) {
      message.warning("Please select a PDF file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("message", userMessage);
      formData.append("teacher", teacher);
      formData.append("thread_id", threadId);

      const res = await fetch(`${API_BASE}/upload-and-chat`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.status === "success") {
        setPdfResponse(data.response);
        message.success(`PDF processed: ${data.filename}`);
      } else {
        message.error(data.detail || "Failed to process PDF");
      }
    } catch (e) {
      message.error(`Error: ${e.message}`);
      setPdfResponse(`Error occurred: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Teacher Agent Test</h1>

      {/* Teacher Selection */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">
          Select Teacher:
          <select
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            className="ml-2 p-2 border rounded"
          >
            <option>Anil Deshmukh</option>
            <option>Kavita Iyer</option>
            <option>Raghav Sharma</option>
            <option>Mary Fernandes</option>
          </select>
        </label>
      </div>

      {/* Thread ID */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">
          Thread ID:
          <input
            value={threadId}
            onChange={(e) => setThreadId(e.target.value)}
            className="ml-2 p-2 border rounded"
          />
        </label>
      </div>

      {/* Message Input */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">
          Message:
          <textarea
            rows={3}
            className="block w-full p-2 border rounded mt-1"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
          />
        </label>
      </div>

      {/* Simple Chat Section */}
      <div className="mb-8">
        <button
          onClick={handleChat}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          Send Message (No PDF)
        </button>

        <div className="mt-4">
          <h3 className="font-semibold mb-2">Response:</h3>
          <div className="bg-gray-100 p-4 rounded min-h-[100px] whitespace-pre-wrap">
            {chatResponse || "No response yet"}
          </div>
        </div>
      </div>

      {/* PDF Chat Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Chat with PDF</h2>
        
        <div className="mb-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files[0])}
            className="mb-2"
          />
          <button
            onClick={handlePdfChat}
            disabled={loading || !pdfFile}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            Process PDF and Chat
          </button>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold mb-2">PDF Response:</h3>
          <div className="bg-gray-100 p-4 rounded min-h-[100px] whitespace-pre-wrap">
            {pdfResponse || "No response yet"}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded">
            Processing...
          </div>
        </div>
      )}
    </div>
  );
}