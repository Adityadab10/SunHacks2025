import React, { useEffect, useState } from "react"

import type { Summary } from "../types"
import { StorageManager } from "../utils/storage"
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Download,
  ExternalLink,
  Trash2
} from "./Icons"

interface NotesWorkspaceProps {
  refreshTrigger: number
}

export const NotesWorkspace: React.FC<NotesWorkspaceProps> = ({
  refreshTrigger
}) => {
  const [notes, setNotes] = useState<Summary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")

  const loadNotes = async () => {
    try {
      setIsLoading(true)
      const savedNotes = await StorageManager.getNotes()
      setNotes(savedNotes.sort((a, b) => b.timestamp - a.timestamp))
    } catch (error) {
      setError("Failed to load notes")
      console.error("Failed to load notes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotes()
  }, [refreshTrigger])

  const handleDeleteNote = async (noteId: string) => {
    try {
      await StorageManager.deleteNote(noteId)
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
    } catch (error) {
      setError("Failed to delete note")
    }
  }

  const handleExportNotes = () => {
    if (notes.length === 0) {
      setError("No notes to export")
      return
    }

    const exportText = StorageManager.exportNotesAsText(notes)
    const filename = `study-notes-${new Date().toISOString().split("T")[0]}.txt`
    StorageManager.downloadTextFile(exportText, filename)
  }

  const handleOpenSource = (source: string) => {
    if (source.startsWith("http")) {
      chrome.tabs.create({ url: source })
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    return content.length > maxLength
      ? content.slice(0, maxLength) + "..."
      : content
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Notes Workspace</h3>
        </div>
        <span className="text-sm text-gray-500">({notes.length} notes)</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <button
          onClick={handleExportNotes}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export All Notes</span>
        </button>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No saved notes yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Summarize YouTube videos or PDFs to save notes
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {note.title}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        note.type === "youtube"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}>
                      {note.type === "youtube" ? "YouTube" : "PDF"}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(note.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  {note.source && note.source.startsWith("http") && (
                    <button
                      onClick={() => handleOpenSource(note.source!)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Open source">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete note">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {truncateContent(note.content)}
              </p>

              {note.source && !note.source.startsWith("http") && (
                <p className="text-xs text-gray-500 mt-2 truncate">
                  Source: {note.source}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
