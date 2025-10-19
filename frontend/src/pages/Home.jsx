import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FileUploader from '../components/FileUploader'
import AudioUploader from '../components/AudioUploader'
import { generateStudyContent, uploadFile } from '../services/api'
import { FileText, Mic, Sparkles, Download, Zap } from 'lucide-react'
import cloud from './assets/cloud.png';

function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadMode, setUploadMode] = useState('text')
  const navigate = useNavigate()

  const handleFileProcess = async (fileContent, fileName) => {
    setIsLoading(true)
    setError('')

    try {
      // Check if content is base64 (from .docx file upload)
      let textToProcess = fileContent
      if (fileName && (fileName.endsWith('.docx') || fileName.endsWith('.doc')) && fileContent.startsWith('data:')) {
        // Extract text from .docx file first
        console.log('Extracting text from .docx file...')
        const uploadResult = await uploadFile(fileContent, fileName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        if (uploadResult.success) {
          textToProcess = uploadResult.data.text
          console.log('Extracted text length:', textToProcess.length)
        } else {
          setError('Failed to extract text from file')
          return
        }
      }

      const result = await generateStudyContent(textToProcess)
      if (result.success) {
        const studySetId = `study_${Date.now()}`
        sessionStorage.setItem(studySetId, JSON.stringify({
          fileName,
          content: result.data,
          originalContent: textToProcess,
          createdAt: new Date().toISOString()
        }))
        navigate(`/study/${studySetId}`)
      } else {
        setError('Failed to generate study content')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranscriptReady = async (transcript) => {
    await handleFileProcess(transcript, 'lecture_transcript.txt')
  }

  return (
    // OUTER WRAPPER — anchor cloud to this
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-blue-200 relative overflow-hidden">

      {/* FLOATING CLOUD — anchored to page corner, behind content */}
      <div className="pointer-events-none select-none absolute top-0 right-0 translate-x-12 -translate-y-10 z-0">
        <img
          src={cloud}
          alt="Cloud"
          className="w-[360px] md:w-[520px] lg:w-[660px] h-auto object-contain drop-shadow-xl"
        />
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        text-center text-sm md:text-base lg:text-lg  text-blue-350 leading-snug
        w-[220px] md:w-[260px] drop-shadow-[0_0_8px_rgba(255,192,203,0.6)]">
          Psst... I organized your brain cells while you were gone
        </p>
      </div>

      {/* MAIN CONTENT — sits above the cloud */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">

        {/* HEADER ROW */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-start content-start gap-4 mb-0">
          {/* LEFT TEXT */}
          <div className="md:col-span-7 text-left self-start">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
              Study Buddy
            </h1>
            <p className="mt-2 text-base md:text-lg text-gray-600">
              Flashcards, Quizzes, and Multiplayer Games for your Study Materials
            </p>
          </div>
          {/* (Right column removed — cloud now floats outside the grid) */}
        </div>

        {/* TAGLINE */}
        <p className="text-xl md:text-2xl text-gray-700 text-left mt-4 mb-4">
          Transform your notes into summaries, flashcards, and quizzes
        </p>

        {/* MAIN CARD */}
        <div className="w-full -mt-1">
          <div className="mx-auto w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative z-10">

            {/* MODE TOGGLE + Multiplayer — centered buttons, multiplayer on right */}
            <div className="relative flex justify-center mb-6">
              {/* Center: Text / Audio toggle */}
              <div className="flex gap-4">
                <button
                  onClick={() => setUploadMode('text')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm md:text-base font-medium transition-all duration-300
        ${uploadMode === 'text'
                      ? 'bg-pink-200 text-pink-800 shadow-md scale-[1.03]'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                >
                  <FileText size={18} />
                  Text
                </button>

                <button
                  onClick={() => setUploadMode('audio')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm md:text-base font-medium transition-all duration-300
        ${uploadMode === 'audio'
                      ? 'bg-pink-200 text-pink-800 shadow-md scale-[1.03]'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                >
                  <Mic size={18} />
                  Audio
                </button>
              </div>

              {/* Right: Join Multiplayer */}
              <button
                onClick={() => navigate('/multiplayer', { state: { fromHome: true } })}
                className="absolute right-0 top-1/2 -translate-y-1/2
               inline-flex items-center gap-2 px-4 py-2 rounded-xl
               bg-pink-200 text-pink-800 hover:bg-pink-300
               font-medium shadow-sm"
              >
                🎮 Join Multiplayer
              </button>
            </div>



            {/* Dynamic upload section */}
            {uploadMode === 'text' ? (
              <>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 text-center">
                  Upload Your Study Notes
                </h2>
                <FileUploader onFileProcess={handleFileProcess} isLoading={isLoading} />
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2 text-center">
                  Upload Lecture Recording
                </h2>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Drag &amp; drop audio or choose a file. We’ll transcribe and generate study materials.
                </p>
                <AudioUploader onTranscriptReady={handleTranscriptReady} />
              </>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}



            {/* Loading */}
            {isLoading && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-blue-600">Generating study content...</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Home



