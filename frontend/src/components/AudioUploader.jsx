import React, { useState, useRef } from 'react'
import { Upload, Loader2, CheckCircle, Mic } from 'lucide-react'

export default function AudioUploader({ onTranscriptReady }) {
  const [uploading, setUploading] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [jobId, setJobId] = useState(null)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file')
      return
    }

    // Validate file size (100MB)
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large. Maximum size is 100MB')
      return
    }

    setUploading(true)

    try {
      // Upload audio file
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/dev'
      const response = await fetch(`${API_BASE_URL}/upload/audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setJobId(data.jobId)
      setEstimatedTime(data.estimatedSeconds)
      setUploading(false)
      setTranscribing(true)

      // Start polling for transcription status
      pollTranscriptionStatus(data.jobId)

    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + error.message)
      setUploading(false)
    }
  }

  const pollTranscriptionStatus = async (id) => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/dev'
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/transcription/${id}`)
        const data = await response.json()

        if (data.status === 'COMPLETED') {
          setProgress(100)
          setTimeout(() => {
            onTranscriptReady(data.transcript)
            setTranscribing(false)
          }, 500)
        } else if (data.status === 'IN_PROGRESS') {
          setProgress(data.progress)
          setEstimatedTime(data.estimatedSecondsRemaining)
          // Poll again in 3 seconds
          setTimeout(checkStatus, 3000)
        } else {
          throw new Error('Transcription failed')
        }
      } catch (error) {
        console.error('Status check error:', error)
        setTranscribing(false)
        alert('Transcription failed: ' + error.message)
      }
    }

    checkStatus()
  }

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  const resetUpload = () => {
    setUploading(false)
    setTranscribing(false)
    setProgress(0)
    setJobId(null)
    setEstimatedTime(0)
    setDragActive(false)
  }

  return (
    <div className="w-full">
      {/* Upload Box */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-pink-400 bg-pink-50'
            : 'border-gray-300 hover:border-pink-200'
        } ${uploading || transcribing ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          className="hidden"
          accept="audio/*"
          disabled={uploading || transcribing}
        />
        
        <div className="space-y-4">
          {!uploading && !transcribing && (
            <>
              {/* Pink icon bubble */}
              <div className="mx-auto w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-pink-600" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {dragActive ? 'Drop your audio file here' : 'Upload Lecture Recording'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or{' '}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-pink-600 hover:text-pink-500 font-medium"
                  >
                    browse files
                  </button>
                </p>
              </div>
              
              <div className="text-xs text-gray-400 space-y-1">
                <p>Supports MP3, WAV, M4A, AAC, OGG, WMA</p>
                <p className="text-pink-600 font-medium">2-hour lectures supported!</p>
              </div>
            </>
          )}

          {uploading && (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-pink-500 animate-spin mb-3" />
              <p className="text-sm text-gray-600">Uploading audio file...</p>
            </div>
          )}

          {transcribing && (
            <div className="flex flex-col items-center w-full px-8">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
              </div>
              
              <p className="text-sm text-gray-600 mb-2">Transcribing lecture...</p>
              <p className="text-xs text-gray-500 mb-4">This may take 2-3 minutes for long recordings</p>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-pink-400 to-pink-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="flex justify-between w-full text-xs text-gray-500">
                <span>{progress}% complete</span>
                <span>{formatTime(estimatedTime)} remaining</span>
              </div>

              {progress === 100 && (
                <div className="flex items-center gap-2 mt-3 text-green-600">
                  <CheckCircle size={16} />
                  <span className="text-sm">Processing complete!</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pink Pro Tip box */}
      <div className="mt-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
        <p className="text-sm text-pink-800">
          <strong>Pro Tip:</strong> 2-hour lectures are supported! 
          Transcription takes 2-3 minutes. Perfect time to grab coffee ☕
        </p>
      </div>

      {/* Reset button */}
      {(uploading || transcribing) && (
        <div className="mt-4 text-center">
          <button
            onClick={resetUpload}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Cancel & try again
          </button>
        </div>
      )}
    </div>
  )
}
