import React, { useState, useRef } from 'react';
import { 
  Send, Upload, MessageCircle, FileText, User, Hash, Loader2, 
  CheckCircle, AlertCircle 
} from 'lucide-react';
import { Button, Upload as AntUpload, Spin, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const API_BASE = "http://localhost:8000";

// Custom Cards icon since it doesn't exist in lucide-react
const Cards = ({ size = 20, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="2" y1="10" x2="22" y2="10"></line>
    <line x1="2" y1="14" x2="22" y2="14"></line>
    <line x1="6" y1="18" x2="6" y2="18"></line>
    <line x1="10" y1="18" x2="10" y2="18"></line>
  </svg>
);

export default function TeacherAgentApp() {
  const [activeTab, setActiveTab] = useState('teacher');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Teacher Agent & Flashcards</h1>
          <p className="text-gray-600">Test chat functionality and generate flashcards from documents</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow p-1 flex">
            <button
              onClick={() => setActiveTab('teacher')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'teacher'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Teacher Agent
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'flashcards'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Flashcards
            </button>
          </div>
        </div>
        
        {/* Content */}
        {activeTab === 'teacher' ? <TeacherAgentTestPage /> : <FlashCards />}
      </div>
    </div>
  );
}

function TeacherAgentTestPage() {
  const [teacher, setTeacher] = useState("Anil Deshmukh");
  const [userMessage, setUserMessage] = useState("");
  const [threadId, setThreadId] = useState("default");
  const [loading, setLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfResponse, setPdfResponse] = useState("");
  const [notification, setNotification] = useState(null);
  const fileInputRef = useRef(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle simple text chat without PDF
  async function handleChat() {
    if (!userMessage.trim()) {
      showNotification('warning', 'Please enter a message');
      return;
    }

    setLoading(true);
    setChatResponse("");
    
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
        showNotification('success', 'Response received!');
      } else {
        showNotification('error', data.detail || 'Failed to get response');
        setChatResponse(`Error: ${data.detail || 'Failed to get response'}`);
      }
    } catch (e) {
      showNotification('error', `Network error: ${e.message}`);
      setChatResponse(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Handle PDF upload and chat
  async function handlePdfChat() {
    if (!userMessage.trim()) {
      showNotification('warning', 'Please enter a message');
      return;
    }
    if (!pdfFile) {
      showNotification('warning', 'Please select a PDF file');
      return;
    }

    setLoading(true);
    setPdfResponse("");
    
    try {
      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("message", userMessage);
      formData.append("teacher", teacher);
      formData.append("thread_id", threadId);
      console.log("Uploading PDF...", formData);
      const res = await fetch(`${API_BASE}/upload-and-chat`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.status === "success") {
        setPdfResponse(data.response);
        showNotification('success', `PDF processed: ${data.filename}`);
      } else {
        showNotification('error', data.detail || 'Failed to process PDF');
        setPdfResponse(`Error: ${data.detail || 'Failed to process PDF'}`);
      }
    } catch (e) {
      showNotification('error', `Network error: ${e.message}`);
      setPdfResponse(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showNotification('warning', 'Please select a PDF file');
        e.target.value = '';
        return;
      }
      setPdfFile(file);
      showNotification('success', `Selected: ${file.name}`);
    }
  };

  const clearFile = () => {
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'warning' ? 'bg-yellow-500 text-white' :
          'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle size={20} />}
          {notification.type === 'warning' && <AlertCircle size={20} />}
          {notification.type === 'error' && <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Configuration Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <User className="mr-2" size={20} />
          Configuration
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Teacher
            </label>
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Anil Deshmukh">Anil Deshmukh</option>
              <option value="Kavita Iyer">Kavita Iyer</option>
              <option value="Raghav Sharma">Raghav Sharma</option>
              <option value="Mary Fernandes">Mary Fernandes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Hash className="inline mr-1" size={16} />
              Thread ID
            </label>
            <input
              type="text"
              value={threadId}
              onChange={(e) => setThreadId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter thread ID"
            />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageCircle className="inline mr-1" size={16} />
          Your Message
        </label>
        <textarea
          rows={4}
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Enter your message here..."
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Simple Chat Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Send className="mr-2" size={20} />
            Simple Chat
          </h2>
          
          <button
            onClick={handleChat}
            disabled={loading || !userMessage.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Send Message</span>
              </>
            )}
          </button>

          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-3">Response:</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              {chatResponse ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{chatResponse}</pre>
              ) : (
                <p className="text-gray-500 italic">No response yet. Send a message to get started.</p>
              )}
            </div>
          </div>
        </div>

        {/* PDF Chat Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <FileText className="mr-2" size={20} />
            Chat with PDF
          </h2>
          
          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF Document
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {pdfFile ? (
                  <div className="flex items-center justify-between bg-blue-50 p-3 rounded">
                    <div className="flex items-center space-x-2">
                      <FileText className="text-blue-500" size={20} />
                      <span className="text-sm text-gray-700 truncate">{pdfFile.name}</span>
                    </div>
                    <button
                      onClick={clearFile}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Click to upload PDF
                    </button>
                    <p className="text-xs text-gray-500 mt-1">Only PDF files are supported</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handlePdfChat}
            disabled={loading || !userMessage.trim() || !pdfFile}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing PDF...</span>
              </>
            ) : (
              <>
                <FileText size={20} />
                <span>Process PDF & Chat</span>
              </>
            )}
          </button>

          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-3">PDF Response:</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
              {pdfResponse ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{pdfResponse}</pre>
              ) : (
                <p className="text-gray-500 italic">No response yet. Upload a PDF and send a message.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl flex items-center space-x-4">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <div>
              <p className="font-semibold text-gray-800">Processing your request...</p>
              <p className="text-sm text-gray-600">This may take a few moments</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FlashCards() {
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleFileUpload = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', 'Generate flashcards from this document');

    try {
        const response = await fetch(`${API_BASE}/flashcards`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Failed to generate flashcards');
        }

        if (data.status === 'success' && data.flashcards) {
            setFlashcards(data.flashcards);
            message.success('Flashcards generated successfully!');
        } else {
            throw new Error('No flashcards in response');
        }
    } catch (error) {
        console.error('Upload error:', error);
        message.error(error.message || 'Failed to generate flashcards');
    } finally {
        setLoading(false);
    }
  };

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const handleReset = () => {
    setFlashcards([]);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <Cards size={20} className="mr-2" />
        Flashcards Generator
      </h2>
      
      <div className="mb-6">
        {!flashcards.length ? (
          <AntUpload
            beforeUpload={(file) => {
              handleFileUpload(file);
              return false;
            }}
            accept=".pdf"
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Upload PDF to Generate Flashcards</Button>
          </AntUpload>
        ) : (
          <Button onClick={handleReset}>Generate New Flashcards</Button>
        )}
      </div>

      {loading && (
        <div className="text-center my-8">
          <Spin size="large" />
          <p className="mt-4">Generating flashcards...</p>
        </div>
      )}

      {flashcards.length > 0 && !loading && (
        <div className="space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[200px] flex flex-col justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">
                Card {currentIndex + 1} of {flashcards.length}
              </h2>
              <div className="mb-4">
                <p className="text-lg">{flashcards[currentIndex].question}</p>
                {showAnswer && (
                  <p className="mt-4 text-green-600 font-medium">{flashcards[currentIndex].answer}</p>
                )}
              </div>
              <Button onClick={toggleAnswer} className="mb-4">
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </Button>
            </div>
          </div>

          <div className="flex justify-between">
            <Button onClick={handlePrevious}>Previous</Button>
            <Button onClick={handleNext}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}