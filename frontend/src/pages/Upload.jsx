import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import MainSidebar from "../components/Sidebar";
import {
  uploadFileAndChat,
  generateFlashcards,
  generateThreadId,
} from "../services/apiService";
import { renderFormattedText } from "../utils/textFormatting";
import {
  Loader2,
  AlertCircle,
  BrainCircuit,
  FileText,
  MessageCircle,
  Upload as UploadIcon,
  CheckCircle,
  File,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "../context/UserContext";

const mainVariant = {
  initial: {
    x: 0,
    y: 0,
  },
  animate: {
    x: 20,
    y: -20,
    opacity: 0.9,
  },
};

const secondaryVariant = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
};

const FileUpload = ({ onChange }) => {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (newFiles) => {
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    onChange && onChange(newFiles);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const { getRootProps, isDragActive } = useDropzone({
    multiple: false,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="w-full" {...getRootProps()}>
      <motion.div
        onClick={handleClick}
        whileHover="animate"
        className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          id="file-upload-handle"
          type="file"
          onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
          className="hidden"
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
          <GridPattern />
        </div>
        <div className="flex flex-col items-center justify-center">
          <p className="relative z-20 font-sans font-bold text-white text-base">
            Upload file
          </p>
          <p className="relative z-20 font-sans font-normal text-gray-400 text-base mt-2">
            Drag or drop your files here or click to upload
          </p>
          <div className="relative w-full mt-10 max-w-xl mx-auto">
            {files.length > 0 &&
              files.map((file, idx) => (
                <motion.div
                  key={"file" + idx}
                  layoutId={idx === 0 ? "file-upload" : "file-upload-" + idx}
                  className="relative overflow-hidden z-40 bg-gray-900 flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md shadow-sm border border-gray-700"
                >
                  <div className="flex justify-between w-full items-center gap-4">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="text-base text-white truncate max-w-xs"
                    >
                      {file.name}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm bg-gray-800 text-white"
                    >
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </motion.p>
                  </div>

                  <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-gray-400">
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                      className="px-1 py-0.5 rounded-md bg-gray-800"
                    >
                      {file.type}
                    </motion.p>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      layout
                    >
                      modified{" "}
                      {new Date(file.lastModified).toLocaleDateString()}
                    </motion.p>
                  </div>
                </motion.div>
              ))}
            {!files.length && (
              <motion.div
                layoutId="file-upload"
                variants={mainVariant}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="relative group-hover/file:shadow-2xl z-40 bg-gray-900 border border-gray-700 flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md shadow-[0px_10px_50px_rgba(0,0,0,0.3)]"
              >
                {isDragActive ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-400 flex flex-col items-center"
                  >
                    Drop it
                    <svg
                      className="h-4 w-4 text-gray-400 mt-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </motion.p>
                ) : (
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                )}
              </motion.div>
            )}

            {!files.length && (
              <motion.div
                variants={secondaryVariant}
                className="absolute opacity-0 border border-dashed border-blue-500 inset-0 z-30 bg-transparent flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md"
              ></motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const GridPattern = () => {
  const columns = 41;
  const rows = 11;
  return (
    <div className="flex bg-gray-900 shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col;
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? "bg-black"
                  : "bg-black shadow-[0px_0px_1px_3px_rgba(0,0,0,1)_inset]"
              }`}
            />
          );
        })
      )}
    </div>
  );
};

const FileUploadDemo = () => {
  const { mongoUid, firebaseUid, loading: userLoading } = useUser();
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [processedData, setProcessedData] = useState({
    summary: null,
    flashcards: null,
    quiz: null,
    chat: null,
  });
  const [processingStatus, setProcessingStatus] = useState({
    summary: "pending",
    flashcards: "pending",
    quiz: "pending",
    chat: "pending",
  });
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanations, setShowExplanations] = useState({});
  const [flippedCards, setFlippedCards] = useState({});
  const [chatMessage, setChatMessage] = useState("");
  const [documentInfo, setDocumentInfo] = useState(null);

  const components = [
    {
      id: "summary",
      label: "Document Summary",
      icon: FileText,
      description: "AI-generated summary of the document",
    },
    {
      id: "flashcards",
      label: "Flashcards",
      icon: BrainCircuit,
      description: "Interactive study flashcards",
    },
    {
      id: "quiz",
      label: "Quiz",
      icon: BookOpen,
      description: "Generated quiz questions",
    },
    {
      id: "chat",
      label: "Chat with Document",
      icon: MessageCircle,
      description: "Ask questions about the content",
    },
  ];

  const handleFileUpload = (newFiles) => {
    setFiles(newFiles);
    if (newFiles.length > 0) {
      setDocumentInfo({
        name: newFiles[0].name,
        size: newFiles[0].size,
        type: newFiles[0].type,
        lastModified: newFiles[0].lastModified,
      });
    }
    // Reset processing states when new files are uploaded
    setProcessedData({
      summary: null,
      flashcards: null,
      quiz: null,
      chat: null,
    });
    setProcessingStatus({
      summary: "pending",
      flashcards: "pending",
      quiz: "pending",
      chat: "pending",
    });
    setActiveTab("summary");
    setError(null);
  };

  const processAllTools = async () => {
    if (files.length === 0) {
      toast.error("Please upload a file first.");
      return;
    }

    if (!firebaseUid || !mongoUid) {
      toast.error("Please log in to use this feature");
      return;
    }

    const file = files[0];

    // Validate file type
    const allowedTypes = [".pdf", ".docx", ".pptx"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (!allowedTypes.includes(fileExtension)) {
      toast.error("Please upload only PDF, DOCX, or PPTX files.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStatus({
      summary: "processing",
      flashcards: "pending",
      quiz: "pending",
      chat: "pending",
    });

    try {
      // Step 1: Upload and get summary
      toast.loading("Processing document...", { id: "processing" });

      const threadId = generateThreadId();
      const uploadResult = await uploadFileAndChat(
        file,
        "Please provide a comprehensive summary of this document.",
        "User",
        threadId
      );

      if (uploadResult && uploadResult.response) {
        setProcessedData((prev) => ({
          ...prev,
          summary: uploadResult.response,
          chat: { threadId: threadId },
        }));
        setProcessingStatus((prev) => ({
          ...prev,
          summary: "completed",
          flashcards: "processing",
        }));

        // Step 2: Generate flashcards
        toast.loading("Creating flashcards...", { id: "processing" });

        const flashcardsResult = await generateFlashcards(file, "User");

        if (flashcardsResult && flashcardsResult.flashcards) {
          setProcessedData((prev) => ({
            ...prev,
            flashcards: flashcardsResult.flashcards,
          }));
          setProcessingStatus((prev) => ({
            ...prev,
            flashcards: "completed",
            quiz: "processing",
          }));

          // Step 3: Generate quiz
          toast.loading("Generating quiz...", { id: "processing" });

          const quizResult = await uploadFileAndChat(
            file,
            `Generate exactly 5 multiple choice questions based on this document. Use this exact format:

1. [Question text here]
A) [Option 1]
B) [Option 2] 
C) [Option 3]
D) [Option 4]
Answer: [Letter]
Explanation: [Brief explanation]

2. [Question text here]
A) [Option 1]
B) [Option 2]
C) [Option 3] 
D) [Option 4]
Answer: [Letter]
Explanation: [Brief explanation]

Continue this pattern for all 5 questions.`,
            "User",
            generateThreadId()
          );

          if (quizResult && quizResult.response) {
            console.log("Quiz response received:", quizResult.response);
            // Parse quiz from response
            const quizData = parseQuizFromResponse(quizResult.response);
            console.log("Parsed quiz data:", quizData);
            setProcessedData((prev) => ({
              ...prev,
              quiz: quizData,
            }));
            setProcessingStatus((prev) => ({
              ...prev,
              quiz: "completed",
              chat: "completed",
            }));

            toast.success("All tools ready! 🎉", { id: "processing" });
          } else {
            throw new Error("Failed to generate quiz");
          }
        } else {
          throw new Error("Failed to generate flashcards");
        }
      } else {
        throw new Error("Failed to process document");
      }
    } catch (err) {
      console.error("Error processing file:", err);

      // Handle specific error types
      let errorMessage = "Failed to process the file. Please try again.";

      if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        errorMessage =
          "Processing is taking longer than expected. This may happen with large files or complex documents. Please try with a smaller file or try again later.";
      } else if (err.response?.status === 413) {
        errorMessage = "File is too large. Please try with a smaller file.";
      } else if (err.response?.status === 415) {
        errorMessage =
          "File type not supported. Please upload PDF, DOCX, or PPTX files only.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage, {
        id: "processing",
        duration: 6000, // Show error message longer for timeouts
      });
      setProcessingStatus({
        summary: "error",
        flashcards: "error",
        quiz: "error",
        chat: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to parse quiz from API response
  const parseQuizFromResponse = (response) => {
    try {
      console.log("Parsing quiz response:", response);
      const lines = response.split("\n").filter((line) => line.trim());
      const quiz = [];
      let currentQuestion = null;

      lines.forEach((line) => {
        line = line.trim();

        // Match question patterns: "1.", "Question 1:", "Q1:", etc.
        if (
          line.match(/^\d+[.)]\s*/) ||
          line.match(/^(Question|Q)\s*\d+[:.?]?\s*/i)
        ) {
          // New question
          if (currentQuestion && currentQuestion.question) {
            quiz.push(currentQuestion);
          }

          let questionText = line
            .replace(/^\d+[.)]\s*/, "")
            .replace(/^(Question|Q)\s*\d+[:.?]?\s*/i, "")
            .trim();

          currentQuestion = {
            question: questionText,
            options: [],
            answer: "",
            explanation: "",
          };
        }
        // Match option patterns: "A)", "A.", "a)", "(A)", etc.
        else if (line.match(/^[(\s]*[A-Da-d][).:\s]/)) {
          if (currentQuestion) {
            const optionLetter = line
              .charAt(line.search(/[A-Da-d]/))
              .toUpperCase();
            const optionText = line
              .replace(/^[(\s]*[A-Da-d][).:\s]+/, "")
              .trim();

            if (optionText) {
              currentQuestion.options.push({
                label: optionLetter,
                text: optionText,
                isCorrect: false,
              });
            }
          }
        }
        // Match answer patterns
        else if (
          line.toLowerCase().includes("answer") ||
          line.toLowerCase().includes("correct") ||
          line.toLowerCase().includes("solution")
        ) {
          if (currentQuestion) {
            // Extract the answer letter
            const answerMatch = line.match(/[A-Da-d]/);
            if (answerMatch) {
              const correctLetter = answerMatch[0].toUpperCase();
              currentQuestion.answer = correctLetter;
              // Mark correct option
              currentQuestion.options.forEach((option) => {
                if (option.label === correctLetter) {
                  option.isCorrect = true;
                }
              });
            }
          }
        }
        // Match explanation patterns
        else if (line.toLowerCase().includes("explanation")) {
          if (currentQuestion) {
            currentQuestion.explanation = line
              .replace(/explanation[:.?]?\s*/i, "")
              .trim();
          }
        }
        // If we have a current question but no specific pattern, it might be a continuation
        else if (
          currentQuestion &&
          !currentQuestion.question &&
          line.length > 10
        ) {
          currentQuestion.question = line;
        }
      });

      // Add the last question if it exists
      if (currentQuestion && currentQuestion.question) {
        quiz.push(currentQuestion);
      }

      console.log("Final parsed quiz:", quiz);

      // If parsing failed, create a fallback simple format
      if (quiz.length === 0 && response.length > 50) {
        console.log("Fallback parsing for quiz");
        return [
          {
            question: "Quiz parsing failed - showing raw response",
            options: [
              {
                label: "A",
                text: "Raw response available in console",
                isCorrect: true,
              },
            ],
            answer: "A",
            explanation: "Please check the console for the raw quiz response",
          },
        ];
      }

      return quiz;
    } catch (error) {
      console.error("Error parsing quiz:", error);
      return [];
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
    setShowExplanations((prev) => ({
      ...prev,
      [questionIndex]: true,
    }));
  };

  const toggleCard = (idx) => {
    setFlippedCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleChatWithDocument = async () => {
    if (!chatMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (files.length === 0) {
      toast.error("Please upload a file first.");
      return;
    }

    try {
      const file = files[0];
      const threadId = processedData.chat?.threadId || generateThreadId();
      const result = await uploadFileAndChat(
        file,
        chatMessage,
        "User",
        threadId
      );

      setProcessedData((prev) => ({
        ...prev,
        chat: {
          ...prev.chat,
          responses: [
            ...(prev.chat?.responses || []),
            {
              question: chatMessage,
              answer: result.response,
            },
          ],
        },
      }));

      setChatMessage("");
      toast.success("Response received!");
    } catch (err) {
      console.error("Error chatting with document:", err);

      let errorMessage = "Failed to chat with the document. Please try again.";

      if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
        errorMessage =
          "Request timed out. Please try again or ask a simpler question.";
      } else if (err.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage, { duration: 4000 });
    }
  };

  const resetAll = () => {
    setFiles([]);
    setDocumentInfo(null);
    setProcessedData({
      summary: null,
      flashcards: null,
      quiz: null,
      chat: null,
    });
    setProcessingStatus({
      summary: "pending",
      flashcards: "pending",
      quiz: "pending",
      chat: "pending",
    });
    setError(null);
    setActiveTab("summary");
    setSelectedAnswers({});
    setShowExplanations({});
    setFlippedCards({});
    setChatMessage("");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-600" />;
    }
  };

  // Show loading spinner while user data is being fetched
  if (userLoading) {
    return (
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
        <p className="text-gray-400">Loading user data...</p>
      </div>
    );
  }

  // Show error if user is not properly authenticated
  if (!firebaseUid || !mongoUid) {
    return (
      <div className="text-center max-w-md mx-auto">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-gray-400 mb-4">
          Please log in and ensure your profile is synced to use the document
          tools.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Document
          </span>{" "}
          AI Suite
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
          Upload once, unlock everything. Transform any document into summaries,
          flashcards, quizzes, and interactive chat sessions.
        </p>
      </motion.div>

      {/* Unified File Upload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900 rounded-2xl p-8 border border-gray-800 mb-8"
      >
        <div className="flex items-center justify-center mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-xl">
            <UploadIcon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold ml-4">
            Universal Document Processor
          </h3>
        </div>

        <div className="space-y-6">
          <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-black border-gray-700 rounded-lg">
            <FileUpload onChange={handleFileUpload} />
          </div>

          <div className="flex gap-4">
            <motion.button
              onClick={processAllTools}
              disabled={isProcessing || files.length === 0}
              whileHover={{ scale: isProcessing ? 1 : 1.02 }}
              whileTap={{ scale: isProcessing ? 1 : 0.98 }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Processing All Tools...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-6 h-6" />
                  <span>Generate All Study Tools</span>
                </>
              )}
            </motion.button>

            {(documentInfo || isProcessing) && (
              <motion.button
                type="button"
                onClick={resetAll}
                disabled={isProcessing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-xl font-medium transition-all disabled:cursor-not-allowed"
              >
                Reset
              </motion.button>
            )}
          </div>
        </div>

        {/* Processing Status */}
        {(isProcessing || documentInfo) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-4"
          >
            {documentInfo && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <File className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">
                      {documentInfo.name}
                    </h4>
                    <p className="text-gray-400 text-sm mb-2">
                      {(documentInfo.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                      {documentInfo.type}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Modified{" "}
                      {new Date(documentInfo.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4">
                Processing Status
              </h4>
              {isProcessing && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>Processing in progress...</strong> Large files may
                    take 1-2 minutes to process. Please be patient while we
                    analyze your document and generate study materials.
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {components.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <comp.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{comp.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(processingStatus[comp.id])}
                      <span
                        className={`text-sm capitalize ${
                          processingStatus[comp.id] === "completed"
                            ? "text-green-400"
                            : processingStatus[comp.id] === "processing"
                            ? "text-blue-400"
                            : processingStatus[comp.id] === "error"
                            ? "text-red-400"
                            : "text-gray-500"
                        }`}
                      >
                        {processingStatus[comp.id]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <div className="mt-6 bg-red-900/20 border border-red-500 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-400">{error}</p>
                  {error.includes("timeout") && (
                    <p className="text-red-300 text-sm mt-2">
                      💡 Tip: Try uploading a smaller file or check your
                      internet connection.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={processAllTools}
                disabled={isProcessing}
                className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tool Navigation */}
      {documentInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-center space-x-4">
            {components.map((comp) => {
              const Icon = comp.icon;
              const isCompleted = processingStatus[comp.id] === "completed";
              const isActive = activeTab === comp.id;

              return (
                <motion.button
                  key={comp.id}
                  onClick={() => isCompleted && setActiveTab(comp.id)}
                  disabled={!isCompleted}
                  whileHover={{ scale: isCompleted ? 1.02 : 1 }}
                  whileTap={{ scale: isCompleted ? 0.98 : 1 }}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                    isActive && isCompleted
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 border-transparent text-white shadow-lg"
                      : isCompleted
                      ? "bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800"
                      : "bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed opacity-50"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div
                      className={`p-3 rounded-xl relative ${
                        isActive && isCompleted
                          ? "bg-white/20"
                          : isCompleted
                          ? "bg-gray-800"
                          : "bg-gray-800"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="font-semibold mb-1">{comp.label}</h3>
                      <p
                        className={`text-sm ${
                          isActive && isCompleted
                            ? "text-white/80"
                            : "text-gray-500"
                        }`}
                      >
                        {comp.description}
                      </p>
                    </div>
                  </div>

                  {isActive && isCompleted && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl"
                      style={{ zIndex: -1 }}
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Active Component Content */}
      {documentInfo && processingStatus[activeTab] === "completed" && (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-gray-900 rounded-xl p-6 border border-gray-800"
        >
          <AnimatePresence mode="wait">
            {/* Summary Tab */}
            {activeTab === "summary" && processedData.summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Document Summary</h2>
                </div>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {renderFormattedText(processedData.summary)}
                </div>
              </motion.div>
            )}

            {/* Flashcards Tab */}
            {activeTab === "flashcards" &&
              processedData.flashcards?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-purple-500/20 p-2 rounded-lg">
                      <BrainCircuit className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Flashcards</h2>
                  </div>
                  <div className="space-y-6">
                    {processedData.flashcards.map((card, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleCard(idx)}
                        className={`bg-gray-800 rounded-xl border border-gray-700 p-6 transition-all hover:bg-gray-750 cursor-pointer relative min-h-[150px] ${
                          flippedCards[idx] ? "shadow-lg" : ""
                        }`}
                      >
                        <div
                          className={`transition-all duration-300 ${
                            flippedCards[idx] ? "opacity-0" : "opacity-100"
                          }`}
                        >
                          <h3 className="text-xl font-semibold mb-3 text-white">
                            Question:
                          </h3>
                          <p className="text-gray-200">{card.question}</p>
                        </div>

                        <div
                          className={`absolute inset-0 p-6 transition-all duration-300 rounded-xl ${
                            flippedCards[idx]
                              ? "opacity-100 transform translate-y-0 bg-gray-800 border border-gray-700"
                              : "opacity-0 transform translate-y-4"
                          }`}
                        >
                          <h3 className="text-xl font-semibold mb-3 text-purple-400">
                            Answer:
                          </h3>
                          <p className="text-gray-200">{card.answer}</p>
                        </div>

                        <div className="absolute bottom-4 right-4">
                          <span className="text-sm text-gray-500">
                            {flippedCards[idx]
                              ? "Click to hide answer"
                              : "Click to reveal answer"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            {/* Quiz Tab */}
            {activeTab === "quiz" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-orange-500/20 p-2 rounded-lg">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Quiz Questions</h2>
                </div>

                {processedData.quiz?.length > 0 ? (
                  <div className="space-y-6">
                    {processedData.quiz.map((question, qIndex) => (
                      <div
                        key={qIndex}
                        className="bg-gray-800/50 rounded-lg p-6 border border-gray-700"
                      >
                        <h3 className="text-xl font-semibold text-white mb-4">
                          {qIndex + 1}. {question.question}
                        </h3>
                        <div className="space-y-3">
                          {question.options.map((option, oIndex) => (
                            <button
                              key={oIndex}
                              onClick={() => handleAnswerSelect(qIndex, oIndex)}
                              disabled={showExplanations[qIndex]}
                              className={`w-full text-left p-3 rounded-lg text-white transition-colors ${
                                selectedAnswers[qIndex] === oIndex
                                  ? option.isCorrect
                                    ? "bg-green-500/20 border-green-500/50"
                                    : "bg-red-500/20 border-red-500/50"
                                  : showExplanations[qIndex] && option.isCorrect
                                  ? "bg-green-500/20 border-green-500/50"
                                  : "bg-gray-800 hover:bg-gray-700"
                              } border border-gray-600`}
                            >
                              <span className="font-semibold mr-2">
                                {option.label}.
                              </span>
                              {option.text}
                              {showExplanations[qIndex] && option.isCorrect && (
                                <span className="ml-2 text-green-400">✓</span>
                              )}
                            </button>
                          ))}
                        </div>

                        {showExplanations[qIndex] && (
                          <div
                            className={`mt-4 p-4 rounded-lg ${
                              question.options[selectedAnswers[qIndex]]
                                ?.isCorrect
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-red-500/10 border-red-500/30"
                            } border`}
                          >
                            <p className="text-sm font-semibold mb-2 text-white">
                              Correct Answer: {question.answer}
                            </p>
                            {question.explanation && (
                              <p className="text-sm text-gray-300">
                                {question.explanation}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">
                        No Quiz Available
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Quiz generation might have failed or the response format
                        wasn't recognized.
                      </p>
                      <p className="text-sm text-gray-500">
                        Debug info: Quiz data length:{" "}
                        {processedData.quiz?.length || 0}
                      </p>
                      {import.meta.env.DEV && (
                        <button
                          onClick={() =>
                            console.log("Quiz debug:", processedData.quiz)
                          }
                          className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded"
                        >
                          Log Quiz Data
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && processedData.chat && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold">Chat with Document</h2>
                </div>

                {/* Chat History */}
                {processedData.chat.responses && (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {processedData.chat.responses.map((chat, index) => (
                      <div key={index} className="space-y-3">
                        <div className="bg-blue-600/20 rounded-lg p-3 ml-12">
                          <p className="text-white">{chat.question}</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-3 mr-12">
                          <div className="text-gray-300">
                            {renderFormattedText(chat.answer)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask a question about your document..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && chatMessage.trim()) {
                        handleChatWithDocument();
                      }
                    }}
                  />
                  <button
                    onClick={handleChatWithDocument}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
                    disabled={!chatMessage.trim()}
                  >
                    Ask
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Welcome Message */}
      {!documentInfo && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center py-16"
        >
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Smart Summaries</h3>
              <p className="text-gray-400">
                Get comprehensive AI-generated summaries of your documents
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="bg-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <BrainCircuit className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Interactive Flashcards</h3>
              <p className="text-gray-400">
                Create flippable flashcards for effective studying
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Generated Quizzes</h3>
              <p className="text-gray-400">
                Test your knowledge with auto-generated quiz questions
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
              <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4">Document Chat</h3>
              <p className="text-gray-400">
                Ask questions and get instant answers about your content
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const Upload = () => {
  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <MainSidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Upload Section */}
          <FileUploadDemo />
        </div>
      </div>
    </div>
  );
};

export default Upload;
