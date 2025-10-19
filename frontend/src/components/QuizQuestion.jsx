import React, { useState, useRef, useEffect } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

export default function QuizQuestion({ question, onAnswer, onComplete, timeLimit = 30 }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [isAnswered, setIsAnswered] = useState(false)
  const timerRef = useRef(null)
  const autoAdvanceRef = useRef(null)

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null)
    setShowResult(false)
    setIsAnswered(false)
    setTimeLeft(timeLimit)

    // Clear any existing timers
    if (timerRef.current) clearInterval(timerRef.current)
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
  }, [question, timeLimit])

  // Timer countdown
  useEffect(() => {
    if (isAnswered) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - handle as incorrect answer
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isAnswered, question])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    }
  }, [])

  const handleTimeUp = () => {
    if (isAnswered) return

    setIsAnswered(true)
    setSelectedAnswer(-1) // No answer selected
    setShowResult(true)

    if (onAnswer) {
      onAnswer(false) // Time's up counts as incorrect
    }

    // Auto-advance after showing result
    autoAdvanceRef.current = setTimeout(() => {
      if (onComplete) {
        onComplete()
      }
    }, 1500)
  }

  const handleAnswer = (answerIndex) => {
    if (isAnswered) return

    setIsAnswered(true)
    setSelectedAnswer(answerIndex)
    setShowResult(true)

    // Clear timer
    if (timerRef.current) clearInterval(timerRef.current)

    const isCorrect = answerIndex === question.correctAnswer
    if (onAnswer) {
      onAnswer(isCorrect)
    }

    // Auto-advance after showing result
    autoAdvanceRef.current = setTimeout(() => {
      if (onComplete) {
        onComplete()
      }
    }, 1500)
  }

  const getOptionStyle = (index) => {
    if (!showResult) {
      return selectedAnswer === index
        ? 'bg-blue-100 border-blue-500 text-blue-900'
        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
    }

    if (index === question.correctAnswer) {
      return 'bg-green-100 border-green-500 text-green-900'
    }
    
    if (index === selectedAnswer && index !== question.correctAnswer) {
      return 'bg-red-100 border-red-500 text-red-900'
    }

    return 'bg-gray-100 border-gray-300 text-gray-500'
  }

  const getOptionIcon = (index) => {
    if (!showResult) return null

    if (index === question.correctAnswer) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    }
    
    if (index === selectedAnswer && index !== question.correctAnswer) {
      return <XCircle className="w-5 h-5 text-red-600" />
    }

    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">Q</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Question</h3>
            <p className="text-sm text-gray-500">
              {question.difficulty && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                  question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {question.difficulty.toUpperCase()}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          <div className={`text-lg font-mono font-bold ${
            timeLeft <= 10 ? 'text-red-600' : 
            timeLeft <= 20 ? 'text-yellow-600' : 
            'text-gray-600'
          }`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-8">
        <p className="text-xl text-gray-800 leading-relaxed">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            disabled={isAnswered}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 flex items-center gap-3 ${
              getOptionStyle(index)
            } ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold">
                {String.fromCharCode(65 + index)}
              </span>
            </div>
            <span className="flex-1">{option}</span>
            {getOptionIcon(index)}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 text-sm">💡</span>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Explanation</h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      {isAnswered && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Moving to next question...</span>
          </div>
        </div>
      )}
    </div>
  )
}
