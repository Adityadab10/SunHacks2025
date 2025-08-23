import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Download,
  Loader2,
  Headphones,
  Music,
  BookOpen
} from 'lucide-react';

const StoryMode = ({ studyBoard, documentFile }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyContent, setStoryContent] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef(null);

  // Generate story mode content
  const generateStoryMode = async () => {
    if (!documentFile) return;

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('file', documentFile);
      formData.append('generateAudio', 'true');

      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/generate-story`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setStoryContent(data.story);
        if (data.audioUrl) {
          setAudioUrl(data.audioUrl);
        }
      } else {
        throw new Error('Failed to generate story');
      }
    } catch (error) {
      console.error('Error generating story:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Audio controls
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const resetAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const seekTime = (e.nativeEvent.offsetX / e.target.offsetWidth) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${documentFile?.name || 'story'}_audio.mp3`;
      link.click();
    }
  };

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
                <span>Generating Audio Story...</span>
              </>
            ) : (
              <>
                <Headphones className="w-6 h-6" />
                <span>Generate Audio Story</span>
              </>
            )}
          </button>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>🎧 Listen to your study material as an engaging story</p>
            <p>📱 Perfect for learning while commuting or exercising</p>
            <p>🧠 Improve retention through auditory learning</p>
          </div>
        </div>
      ) : (
        // Audio Player Section
        <div className="space-y-6">
          {/* Audio Waveform Visualization */}
          <div className="bg-gradient-to-r from-[#74AA9C]/10 to-purple-500/10 rounded-xl p-6 border border-[#74AA9C]/20">
            <div className="flex items-center justify-center mb-4">
              <Music className="w-8 h-8 text-[#74AA9C] mr-3" />
              <h3 className="text-lg font-semibold">Audio Story Ready</h3>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div 
                className="w-full h-2 bg-gray-700 rounded-full cursor-pointer"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-gradient-to-r from-[#74AA9C] to-purple-500 rounded-full transition-all duration-200"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={resetAudio}
                className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayPause}
                disabled={!audioUrl}
                className="p-4 rounded-full bg-gradient-to-r from-[#74AA9C] to-purple-500 hover:from-purple-500 hover:to-[#74AA9C] disabled:from-gray-600 disabled:to-gray-600 transition-all duration-300 shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
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
                  className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {audioUrl && (
                <button
                  onClick={downloadAudio}
                  className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Story Content Text */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/30">
            <div className="flex items-center mb-4">
              <BookOpen className="w-5 h-5 text-[#74AA9C] mr-2" />
              <h3 className="text-lg font-semibold text-[#74AA9C]">Story Transcript</h3>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 leading-relaxed">
                <ReactMarkdown>{storyContent}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Audio Element */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          )}
        </div>
      )}

      {/* Custom Styles for Audio Slider */}
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
      `}</style>
    </motion.div>
  );
};

export default StoryMode;
