import React, { useState, useEffect } from 'react';
import {
  Youtube, Loader2, CheckCircle, AlertCircle, 
  Clock, User, Copy, Download, Sparkles, Zap, 
  BarChart3, FileText, Star, Play, Video, Brain, Shield
} from 'lucide-react';

// Mock toast for demo
const toast = {
  success: (msg) => console.log('Success:', msg),
  error: (msg) => console.log('Error:', msg)
};

// Mock user context for this demo
const useUser = () => ({
  mongoUid: 'demo-user',
  firebaseUid: 'demo-user'
});

const YTTranscribe = ({ preloadedData, isPreloaded = false }) => {
  const { mongoUid, firebaseUid } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(preloadedData || null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('brief');

  const TABS = [
    { key: 'brief', label: 'Brief', Icon: Zap },
    { key: 'detailed', label: 'Detailed', Icon: FileText },
    { key: 'bulletPoints', label: 'Bullet Points', Icon: BarChart3 }
  ];

  // Mock data for demo
  const mockResult = {
    video: {
      title: "How AI is Transforming Education",
      channel: "TechEd Channel",
      duration: "15:30",
      url: "https://youtube.com/watch?v=demo",
      id: "demo123"
    },
    summaries: {
      brief: {
        content: "This video explores how artificial intelligence is revolutionizing education through personalized learning, automated grading, and intelligent tutoring systems. Key benefits include improved student engagement and more efficient resource allocation.",
        generatedAt: new Date().toISOString()
      },
      detailed: {
        content: "## AI in Education: A Comprehensive Overview\n\nThis video provides an in-depth analysis of artificial intelligence applications in modern education.\n\n### Key Topics Covered:\n\n**Personalized Learning Platforms**\n- Adaptive learning algorithms that adjust to individual student pace\n- Real-time assessment and feedback mechanisms\n- Customized learning paths based on student performance\n\n**Automated Administrative Tasks**\n- Intelligent grading systems for objective assessments\n- Automated scheduling and resource management\n- Student performance analytics and reporting\n\n**Intelligent Tutoring Systems**\n- 24/7 availability for student support\n- Natural language processing for question understanding\n- Immediate feedback and explanation generation\n\n### Benefits Discussed:\n- Increased student engagement through gamification\n- More efficient use of teacher time\n- Data-driven insights for curriculum improvement\n- Accessibility improvements for students with disabilities\n\n### Challenges and Considerations:\n- Privacy and data security concerns\n- Need for teacher training and adaptation\n- Ensuring equitable access to AI-powered tools\n- Maintaining human connection in education",
        generatedAt: new Date().toISOString()
      },
      bulletPoints: {
        content: "• **AI-Powered Personalization**: Adaptive learning systems adjust content difficulty and pacing based on individual student performance\n\n• **Automated Grading**: AI systems can grade objective assessments instantly, freeing up teacher time for more meaningful interactions\n\n• **Intelligent Tutoring**: 24/7 virtual tutors provide immediate help and explanations to students\n\n• **Predictive Analytics**: AI analyzes student data to identify those at risk of falling behind\n\n• **Natural Language Processing**: AI can understand and respond to student questions in natural language\n\n• **Content Generation**: AI helps create personalized learning materials and practice problems\n\n• **Accessibility Features**: AI-powered tools make education more accessible for students with disabilities\n\n• **Administrative Efficiency**: Automated scheduling, resource allocation, and reporting save time and reduce errors\n\n• **Real-time Feedback**: Students receive immediate feedback on their work, accelerating the learning process\n\n• **Data-Driven Insights**: Teachers gain valuable insights into student learning patterns and curriculum effectiveness",
        generatedAt: new Date().toISOString()
      }
    }
  };

  useEffect(() => {
    if (preloadedData) {
      setResult(preloadedData);
      setActiveTab('brief');
    }
  }, [preloadedData]);

  const validateYouTubeUrl = (url) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return regex.test(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(url)) {
      toast.error('Please enter a valid YouTube URL');
      return;
    }

    if (!firebaseUid || !mongoUid) {
      toast.error('Please log in to use this feature');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    // Simulate API call with mock data
    setTimeout(() => {
      setResult(mockResult);
      toast.success('Video summarized and saved successfully!');
      setActiveTab('brief');
      setLoading(false);
    }, 3000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadSummary = (summaryType) => {
    if (!result) return;
    
    const summaryData = result.summaries[summaryType];
    const content = `YouTube Video Summary - ${summaryType.charAt(0).toUpperCase() + summaryType.slice(1)}

Title: ${result.video.title}
Channel: ${result.video.channel}
Duration: ${result.video.duration}
URL: ${result.video.url}

Summary:
${summaryData.content}

Generated on: ${new Date(summaryData.generatedAt).toLocaleString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `youtube-summary-${summaryType}-${result.video.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    toast.success('Summary downloaded!');
  };

  const downloadAllSummaries = () => {
    if (!result) return;
    
    const content = `YouTube Video - All Summaries

Title: ${result.video.title}
Channel: ${result.video.channel}
Duration: ${result.video.duration}
URL: ${result.video.url}

=== BRIEF SUMMARY ===
${result.summaries.brief.content}

=== DETAILED SUMMARY ===
${result.summaries.detailed.content}

=== BULLET POINTS SUMMARY ===
${result.summaries.bulletPoints.content}

Generated on: ${new Date().toLocaleString()}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `youtube-all-summaries-${result.video.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    toast.success('All summaries downloaded!');
  };

  const renderTabContent = () => {
    const activeSummary = result?.summaries?.[activeTab];
    
    if (!activeSummary) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Summary not available</p>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-bold text-white capitalize flex items-center space-x-2">
            <div className="bg-teal-400/20 p-2 rounded-lg">
              {(() => {
                const TabIcon = TABS.find(tab => tab.key === activeTab)?.Icon;
                return TabIcon ? <TabIcon className="w-5 h-5 text-teal-400" /> : null;
              })()}
            </div>
            <span>{activeTab === 'bulletPoints' ? 'Bullet Points' : activeTab} Summary</span>
          </h4>
          <div className="flex space-x-3">
            <button
              onClick={() => copyToClipboard(activeSummary.content)}
              className="bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600 text-white p-3 rounded-xl transition-all flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">Copy</span>
            </button>
            <button
              onClick={() => downloadSummary(activeTab)}
              className="bg-teal-400/20 hover:bg-teal-400/30 border border-teal-400/30 text-teal-400 p-3 rounded-xl transition-all flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-600/50">
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {activeSummary.content}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Generated on {new Date(activeSummary.generatedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-teal-400" />
            <span>Powered by PadhAI AI</span>
          </div>
        </div>
      </>
    );
  };

  // Don't show the input form if data is preloaded
  if (isPreloaded && result) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-400">
              Video Summaries
            </span>
          </h2>
          <p className="text-gray-400">AI-generated summaries in multiple formats</p>
        </div>

        {/* Results Display */}
        {result && (
          <div className="space-y-8">
            {/* Video Info Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 p-3 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Video Processed</h2>
                    <p className="text-gray-400">All 3 summary types generated successfully</p>
                  </div>
                </div>
                <button
                  onClick={downloadAllSummaries}
                  className="bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-black px-6 py-3 rounded-xl transition-all flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4" />
                  <span>Download All</span>
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-teal-400" />
                    <span className="text-gray-400 text-sm">Title</span>
                  </div>
                  <p className="text-white font-medium">{result.video?.title || 'Sample YouTube Video'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-teal-400" />
                    <span className="text-gray-400 text-sm">Channel</span>
                  </div>
                  <p className="text-white font-medium">{result.video?.channel || 'Sample Channel'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <span className="text-gray-400 text-sm">Duration</span>
                  </div>
                  <p className="text-white font-medium">{result.video?.duration || '10:30'}</p>
                </div>
              </div>

              <a
                href={result.video?.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-teal-400 hover:text-teal-300 transition-colors font-medium"
              >
                <Youtube className="w-4 h-4" />
                <span>Watch on YouTube</span>
              </a>
            </div>

            {/* Summary Tabs */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 p-3 rounded-xl">
                    <Sparkles className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Summaries</h3>
                    <p className="text-gray-400 text-sm">Three different summary formats</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-teal-400/10 px-3 py-2 rounded-lg border border-teal-400/20">
                  <Star className="w-4 h-4 text-teal-400" />
                  <span className="text-teal-400 text-sm font-medium">AI Generated</span>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-2 mb-6 bg-black/30 rounded-xl p-2">
                {TABS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      activeTab === key 
                        ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-black shadow-lg transform scale-105' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-teal-400 to-teal-600 p-6 rounded-3xl shadow-2xl">
              <Youtube className="w-16 h-16 text-black" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-teal-400">
              YouTube
            </span>{' '}
            <span className="text-white">Transcriber</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Transform any YouTube video into 3 different types of intelligent summaries with AI. 
            Get brief, detailed, and bullet-point summaries all at once.
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-lg font-semibold text-white mb-3">
                <Video className="w-5 h-5 text-teal-400" />
                <span>YouTube Video URL</span>
              </label>
              <div className="relative">
                <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 text-teal-400 w-6 h-6" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-14 pr-4 py-5 bg-black/50 border-2 border-gray-700 focus:border-teal-400 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-teal-400/20 transition-all duration-300 text-lg"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 text-black py-5 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:shadow-2xl disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Generating All Summaries...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span>Generate All Summary Types</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="bg-red-500/20 p-2 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-red-300 font-semibold mb-1">Error Occurred</h3>
                <p className="text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-8">
            {/* Video Info Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 border border-gray-700 shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 p-3 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Video Processed</h2>
                    <p className="text-gray-400">All 3 summary types generated successfully</p>
                  </div>
                </div>
                <button
                  onClick={downloadAllSummaries}
                  className="bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-black px-6 py-3 rounded-xl transition-all flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl"
                >
                  <Download className="w-4 h-4" />
                  <span>Download All</span>
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Play className="w-4 h-4 text-teal-400" />
                    <span className="text-gray-400 text-sm">Title</span>
                  </div>
                  <p className="text-white font-medium">{result.video.title}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-teal-400" />
                    <span className="text-gray-400 text-sm">Channel</span>
                  </div>
                  <p className="text-white font-medium">{result.video.channel}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <span className="text-gray-400 text-sm">Duration</span>
                  </div>
                  <p className="text-white font-medium">{result.video.duration}</p>
                </div>
              </div>

              <a
                href={result.video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-teal-400 hover:text-teal-300 transition-colors font-medium"
              >
                <Youtube className="w-4 h-4" />
                <span>Watch on YouTube</span>
              </a>
            </div>

            {/* Summary Tabs */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-teal-400 to-teal-600 p-3 rounded-xl">
                    <Sparkles className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">AI Summaries</h3>
                    <p className="text-gray-400 text-sm">Three different summary formats</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-teal-400/10 px-3 py-2 rounded-lg border border-teal-400/20">
                  <Star className="w-4 h-4 text-teal-400" />
                  <span className="text-teal-400 text-sm font-medium">AI Generated</span>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-2 mb-6 bg-black/30 rounded-xl p-2">
                {TABS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-4 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      activeTab === key 
                        ? 'bg-gradient-to-r from-teal-400 to-teal-600 text-black shadow-lg transform scale-105' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!result && !loading && (
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Triple Summary',
                description: 'Get brief, detailed, and bullet-point summaries all at once',
                gradient: 'from-teal-400 to-teal-600'
              },
              {
                icon: Brain,
                title: 'AI Powered',
                description: 'Powered by advanced AI for accurate and intelligent analysis',
                gradient: 'from-teal-400 to-teal-600'
              },
              {
                icon: Shield,
                title: 'Export Options',
                description: 'Download individual summaries or all three formats together',
                gradient: 'from-teal-400 to-teal-600'
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 text-center hover:border-teal-400/30 transition-all duration-300 group hover:transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <div className={`bg-gradient-to-r ${feature.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-teal-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading Animation */}
        {loading && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 border border-gray-700 text-center shadow-2xl">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-600 rounded-full animate-spin"></div>
                <div className="w-20 h-20 border-4 border-teal-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Processing Video</h3>
                <p className="text-gray-400">Generating comprehensive AI summaries...</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YTTranscribe;