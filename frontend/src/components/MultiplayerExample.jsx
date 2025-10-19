import React, { useState } from 'react'
import { useMultiplayer } from '../hooks/useMultiplayer'

/**
 * Example component showing how to use the useMultiplayer hook
 * This is a complete working example for the multiplayer quiz
 */
const MultiplayerExample = () => {
  const [playerName, setPlayerName] = useState('')
  const [roomCodeInput, setRoomCodeInput] = useState('')
  
  // Initialize multiplayer hook with callbacks
  const {
    // State
    session,
    roomCode,
    isHost,
    currentQuestion,
    currentQuestionIndex,
    players,
    hasAnswered,
    gameStatus,
    
    // Actions
    createSession,
    joinSession,
    startQuiz,
    submitAnswer,
    nextQuestion,
    getLeaderboard,
    leaveSession,
    
    // Status
    loading,
    error
  } = useMultiplayer({
    onSessionUpdate: (session) => {
      console.log('📊 Session updated:', session)
    },
    onQuestionChange: (question, index) => {
      console.log('❓ New question:', question.question)
    },
    onGameEnd: (session) => {
      console.log('🏁 Game ended!')
      handleShowLeaderboard()
    },
    pollingInterval: 2000 // Poll every 2 seconds
  })

  // Handler functions
  const handleCreateSession = async () => {
    const questions = [
      {
        question: "What is 2+2?",
        options: ["3", "4", "5", "6"],
        correctAnswer: 1,
        explanation: "2+2 equals 4"
      },
      {
        question: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correctAnswer: 2,
        explanation: "Paris is the capital of France"
      }
    ]
    
    try {
      await createSession(playerName || 'Host', questions)
      window.toast?.success('Session created! Share room code: ' + roomCode)
    } catch (err) {
      window.toast?.error('Failed to create session')
    }
  }

  const handleJoinSession = async () => {
    try {
      await joinSession(roomCodeInput, playerName || 'Player')
      window.toast?.success('Joined session!')
    } catch (err) {
      window.toast?.error('Failed to join session')
    }
  }

  const handleStartQuiz = async () => {
    try {
      await startQuiz()
      window.toast?.info('Quiz started!')
    } catch (err) {
      window.toast?.error('Failed to start quiz')
    }
  }

  const handleSubmitAnswer = async (answerIndex) => {
    try {
      await submitAnswer(answerIndex, 5)
      window.toast?.success('Answer submitted!')
    } catch (err) {
      window.toast?.error('Failed to submit answer')
    }
  }

  const handleNextQuestion = async () => {
    try {
      await nextQuestion()
    } catch (err) {
      window.toast?.error('Failed to advance question')
    }
  }

  const handleShowLeaderboard = async () => {
    try {
      const leaderboard = await getLeaderboard()
      console.log('🏆 Leaderboard:', leaderboard)
    } catch (err) {
      window.toast?.error('Failed to get leaderboard')
    }
  }

  // Render based on game status
  if (!session) {
    // Not in a session - show create/join options
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Multiplayer Quiz</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg mb-4"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Create Session */}
          <div className="p-6 bg-white rounded-lg shadow-md border-2 border-blue-200">
            <h2 className="text-xl font-bold mb-4">🎮 Host a Quiz</h2>
            <button
              onClick={handleCreateSession}
              disabled={loading || !playerName}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? '⏳ Creating...' : 'Create Session'}
            </button>
          </div>
          
          {/* Join Session */}
          <div className="p-6 bg-white rounded-lg shadow-md border-2 border-green-200">
            <h2 className="text-xl font-bold mb-4">👥 Join a Quiz</h2>
            <input
              type="text"
              placeholder="Room Code (e.g., ABC123)"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
            />
            <button
              onClick={handleJoinSession}
              disabled={loading || !playerName || roomCodeInput.length !== 6}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? '⏳ Joining...' : 'Join Session'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gameStatus === 'waiting') {
    // In lobby - waiting for players
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6">Quiz Lobby</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Room Code</p>
            <p className="text-4xl font-bold text-blue-600">{roomCode}</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">
              👥 Players ({players.length})
            </h2>
            <div className="space-y-2">
              {players.map((player, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                  <span className="text-2xl">
                    {player.isHost ? '👑' : '👤'}
                  </span>
                  <span className="font-medium">{player.name}</span>
                  {player.isHost && <span className="text-xs text-gray-500">(Host)</span>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
            {isHost && (
              <button
                onClick={handleStartQuiz}
                disabled={loading || players.length < 1}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
              >
                {loading ? '⏳ Starting...' : '🚀 Start Quiz'}
              </button>
            )}
            <button
              onClick={leaveSession}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gameStatus === 'playing' && currentQuestion) {
    // Quiz in progress
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1}
            </span>
            <span className="text-sm font-medium text-blue-600">
              Room: {roomCode}
            </span>
          </div>
          
          <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>
          
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSubmitAnswer(index)}
                disabled={hasAnswered || loading}
                className={`w-full p-4 text-left rounded-lg border-2 font-medium transition-all ${
                  hasAnswered
                    ? index === currentQuestion.correctAnswer
                      ? 'bg-green-100 border-green-500 text-green-900'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                    : 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <span className="font-bold mr-2">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </button>
            ))}
          </div>
          
          {hasAnswered && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                ✅ Answer submitted! Waiting for other players...
              </p>
            </div>
          )}
          
          {isHost && (
            <button
              onClick={handleNextQuestion}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {loading ? '⏳ Loading...' : '➡️ Next Question'}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (gameStatus === 'finished') {
    // Quiz finished - show leaderboard
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6 text-center">🏆 Quiz Complete!</h1>
          
          <div className="mb-6">
            <button
              onClick={handleShowLeaderboard}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              View Full Leaderboard
            </button>
          </div>
          
          <button
            onClick={leaveSession}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default MultiplayerExample

