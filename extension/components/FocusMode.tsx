import React, { useState } from "react"

import { Focus } from "./Icons"

interface FocusModeProps {
  onStartFocus: (duration: number) => void
}

export const FocusMode: React.FC<FocusModeProps> = ({ onStartFocus }) => {
  const [duration, setDuration] = useState(25) // Default 25 minutes

  const handleStartFocus = () => {
    onStartFocus(duration)
  }

  const sliderProgress = ((duration - 5) / (60 - 5)) * 100

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Focus className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Focus Mode</h3>
        <p className="text-sm text-gray-600">
          Start a focused study session with a customizable timer
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Session Duration:{" "}
            <span className="text-blue-600 font-bold">{duration} minutes</span>
          </label>
          <div className="relative">
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sliderProgress}%, #e5e7eb ${sliderProgress}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5m</span>
              <span>30m</span>
              <span>60m</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[15, 25, 45, 60].map((preset) => (
            <button
              key={preset}
              onClick={() => setDuration(preset)}
              className={`py-2 px-3 text-xs rounded-lg font-medium transition-all ${
                duration === preset
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
              }`}>
              {preset}m
            </button>
          ))}
        </div>

        <button
          onClick={handleStartFocus}
          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          <Focus className="w-5 h-5" />
          <span>Start {duration}-Minute Focus Session</span>
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Focus Mode Tips:</p>
            <ul className="space-y-1 text-xs">
              <li>
                • Press{" "}
                <kbd className="bg-blue-200 px-1 rounded text-xs">ESC</kbd>{" "}
                anytime to exit
              </li>
              <li>• Close distracting tabs before starting</li>
              <li>• Take breaks between sessions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
