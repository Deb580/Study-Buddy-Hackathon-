import React, { useState, useRef } from 'react'

function FileUploader({ onFileProcess, isLoading }) {
  const [dragActive, setDragActive] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [inputMode, setInputMode] = useState('text') // 'text' or 'file'
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
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file) => {
    if (isLoading) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      // For .docx files, content will be base64, for .txt it's plain text
      onFileProcess(content, file.name)
    }

    // Read .docx files as base64, text files as text
    if (file.name.endsWith('.docx')) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsText(file)
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleTextSubmit = () => {
    if (isLoading || !textInput.trim()) return
    
    onFileProcess(textInput.trim(), 'notes.txt')
  }

  const handleTextAreaKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTextSubmit()
    }
  }

  return (
    <div className="w-full">
      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setInputMode('text')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMode === 'text'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Type Notes
          </button>
          <button
            onClick={() => setInputMode('file')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              inputMode === 'file'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload File
          </button>
        </div>
      </div>

      {inputMode === 'text' ? (
        /* Text Input Mode */
        <div className="space-y-4">
          <div>
            <label htmlFor="notes-text" className="block text-sm font-medium text-gray-700 mb-2">
              Paste your study notes here
            </label>
            <textarea
              id="notes-text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleTextAreaKeyDown}
              placeholder="Paste your study notes, lecture transcripts, or any text content here..."
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tip: Press Ctrl+Enter to submit
            </p>
          </div>
          <button
        onClick={handleTextSubmit}
        disabled={isLoading || !textInput.trim()}
        className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-300
          ${isLoading
            ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
            : 'bg-blue-200 text-blue-800 hover:bg-blue-300 active:bg-pink-300 active:text-white shadow-sm hover:shadow-md'
          }`}
      >
        {isLoading ? 'Generating study content...' : 'Generate Study Content'}
      </button>

        </div>
      ) : (
        /* File Upload Mode */
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            className="hidden"
            accept=".txt,.md,.doc,.docx"
            disabled={isLoading}
          />
          
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                {dragActive ? 'Drop your file here' : 'Drag and drop your file here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  browse files
                </button>
              </p>
            </div>
            
            <p className="text-xs text-gray-400">
              Supports .txt, .md, .doc, .docx files
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUploader
