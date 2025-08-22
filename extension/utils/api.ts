import type {
  ApiResponse,
  PdfSummaryResponse,
  YoutubeSummaryRequest,
  YoutubeSummaryResponse
} from "../types"

const API_BASE_URL =
  process.env.PLASMO_PUBLIC_API_URL || "http://localhost:5000"

export class ApiClient {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error("API request failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }

  static async summarizeYoutube(
    request: YoutubeSummaryRequest
  ): Promise<ApiResponse<YoutubeSummaryResponse>> {
    return this.makeRequest<YoutubeSummaryResponse>(
      "/api/extension/summarize",
      {
        method: "POST",
        body: JSON.stringify(request)
      }
    )
  }

  static async summarizePdf(
    file: File
  ): Promise<ApiResponse<PdfSummaryResponse>> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${API_BASE_URL}/summarize/pdf`, {
        method: "POST",
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error("PDF summarization failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }
    }
  }
}

export const getYouTubeVideoId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

export const isYouTubeUrl = (url: string): boolean => {
  return url.includes("youtube.com") || url.includes("youtu.be")
}
