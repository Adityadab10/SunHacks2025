import React, { useState } from "react"

import { FocusMode } from "./components/FocusMode"
import { BookOpen, FileText, Focus, Play } from "./components/Icons"
import { NotesWorkspace } from "./components/NotesWorkspace"
import { PdfSummary } from "./components/PdfSummary"
import { YouTubeSummary } from "./components/YouTubeSummary"
import type { Summary, TabData } from "./types"

import "./style.css"

function IndexPopup() {
  const [activeTab, setActiveTab] = useState<
    "youtube" | "pdf" | "notes" | "focus"
  >("youtube")
  const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0)

  const tabs: TabData[] = [
    { id: "youtube", label: "YouTube", icon: Play },
    { id: "notes", label: "Notes", icon: BookOpen },
    { id: "focus", label: "Focus", icon: Focus }
  ]

  const handleSaveNote = (note: Summary) => {
    // Trigger refresh of notes tab
    setNotesRefreshTrigger((prev) => prev + 1)
  }

  const handleStartFocus = async (duration: number) => {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    if (tab.id) {
      // Send message to content script to start focus mode
      chrome.tabs.sendMessage(tab.id, {
        action: "startFocusMode",
        duration: duration
      })

      // Close the popup
      window.close()
    }
  }

  const TabButton: React.FC<{ tab: TabData }> = ({ tab }) => {
    const IconComponent = tab.icon
    const isActive = activeTab === tab.id

    return (
      <button
        onClick={() => setActiveTab(tab.id)}
        className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg font-medium transition-all ${
          isActive
            ? "bg-blue-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}>
        <IconComponent className="w-5 h-5 mb-1" />
        <span className="text-xs">{tab.label}</span>
      </button>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "youtube":
        return <YouTubeSummary onSaveNote={handleSaveNote} />
      case "pdf":
        return <PdfSummary onSaveNote={handleSaveNote} />
      case "notes":
        return <NotesWorkspace refreshTrigger={notesRefreshTrigger} />
      case "focus":
        return <FocusMode onStartFocus={handleStartFocus} />
      default:
        return null
    }
  }

  return (
    <div className="w-[420px] min-h-[600px] bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <h1 className="text-xl font-bold text-center">Study Extension</h1>
        <p className="text-sm text-center opacity-90 mt-1">
          Summarize content and organize your notes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">{renderTabContent()}</div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 text-center bg-gray-50">
        <p className="text-xs text-gray-500">Study Extension v1.0.0</p>
      </div>
    </div>
  )
}

export default IndexPopup
