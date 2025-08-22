// Handle URL changes from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "urlChanged") {
    // You can handle URL changes here if needed
    // For example, update badge or perform background tasks
    console.log("URL changed to:", message.url)
  }
})

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    // Tab has finished loading
    if (tab.url.includes("youtube.com")) {
      // Could update extension badge or perform other actions
      chrome.action.setBadgeText({
        text: "YT",
        tabId: tabId
      })
      chrome.action.setBadgeBackgroundColor({
        color: "#FF0000",
        tabId: tabId
      })
    } else {
      chrome.action.setBadgeText({
        text: "",
        tabId: tabId
      })
    }
  }
})

// Clear badge when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.action.setBadgeText({
    text: "",
    tabId: tabId
  })
})

export {}
