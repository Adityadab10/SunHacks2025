import type { PlasmoCSConfig } from "plasmo"
import React from "react"
import { createRoot } from "react-dom/client"

import { Close, Timer } from "./components/Icons"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

// Focus Mode Overlay Component
const FocusOverlay: React.FC<{
  timeLeft: number
  onExit: () => void
}> = ({ timeLeft, onExit }) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 2147483647,
        backgroundColor: "transparent", // Fully transparent
        display: "flex",
        alignItems: "flex-start", // Align to top
        justifyContent: "flex-end", // Align to right
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "white",
        pointerEvents: "none", // Allow clicks to pass through
        padding: "1rem" // Add some padding from edges
      }}>
      {/* Timer in top-right corner */}
      <div
        style={{
          textAlign: "center",
          pointerEvents: "auto", // Allow interaction with this area
          position: "relative"
        }}>
        {/* Exit button */}
        <button
          onClick={onExit}
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "-2.5rem",
            backgroundColor: "rgba(239, 68, 68, 0.9)", // Red with transparency
            border: "none",
            borderRadius: "50%",
            width: "2rem",
            height: "2rem",
            color: "white",
            cursor: "pointer",
            fontSize: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
            pointerEvents: "auto", // Allow clicking this button
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            ;(e.target as HTMLElement).style.backgroundColor =
              "rgba(220, 38, 38, 0.9)"
          }}
          onMouseLeave={(e) => {
            ;(e.target as HTMLElement).style.backgroundColor =
              "rgba(239, 68, 68, 0.9)"
          }}>
          ×
        </button>

        {/* Timer display */}
        <div
          style={{
            backgroundColor: "rgba(17, 24, 39, 0.95)", // More opaque dark background
            borderRadius: "0.75rem",
            padding: "1rem 1.5rem",
            border: "2px solid #374151",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)" // Add blur for better visibility
          }}>
          <div
            style={{
              fontSize: "2rem", // Smaller font size
              fontFamily: "monospace",
              fontWeight: "bold",
              color: "#60a5fa",
              marginBottom: "0.25rem",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" // Add text shadow for better visibility
            }}>
            {formatTime(timeLeft)}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#e5e7eb", // Lighter color for better contrast
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)"
            }}>
            Focus Mode
          </div>
        </div>
      </div>

      {/* Exit button */}
      {/* <button
        onClick={onExit}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          backgroundColor: "#dc2626",
          color: "white",
          padding: "1rem",
          borderRadius: "50%",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          pointerEvents: "auto" // Enable clicks on button
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#b91c1c"
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#dc2626"
        }}
        title="Exit Focus Mode (Press ESC)">
        <Close className="w-5 h-5" />
        <span
          style={{
            display: window.innerWidth > 640 ? "inline" : "none"
          }}>
          Exit Focus Mode
        </span>
      </button> */}

      {/* Instructions */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          left: "2rem",
          color: "#9ca3af",
          fontSize: "0.875rem"
        }}>
        Press{" "}
        <kbd
          style={{
            backgroundColor: "#374151",
            padding: "0.25rem 0.5rem",
            borderRadius: "0.25rem",
            fontSize: "0.75rem"
          }}>
          ESC
        </kbd>{" "}
        to exit
      </div>

      {/* Note about fullscreen */}
      <div
        style={{
          position: "fixed",
          top: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#9ca3af",
          fontSize: "0.75rem",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem"
        }}>
        💡 Tip: Press F11 for true fullscreen experience
      </div>
    </div>
  )
}

// Focus Mode Handler Class
class FocusMode {
  private overlay: HTMLDivElement | null = null
  private root: any = null
  private timer: number | null = null
  private duration: number = 0
  private timeLeft: number = 0

  constructor() {
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.updateTimer = this.updateTimer.bind(this)
    this.exitFocusMode = this.exitFocusMode.bind(this)
    this.preventTabSwitching = this.preventTabSwitching.bind(this)
  }

  startFocusMode(duration: number) {
    if (this.overlay) {
      this.exitFocusMode()
    }

    this.duration = duration * 60 // Convert minutes to seconds
    this.timeLeft = this.duration

    this.createOverlay()
    this.startTimer()
    this.addEventListeners()
    this.playSound("start")
  }

  private createOverlay() {
    // Don't hide page content - allow visibility of underlying content

    // Create overlay container
    this.overlay = document.createElement("div")
    this.overlay.id = "focus-mode-overlay"

    // Apply fullscreen-like styles with maximum z-index
    Object.assign(this.overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      right: "0",
      bottom: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "2147483647",
      pointerEvents: "none", // Allow clicks to pass through to content below
      backgroundColor: "transparent", // Make container transparent
      margin: "0",
      padding: "0",
      border: "none",
      outline: "none",
      boxSizing: "border-box"
    })

    // Ensure overlay covers everything
    document.body.appendChild(this.overlay)

    // Create React root and render
    this.root = createRoot(this.overlay)
    this.renderOverlay()
  }

  private renderOverlay() {
    if (this.root) {
      this.root.render(
        <FocusOverlay timeLeft={this.timeLeft} onExit={this.exitFocusMode} />
      )
    }
  }

  private startTimer() {
    this.timer = window.setInterval(this.updateTimer, 1000)
  }

  private updateTimer() {
    this.timeLeft--

    if (this.timeLeft <= 0) {
      this.timeLeft = 0
      this.onTimerComplete()
    }

    this.renderOverlay()
  }

  private onTimerComplete() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    this.playSound("complete")

    // Auto-exit after 5 seconds showing completion message
    setTimeout(() => {
      this.exitFocusMode()
    }, 5000)
  }

  private addEventListeners() {
    document.addEventListener("keydown", this.handleKeyPress, true)
    document.addEventListener("keydown", this.preventTabSwitching, true)
  }

  private removeEventListeners() {
    document.removeEventListener("keydown", this.handleKeyPress, true)
    document.removeEventListener("keydown", this.preventTabSwitching, true)
  }

  private handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault()
      event.stopPropagation()
      this.exitFocusMode()
    }
  }

  private preventTabSwitching(event: KeyboardEvent) {
    // Prevent common tab switching shortcuts but allow F11 for fullscreen
    if (
      ((event.ctrlKey || event.metaKey) && event.key === "Tab") ||
      ((event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "Tab") ||
      (event.altKey && event.key === "Tab") ||
      ((event.ctrlKey || event.metaKey) && /^[1-9]$/.test(event.key)) ||
      ((event.ctrlKey || event.metaKey) && event.key === "w") ||
      ((event.ctrlKey || event.metaKey) && event.key === "t") ||
      ((event.ctrlKey || event.metaKey) && event.key === "n") ||
      (event.altKey && event.key === "F4")
    ) {
      event.preventDefault()
      event.stopImmediatePropagation()

      // Show a message to user
      this.showWarning(
        "Focus mode active! Use ESC to exit or F11 for fullscreen."
      )
    }
  }

  private showWarning(message: string) {
    if (this.overlay) {
      const warning = document.createElement("div")
      warning.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 999999999;
        font-family: system-ui;
        font-size: 16px;
        text-align: center;
        max-width: 300px;
      `
      warning.textContent = message
      this.overlay.appendChild(warning)

      setTimeout(() => {
        if (warning.parentNode) {
          warning.parentNode.removeChild(warning)
        }
      }, 3000)
    }
  }

  private exitFocusMode() {
    // Clear timer
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }

    // Remove event listeners
    this.removeEventListeners()

    // Remove overlay
    if (this.overlay && this.overlay.parentNode) {
      this.root?.unmount()
      this.overlay.parentNode.removeChild(this.overlay)
      this.overlay = null
      this.root = null
    }

    // Reset state
    this.timeLeft = 0
    this.duration = 0
  }

  private playSound(type: "start" | "complete") {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      if (type === "start") {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(
          1000,
          audioContext.currentTime + 0.1
        )
      } else {
        // Completion sound - three ascending tones
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
        oscillator.frequency.setValueAtTime(
          1000,
          audioContext.currentTime + 0.4
        )
      }

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + (type === "start" ? 0.2 : 0.6)
      )

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + (type === "start" ? 0.2 : 0.6))
    } catch (error) {
      console.log("Audio not available:", error)
    }
  }
}

// Initialize focus mode handler
const focusMode = new FocusMode()

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getPageInfo") {
    const pageInfo = {
      url: window.location.href,
      title: document.title,
      isYouTube: window.location.hostname.includes("youtube.com"),
      videoId: getYouTubeVideoId(window.location.href)
    }

    sendResponse(pageInfo)
    return true
  }

  if (message.action === "summarize") {
    // Legacy support for basic page summarization
    const text = document.body.innerText.slice(0, 5000)
    sendResponse({ text })
    return true
  }

  if (message.action === "startFocusMode") {
    focusMode.startFocusMode(message.duration || 25)
    sendResponse({ success: true })
    return true
  }
})

// Helper function to extract YouTube video ID
function getYouTubeVideoId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Notify popup when URL changes (for single-page apps like YouTube)
let currentUrl = window.location.href

const observer = new MutationObserver(() => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href
    // Send message to background script about URL change
    chrome.runtime.sendMessage({
      action: "urlChanged",
      url: currentUrl,
      isYouTube: window.location.hostname.includes("youtube.com")
    })
  }
})

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
})

export {}
