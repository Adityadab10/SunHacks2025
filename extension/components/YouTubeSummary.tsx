import React, { useEffect, useState } from "react"

import type { Summary } from "../types"
import { ApiClient, getYouTubeVideoId, isYouTubeUrl } from "../utils/api"
import { StorageManager } from "../utils/storage"
import { generateExtensionUserId } from "../utils/user"
import { AlertCircle, Loader2, Play, Save } from "./Icons"

interface YouTubeSummaryProps {
  onSaveNote: (note: Summary) => void
}

export const YouTubeSummary: React.FC<YouTubeSummaryProps> = ({
  onSaveNote
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [videoTitle, setVideoTitle] = useState<string>("")
  const [isYouTubePage, setIsYouTubePage] = useState(false)

  useEffect(() => {
    // Get current tab URL
    const getCurrentTab = async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true
        })
        if (tab.url) {
          setCurrentUrl(tab.url)
          setIsYouTubePage(isYouTubeUrl(tab.url))
        }
      } catch (error) {
        console.error("Failed to get current tab:", error)
      }
    }

    getCurrentTab()
  }, [])

  const handleSummarize = async () => {
    if (!isYouTubePage) {
      setError("Please navigate to a YouTube video page")
      return
    }

    setIsLoading(true)
    setError("")
    setSummary("")

    try {
      // Get or generate a userId for this extension user
      const userId = await generateExtensionUserId()

      const response = await ApiClient.summarizeYoutube({
        youtubeUrl: currentUrl,
        userId: userId
      })

      if (response.success && response.data) {
        setSummary(response.data.summary)
        setVideoTitle(response.data.title)
      } else {
        setError(response.error || "Failed to summarize video")
      }
    } catch (error) {
      setError("Network error occurred. Please check your connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToNotes = async () => {
    if (!summary) return

    try {
      const videoId = getYouTubeVideoId(currentUrl)
      const note: Summary = {
        id: `youtube_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: videoTitle || `YouTube Video ${videoId || "Summary"}`,
        content: summary,
        type: "youtube",
        timestamp: Date.now(),
        source: currentUrl
      }

      await StorageManager.saveNote(note)
      onSaveNote(note)

      // Show success feedback
      const originalText = "Save to Notes"
      const button = document.querySelector(
        "[data-save-button]"
      ) as HTMLButtonElement
      if (button) {
        button.textContent = "Saved!"
        button.disabled = true
        setTimeout(() => {
          button.textContent = originalText
          button.disabled = false
        }, 2000)
      }
    } catch (error) {
      setError("Failed to save note")
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Play className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold">YouTube Summary</h3>
        </div>

        {currentUrl && (
          <div className="text-xs text-gray-500 mb-3 break-all">
            {isYouTubePage ? "✅ " : "❌ "}
            {currentUrl.slice(0, 60)}...
          </div>
        )}
      </div>

      {!isYouTubePage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Please navigate to a YouTube video to use this feature
            </span>
          </div>
        </div>
      )}

      <button
        onClick={handleSummarize}
        disabled={!isYouTubePage || isLoading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Summarizing...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>Summarize YouTube Video</span>
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {summary && (
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Summary:</h4>
            <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {summary}
            </div>
          </div>

          <button
            onClick={handleSaveToNotes}
            data-save-button
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save to Notes</span>
          </button>
        </div>
      )}
    </div>
  )
}
