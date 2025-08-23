import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Loader2,
  Headphones,
  Music,
  BookOpen,
  RefreshCw,
  CheckCircle,
  Settings,
  SkipForward,    
  SkipBack
} from 'lucide-react';

const StoryMode = ({ studyBoard, documentFile }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyContent, setStoryContent] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1);
  const [error, setError] = useState(null);
  const [speechUtterance, setSpeechUtterance] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [totalWords, setTotalWords] = useState(0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  const speechSynthesis = window.speechSynthesis;

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      console.log('Available voices:', voices.length, voices.map(v => ({ name: v.name, lang: v.lang })));
      
      setAvailableVoices(voices);
      
      // Set default voice (prefer English voices)
      if (voices.length > 0 && !selectedVoice) {
        const englishVoices = voices.filter(voice => 
          voice.lang.startsWith('en') && voice.localService
        );
        const fallbackEnglishVoices = voices.filter(voice => 
          voice.lang.startsWith('en')
        );
        
        let defaultVoice = null;
        if (englishVoices.length > 0) {
          defaultVoice = englishVoices[0];
        } else if (fallbackEnglishVoices.length > 0) {
          defaultVoice = fallbackEnglishVoices[0];
        } else {
          defaultVoice = voices[0];
        }
        
        console.log('Setting default voice:', defaultVoice.name);
        setSelectedVoice(defaultVoice);
      }
    };

    // Load voices immediately if available
    loadVoices();
    
    // Also set up the event listener for when voices are loaded
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Cleanup
    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoice]);

  // Generate story mode content
  const generateStoryMode = async () => {
    if (!documentFile) return;

    setIsGenerating(true);
    setError(null);
    setStoryContent(null);
    setIsReady(false);
    
    try {
      const formData = new FormData();
      formData.append('file', documentFile);

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/story`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Story response:', data);
        
        let content = null;
        if (data.result) {
          content = data.result;
        } else if (data.story) {
          content = data.story;
        } else if (data.content) {
          content = data.content;
        } else if (typeof data === 'string') {
          content = data;
        } else {
          throw new Error('No story content received');
        }
        
        setStoryContent(content);
        prepareAudioFromText(content);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Failed to generate story');
      }
    } catch (error) {
      console.error('Error generating story:', error);
      setError(error.message || 'Failed to generate story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Prepare audio from text
  const prepareAudioFromText = (text) => {
    if (!text) return;
    
    console.log('Preparing audio from text:', text.substring(0, 100) + '...');
    
    // Clean the text for better speech synthesis
    const cleanText = text
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italic
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links, keep text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
      .replace(/\n\n+/g, '. ') // Replace multiple newlines with periods
      .replace(/\n/g, ' ') // Replace single newlines with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    console.log('Cleaned text length:', cleanText.length);
    console.log('Clean text sample:', cleanText.substring(0, 200));

    // Count words for progress tracking
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    setTotalWords(words.length);

    if ('speechSynthesis' in window) {
      // Stop any ongoing speech first
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Configure speech parameters with defaults
      utterance.rate = rate || 0.9;
      utterance.pitch = pitch || 1;
      utterance.volume = isMuted ? 0 : (volume || 1);
      utterance.lang = 'en-US'; // Set default language
      
      // Set voice if available
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Using voice:', selectedVoice.name);
      } else {
        // Try to find a good default voice
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => 
          voice.lang.startsWith('en') && voice.localService
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        
        if (englishVoice) {
          utterance.voice = englishVoice;
          setSelectedVoice(englishVoice);
          console.log('Auto-selected voice:', englishVoice.name);
        }
      }
      
      // Set up event handlers with better logging
      utterance.onstart = () => {
        console.log('Speech started');
        setIsPlaying(true);
        setIsPaused(false);
        setCurrentPosition(0);
        setError(null);
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentPosition(0);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setIsPaused(false);
        setError(`Audio playback failed: ${event.error}. Please try again.`);
      };
      
      utterance.onpause = () => {
        console.log('Speech paused');
        setIsPaused(true);
        setIsPlaying(false);
      };
      
      utterance.onresume = () => {
        console.log('Speech resumed');
        setIsPaused(false);
        setIsPlaying(true);
      };

      // Track progress (approximate)
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const spokenText = cleanText.substring(0, event.charIndex);
          const wordsSpoken = spokenText.split(/\s+/).length;
          setCurrentPosition(wordsSpoken);
        }
      };

      setSpeechUtterance(utterance);
      setIsReady(true);
      console.log('Speech utterance prepared and ready');
    } else {
      setError('Speech synthesis not supported in this browser.');
    }
  };

  // Play/pause speech
  const togglePlayPause = () => {
    console.log('Toggle play/pause clicked. Current state:', { isPlaying, isPaused, isReady });
    
    if (!isReady || !speechUtterance) {
      console.log('Not ready or no utterance');
      setError('Speech not ready. Please wait a moment and try again.');
      return;
    }

    if (!speechSynthesis) {
      console.log('Speech synthesis not available');
      setError('Speech synthesis not available in this browser.');
      return;
    }

    try {
      if (isPlaying && speechSynthesis.speaking) {
        console.log('Pausing speech');
        speechSynthesis.pause();
        setIsPlaying(false);
        setIsPaused(true);
      } else if (isPaused && speechSynthesis.paused) {
        console.log('Resuming speech');
        speechSynthesis.resume();
        setIsPlaying(true);
        setIsPaused(false);
      } else {
        console.log('Starting new speech');
        
        // Cancel any existing speech
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
        }
        
        // Wait a moment for cancellation to complete
        setTimeout(() => {
          // Update utterance settings before playing
          speechUtterance.rate = rate || 0.9;
          speechUtterance.pitch = pitch || 1;
          speechUtterance.volume = isMuted ? 0 : (volume || 1);
          speechUtterance.lang = 'en-US';
          
          // Set voice
          if (selectedVoice) {
            speechUtterance.voice = selectedVoice;
          } else {
            const voices = speechSynthesis.getVoices();
            const englishVoice = voices.find(voice => 
              voice.lang.startsWith('en') && voice.localService
            ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
            
            if (englishVoice) {
              speechUtterance.voice = englishVoice;
              setSelectedVoice(englishVoice);
            }
          }
          
          console.log('Speaking with settings:', {
            rate: speechUtterance.rate,
            pitch: speechUtterance.pitch,
            volume: speechUtterance.volume,
            voice: speechUtterance.voice?.name || 'default'
          });
          
          speechSynthesis.speak(speechUtterance);
        }, 100);
      }
    } catch (error) {
      console.error('Error in togglePlayPause:', error);
      setError('Failed to control audio playback. Please try again.');
    }
  };

  // Stop speech
  const stopSpeech = () => {
    console.log('Stopping speech');
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentPosition(0);
    }
  };

  // Skip forward (restart - Web Speech API limitation)
  const skipForward = () => {
    console.log('Skip forward (restart)');
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setTimeout(() => {
        if (speechUtterance) {
          speechSynthesis.speak(speechUtterance);
        }
      }, 200);
    }
  };

  // Skip backward (restart - Web Speech API limitation)
  const skipBackward = () => {
    console.log('Skip backward (restart)');
    stopSpeech();
    setTimeout(() => {
      if (speechUtterance) {
        speechSynthesis.speak(speechUtterance);
      }
    }, 200);
  };

  // Toggle mute
  const toggleMute = () => {
    console.log('Toggling mute:', !isMuted);
    setIsMuted(!isMuted);
    if (speechUtterance) {
      speechUtterance.volume = !isMuted ? 0 : volume;
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (speechUtterance && !isMuted) {
      speechUtterance.volume = newVolume;
    }
  };

  // Handle rate change
  const handleRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setRate(newRate);
    if (speechUtterance) {
      speechUtterance.rate = newRate;
    }
  };

  // Handle pitch change
  const handlePitchChange = (e) => {
    const newPitch = parseFloat(e.target.value);
    setPitch(newPitch);
    if (speechUtterance) {
      speechUtterance.pitch = newPitch;
    }
  };

  // Handle voice change
  const handleVoiceChange = (e) => {
    const voiceIndex = parseInt(e.target.value);
    if (voiceIndex >= 0 && voiceIndex < availableVoices.length) {
      setSelectedVoice(availableVoices[voiceIndex]);
    }
  };

  // Update speech settings and restart if playing
  const updateSpeechSettings = () => {
    console.log('Updating speech settings');
    if (storyContent) {
      const wasPlaying = isPlaying;
      if (wasPlaying) {
        stopSpeech();
        setTimeout(() => {
          prepareAudioFromText(storyContent);
          setTimeout(() => {
            if (speechUtterance) {
              console.log('Restarting speech with new settings');
              speechSynthesis.speak(speechUtterance);
            }
          }, 200);
        }, 200);
      } else {
        prepareAudioFromText(storyContent);
      }
    }
  };

  // Test speech functionality
  const testSpeech = () => {
    console.log('Testing speech synthesis');
    if ('speechSynthesis' in window) {
      const testUtterance = new SpeechSynthesisUtterance('Hello, this is a test of the speech synthesis.');
      testUtterance.rate = 1;
      testUtterance.pitch = 1;
      testUtterance.volume = 1;
      
      testUtterance.onstart = () => console.log('Test speech started');
      testUtterance.onend = () => console.log('Test speech ended');
      testUtterance.onerror = (e) => console.error('Test speech error:', e);
      
      speechSynthesis.speak(testUtterance);
    } else {
      console.log('Speech synthesis not supported');
    }
  };

  // Calculate progress percentage
  const progressPercentage = totalWords > 0 ? (currentPosition / totalWords) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-6 text-white bg-gradient-to-br from-black via-[#222] to-black border border-[#74AA9C]/30 shadow-xl backdrop-blur-lg"
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-[#74AA9C]/20 p-2 rounded-lg">
          <Headphones className="w-5 h-5 text-[#74AA9C]" />
        </div>
        <h2 className="text-xl font-semibold text-[#74AA9C]">Audio Story Mode</h2>
      </div>

      {!storyContent ? (
        // Generate Story Section
        <div className="text-center py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <div className="bg-gradient-to-br from-[#74AA9C]/20 to-purple-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Headphones className="w-10 h-10 text-[#74AA9C]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Transform Your Document into an Audio Story</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Generate an engaging audio narrative based on your document content. Perfect for learning on-the-go or auditory learners.
            </p>
          </div>
          
          <button
            onClick={generateStoryMode}
            disabled={isGenerating || !documentFile}
            className="bg-gradient-to-r from-[#74AA9C] to-purple-600 hover:from-purple-600 hover:to-[#74AA9C] disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center space-x-3 mx-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Generating Story...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-6 h-6" />
                <span>Generate Story</span>
              </>
            )}
          </button>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>📚 Transform your document into an engaging narrative</p>
            <p>🎧 Listen to the story with natural text-to-speech</p>
            <p>🧠 Improve retention through story-based learning</p>
          </div>
        </div>
      ) : (
        // Story Display and Audio Section
        <div className="space-y-6">
          {/* Story Success Indicator */}
          <div className="bg-gradient-to-r from-green-500/10 to-[#74AA9C]/10 rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
              <h3 className="text-lg font-semibold text-green-400">
                Story Generated Successfully! {isReady && "🎧 Audio Ready"}
              </h3>
            </div>
          </div>

          {/* Story Content */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <BookOpen className="w-5 h-5 text-[#74AA9C] mr-2" />
                <h3 className="text-lg font-semibold text-[#74AA9C]">Generated Story</h3>
              </div>
              <button
                onClick={generateStoryMode}
                disabled={isGenerating}
                className="flex items-center space-x-2 text-sm text-gray-400 hover:text-[#74AA9C] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 leading-relaxed text-base max-h-96 overflow-y-auto">
                <ReactMarkdown 
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-[#74AA9C] mb-4 mt-6" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-[#74AA9C] mb-3 mt-5" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-[#74AA9C] mb-2 mt-4" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="mb-3 pl-4 list-disc" {...props} />,
                    ol: ({node, ...props}) => <ol className="mb-3 pl-4 list-decimal" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-[#74AA9C]" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-purple-300" {...props} />,
                  }}
                >
                  {storyContent}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Audio Player Controls */}
          <div className="bg-gradient-to-r from-[#74AA9C]/10 to-purple-500/10 rounded-xl p-6 border border-[#74AA9C]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Music className="w-6 h-6 text-[#74AA9C] mr-3" />
                <h3 className="text-lg font-semibold">Audio Narration</h3>
              </div>
              <button
                onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                className="flex items-center space-x-2 text-sm text-gray-400 hover:text-[#74AA9C] transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>{showAdvancedControls ? 'Hide' : 'Show'} Settings</span>
              </button>
            </div>
            
            {/* Audio Status */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {isReady ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">
                      {isPlaying ? "🔊 Playing story..." : isPaused ? "⏸️ Paused" : "Ready to play"}
                    </span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-[#74AA9C]" />
                    <span className="text-[#74AA9C]">Preparing narration...</span>
                  </>
                )}
              </div>
              
              {/* Test Speech Button - for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={testSpeech}
                  className="mb-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  Test Speech (Debug)
                </button>
              )}
              
              {/* Progress indicator */}
              {totalWords > 0 && (
                <div className="mb-2">
                  <div className="w-full h-2 bg-gray-700 rounded-full mb-1">
                    <div 
                      className="h-full bg-gradient-to-r from-[#74AA9C] to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400">
                    {currentPosition} / {totalWords} words
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Controls */}
            {showAdvancedControls && (
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6 space-y-4">
                <h4 className="text-sm font-semibold text-[#74AA9C] mb-3">Voice Settings</h4>
                
                {/* Voice Selection */}
                {availableVoices.length > 0 && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Voice</label>
                    <select
                      value={selectedVoice ? availableVoices.indexOf(selectedVoice) : -1}
                      onChange={handleVoiceChange}
                      className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#74AA9C]"
                    >
                      {availableVoices.map((voice, index) => (
                        <option key={index} value={index}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Speed Control */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Speed: {rate.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={rate}
                      onChange={handleRateChange}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  {/* Pitch Control */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Pitch: {pitch.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={pitch}
                      onChange={handlePitchChange}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                <button
                  onClick={updateSpeechSettings}
                  className="w-full bg-[#74AA9C]/20 hover:bg-[#74AA9C]/30 text-[#74AA9C] py-2 rounded-lg transition-colors text-sm"
                >
                  Apply Voice Settings
                </button>
              </div>
            )}

            {/* Main Audio Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={skipBackward}
                disabled={!isReady}
                className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 transition-colors"
                title="Restart"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={stopSpeech}
                disabled={!isReady}
                className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 transition-colors"
                title="Stop"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayPause}
                disabled={!isReady}
                className="p-4 rounded-full bg-gradient-to-r from-[#74AA9C] to-purple-500 hover:from-purple-500 hover:to-[#74AA9C] disabled:from-gray-600 disabled:to-gray-600 transition-all duration-300 shadow-lg"
                title={isPlaying ? "Pause" : isPaused ? "Resume" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </button>

              <button
                onClick={skipForward}
                disabled={!isReady}
                className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 transition-colors"
                title="Restart (Skip Forward)"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <button
                onClick={toggleMute}
                disabled={!isReady}
                className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  disabled={!isReady}
                  className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  title="Volume"
                />
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                {isReady 
                  ? "🎙️ Natural voice narration ready - click play to start listening"
                  : "⏳ Preparing narration..."
                }
              </p>
              {isReady && (
                <p className="text-xs text-purple-300 mt-1">
                  💡 Tip: Use the settings to customize voice, speed, and pitch
                </p>
              )}
              {error && (
                <p className="text-xs text-red-400 mt-1">
                  ⚠️ {error}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles for Sliders */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #74AA9C;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #74AA9C;
          cursor: pointer;
          border: none;
        }
        .slider:disabled::-webkit-slider-thumb {
          background: #666;
          cursor: not-allowed;
        }
        .slider:disabled::-moz-range-thumb {
          background: #666;
          cursor: not-allowed;
        }
      `}</style>
    </motion.div>
  );
};

export default StoryMode;