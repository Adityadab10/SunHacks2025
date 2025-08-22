import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: false
}

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
