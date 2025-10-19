import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getRoom, multiplayerSubmitAnswer, multiplayerNextQuestion } from '../services/api'
import { Trophy, Crown, Clock, CheckCircle, XCircle, Users, ArrowRight } from 'lucide-react'

export default function LiveQuiz() {
  const { code } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [room, setRoom] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [error, setError] = useState('')
  const pollingRef = useRef(null)
  const timerRef = useRef(null)

  // Get player name from navigation state, sessionStorage, or prompt as last resort
  useEffect(() => {
    // Try to get name from navigation state first (passed from lobby)
    const nameFromState = location.state?.playerName
    if (nameFromState) {
      console.log('Using player name from navigation state:', nameFromState)
      setPlayerName(nameFromState)
      sessionStorage.setItem(`mp_player_${code}`, nameFromState)
      return
    }

    // Try sessionStorage
    const nameFromStorage = sessionStorage.getItem(`mp_player_${code}`)
    if (nameFromStorage) {
      console.log('Using player name from sessionStorage:', nameFromStorage)
      setPlayerName(nameFromStorage)
      return
    }

    // Last resort: prompt (shouldn't happen if coming from lobby)
    console.warn('No player name found, prompting user')
    const enteredName = prompt('Enter your name:')
    if (enteredName) {
      setPlayerName(enteredName)
      sessionStorage.setItem(`mp_player_${code}`, enteredName)
    } else {
      navigate('/')
    }
  }, [code, navigate, location.state])

  // Load questions from the room data (stored in DynamoDB)
  useEffect(() => {
    if (!room) return

    console.log('Loading questions from room data')
    const quizQuestions = room.questions || []
    console.log('Loaded', quizQuestions.length, 'questions from room')

    // DEBUG: Check the actual question structure
    if (quizQuestions.length > 0) {
      console.log('🔍 DEBUG: First question data:', JSON.stringify(quizQuestions[0], null, 2))
      setQuestions(quizQuestions)
    } else {
      console.error('No questions found in room data')
      setError('Quiz data not found. The host needs to create a new room from a study set.')
    }
  }, [room])

  // Poll room state every 2 seconds
  useEffect(() => {
    if (!code || !playerName) return

    const pollRoom = async () => {
      try {
        const updated = await getRoom(code)
        setRoom(updated)

        // Check if we should show leaderboard
        if (updated.showLeaderboard) {
          setShowLeaderboard(true)
        } else {
          setShowLeaderboard(false)
        }
      } catch (e) {
        console.error('Polling failed:', e)
        setError('Lost connection to room')
      }
    }

    pollRoom() // Initial fetch
    pollingRef.current = setInterval(pollRoom, 2000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [code, playerName])

  // Update current question based on room state
  useEffect(() => {
    if (questions.length > 0 && room?.currentQuestion !== undefined) {
      const q = questions[room.currentQuestion]
      if (q) {
        setCurrentQuestion(q)
        setHasAnswered(false)
        setSelectedAnswer(null)
        setTimeLeft(30)
      }
    }
  }, [questions, room?.currentQuestion])

  // Timer countdown
  useEffect(() => {
    if (!currentQuestion || hasAnswered || showLeaderboard) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentQuestion, hasAnswered, showLeaderboard])

  const handleTimeUp = useCallback(async () => {
    if (hasAnswered) return
    setHasAnswered(true)

    try {
      await multiplayerSubmitAnswer({
        code,
        playerName,
        isCorrect: false
      })
    } catch (e) {
      console.error('Failed to submit time-up:', e)
    }
  }, [code, playerName, hasAnswered])

  const handleAnswer = async (answerIndex) => {
    if (hasAnswered || !currentQuestion) return

    setHasAnswered(true)
    setSelectedAnswer(answerIndex)

    const isCorrect = answerIndex === currentQuestion.correctAnswer

    try {
      await multiplayerSubmitAnswer({
        code,
        playerName,
        isCorrect
      })
    } catch (e) {
      setError('Failed to submit answer')
      console.error(e)
    }
  }

  const handleNextQuestion = async () => {
    try {
      await multiplayerNextQuestion(code)
      setError('')
    } catch (e) {
      setError('Failed to advance question')
      console.error(e)
    }
  }

  const getOptionStyle = (index) => {
    if (!hasAnswered) {
      return selectedAnswer === index
        ? 'bg-blue-100 border-blue-500'
        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
    }

    if (index === currentQuestion.correctAnswer) {
      return 'bg-green-100 border-green-500'
    }

    if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
      return 'bg-red-100 border-red-500'
    }

    return 'bg-gray-100 border-gray-300'
  }

  const getOptionIcon = (index) => {
    if (!hasAnswered) return null
    if (index === currentQuestion.correctAnswer) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    }
    if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
      return <XCircle className="w-5 h-5 text-red-600" />
    }
    return null
  }

  const sortedPlayers = [...(room?.players || [])].sort((a, b) => (b.score || 0) - (a.score || 0))

  if (!room || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (showLeaderboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h2>
              <p className="text-gray-600">Question {(room.currentQuestion || 0) + 1} of {questions.length}</p>
            </div>

            <div className="space-y-3">
              {sortedPlayers.map((player, idx) => (
                <div
                  key={player.id || idx}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                    idx === 0 ? 'bg-yellow-50 border-yellow-300' :
                    idx === 1 ? 'bg-gray-50 border-gray-300' :
                    idx === 2 ? 'bg-orange-50 border-orange-300' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-400 text-gray-900' :
                      idx === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {idx === 0 && <Crown className="w-5 h-5 text-yellow-600" />}
                        <span className="font-semibold text-gray-900">{player.name}</span>
                        {player.name === playerName && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">You</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{player.score || 0}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              {room.host === playerName ? (
                <button
                  onClick={handleNextQuestion}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Next Question <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-purple-700">Waiting for host to continue...</span>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Quiz</h1>
              <p className="text-sm text-gray-500">Room: {code}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="font-semibold">{room.players?.length || 0} players</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${timeLeft <= 10 ? 'text-red-500' : 'text-gray-400'}`} />
                <span className={`text-2xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-700'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Question {(room.currentQuestion || 0) + 1} of {questions.length}</span>
              <span>{sortedPlayers.find(p => p.name === playerName)?.score || 0} points</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${((room.currentQuestion || 0) + 1) / questions.length * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <p className="text-2xl text-gray-800 font-medium leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={hasAnswered}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                  getOptionStyle(index)
                } ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
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
          {hasAnswered && currentQuestion.explanation && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-1">Explanation</h4>
              <p className="text-blue-800 text-sm">{currentQuestion.explanation}</p>
            </div>
          )}

          {hasAnswered && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Answer submitted! Waiting for others...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
