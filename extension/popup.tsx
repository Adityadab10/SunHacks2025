import React, { useState } from "react"

import { BookOpen, FileText, Play } from "./components/Icons"
import { NotesWorkspace } from "./components/NotesWorkspace"
import { PdfSummary } from "./components/PdfSummary"
import { YouTubeSummary } from "./components/YouTubeSummary"
import type { Summary, TabData } from "./types"

import "./style.css"

function IndexPopup() {
  const [activeTab, setActiveTab] = useState<"youtube" | "pdf" | "notes">(
    "youtube"
  )
  const [notesRefreshTrigger, setNotesRefreshTrigger] = useState(0)

  const tabs: TabData[] = [
    { id: "youtube", label: "YouTube", icon: Play },
    { id: "pdf", label: "PDF", icon: FileText },
    { id: "notes", label: "Notes", icon: BookOpen }
  ]

  const handleSaveNote = (note: Summary) => {
    // Trigger refresh of notes tab
    setNotesRefreshTrigger((prev) => prev + 1)
  }

  const TabButton: React.FC<{ tab: TabData }> = ({ tab }) => {
    const Icon = tab.icon
    const isActive = activeTab === tab.id

    return (
      <button
        onClick={() => setActiveTab(tab.id)}
        className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
          isActive
            ? "bg-blue-600 text-white shadow-md"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm">{tab.label}</span>
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
      default:
        return null
    }
  }

  return (
    <div className="w-96 min-h-[500px] bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <h1 className="text-xl font-bold text-center">Study Extension</h1>
        <p className="text-sm text-center opacity-90 mt-1">
          Summarize content and organize your notes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <TabButton key={tab.id} tab={tab} />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">{renderTabContent()}</div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 text-center">
        <p className="text-xs text-gray-500">Study Extension v1.0.0</p>
      </div>
    </div>
  )
}

export default IndexPopup
