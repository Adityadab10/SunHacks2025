export interface Summary {
  id: string
  title: string
  content: string
  type: "youtube" | "pdf"
  timestamp: number
  source?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface YoutubeSummaryRequest {
  youtubeUrl: string
  userId?: string
}

export interface YoutubeSummaryResponse {
  summary: string
  title: string
  videoId: string
}

export interface PdfSummaryResponse {
  summary: string
  filename: string
}

export interface TabData {
  id: "youtube" | "pdf" | "notes" | "focus"
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface FocusSession {
  duration: number // in minutes
  startTime: number // timestamp
  isActive: boolean
}
