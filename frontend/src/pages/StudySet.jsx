import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SummaryCard from '../components/SummaryCard'
import FlashcardViewer from '../components/FlashcardViewer'
import QuizQuestion from '../components/QuizQuestion'
import DynamicQuizController from '../components/DynamicQuizController'
import ExportMenu from '../components/ExportMenu'
import { BookOpen, CreditCard, Brain, Download, ArrowLeft, Play } from 'lucide-react'
import MultiplayerLobby from './MultiplayerLobby' 

function StudySet() {
  const { setId } = useParams()
  const navigate = useNavigate()

  const [studyData, setStudyData] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [loading, setLoading] = useState(true)

  const [quizQuestions, setQuizQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  useEffect(() => {
    const storedData = sessionStorage.getItem(setId)
    if (storedData) {
      try {
        const data = JSON.parse(storedData)
        setStudyData(data)
        setQuizQuestions(data.content?.quiz || [])
      } catch (error) {
        console.error('Error parsing stored data:', error)
        navigate('/')
      }
    } else {
      navigate('/')
    }
    setLoading(false)
  }, [setId, navigate])

  const handleNewQuestions = (newQuestions) => {
    setQuizQuestions(prev => [...prev, ...newQuestions])
  }

  const handleQuizAnswer = (isCorrect) => {
    if (isCorrect) setScore(prev => prev + 1)
  }

  const handleNextQuestion = () => {
    // Guard against multiple calls
    if (quizCompleted) return

    const nextIndex = currentQuestionIndex + 1

    if (nextIndex < quizQuestions.length) {
      setCurrentQuestionIndex(nextIndex)
    } else {
      setQuizCompleted(true)
    }
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setScore(0)
    setQuizCompleted(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!studyData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Study Set Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const flashCount = studyData.content?.flashcards?.length || 0
  const quizCount = quizQuestions.length
  const fileName = studyData.fileName

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fbcfe8 0%, #93c5fd 100%)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {fileName}
          </h1>
          <p className="text-gray-600">
            AI-generated study content • {flashCount} flashcards • {quizCount} quiz questions
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'summary', label: 'Summary', icon: BookOpen },
              { id: 'flashcards', label: 'Flashcards', icon: CreditCard },
              { id: 'quiz', label: 'Practice Quiz', icon: Brain },
              { id: 'multiplayer', label: 'Multiplayer', icon: Play },  
              { id: 'export', label: 'Export', icon: Download },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-400 to-blue-400 text-white shadow-lg'
                    : 'bg-blue-100 text-gray-800 hover:bg-blue-200'
                }`}

                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'summary' && (
            <SummaryCard summary={studyData.content.summary} />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardViewer flashcards={studyData.content.flashcards} />
          )}

          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {/* Dynamic Quiz Controller */}
              <DynamicQuizController
                originalContent={studyData.originalContent}
                currentQuestions={quizQuestions}
                onNewQuestions={handleNewQuestions}
              />

              {/* Quiz Questions */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Practice Quiz
                    </h3>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Your Score</p>
                      <p className="text-2xl font-bold text-blue-600">{score}</p>
                    </div>
                  </div>

                  {/* Progress bar (safe when 0 questions) */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          ((currentQuestionIndex + 1) / Math.max(quizQuestions.length, 1)) * 100
                        }%`
                      }}
                    />
                  </div>
                </div>

                {quizQuestions.length > 0 && !quizCompleted && currentQuestionIndex < quizQuestions.length ? (
                  <QuizQuestion
                    question={quizQuestions[currentQuestionIndex]}
                    onAnswer={(correct) => {
                      handleQuizAnswer(correct)
                      // Don't call handleNextQuestion here - QuizQuestion handles the delay
                    }}
                    onComplete={handleNextQuestion}
                  />
                ) : quizCompleted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🎉</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h3>
                    <p className="text-gray-600 mb-6">
                      You scored {score} out of {quizQuestions.length} questions
                    </p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={restartQuiz}
                        className="px-6 py-3 rounded-lg font-medium text-gray-800 bg-blue-100 hover:bg-pink-200 active:bg-pink-300 transition-all shadow-sm"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => setActiveTab('export')}
                        className="px-6 py-3 rounded-lg font-medium text-gray-800 bg-blue-100 hover:bg-pink-200 active:bg-pink-300 transition-all shadow-sm"
                      >
                        Export Results
                      </button>

                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">
                      No questions available. Generate some questions to start practicing!
                    </p>
                    <button
                      onClick={() => setActiveTab('quiz')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Generate Questions
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ✅ MULTIPLAYER TAB CONTENT (now active and rendered) */}
          {activeTab === 'multiplayer' && (
            <MultiplayerLobby studyId={setId} fileName={fileName} />
          )}

          {activeTab === 'export' && (
            <ExportMenu
              flashcards={studyData.content.flashcards}
              questions={quizQuestions}
              studyData={studyData.content}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default StudySet

