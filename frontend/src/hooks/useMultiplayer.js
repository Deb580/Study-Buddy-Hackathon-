import { useState, useCallback, useEffect } from 'react'
import { usePolling } from './usePolling'
import * as api from '../services/api'

/**
 * Custom hook for managing multiplayer quiz sessions
 * Handles create, join, polling, and answer submission
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Session management functions and state
 */
export const useMultiplayer = (options = {}) => {
  const {
    onSessionUpdate = null,
    onQuestionChange = null,
    onGameEnd = null,
    pollingInterval = 2000
  } = options

  // Session state
  const [session, setSession] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [roomCode, setRoomCode] = useState(null)
  const [isHost, setIsHost] = useState(false)
  
  // Game state
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [players, setPlayers] = useState([])
  const [hasAnswered, setHasAnswered] = useState(false)
  const [gameStatus, setGameStatus] = useState('waiting') // waiting, playing, finished
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Poll session data when we have a sessionId
  const { 
    data: polledSession, 
    error: pollError,
    startPolling,
    stopPolling 
  } = usePolling(
    async () => {
      if (!sessionId) return null
      return await api.getSession(sessionId)
    },
    {
      interval: pollingInterval,
      enabled: !!sessionId && gameStatus !== 'finished',
      onSuccess: (data) => {
        if (onSessionUpdate) {
          onSessionUpdate(data)
        }
      }
    }
  )

  // Update session data when polling returns new data
  useEffect(() => {
    if (polledSession) {
      setSession(polledSession)
      setPlayers(polledSession.players || [])
      
      // Check if question changed
      if (polledSession.currentQuestion && 
          polledSession.currentQuestionIndex !== currentQuestionIndex) {
        setCurrentQuestion(polledSession.currentQuestion)
        setCurrentQuestionIndex(polledSession.currentQuestionIndex)
        setHasAnswered(false)
        
        if (onQuestionChange) {
          onQuestionChange(polledSession.currentQuestion, polledSession.currentQuestionIndex)
        }
      }
      
      // Check if game ended
      if (polledSession.status === 'finished' && gameStatus !== 'finished') {
        setGameStatus('finished')
        stopPolling()
        
        if (onGameEnd) {
          onGameEnd(polledSession)
        }
      }
    }
  }, [polledSession, currentQuestionIndex, gameStatus, onQuestionChange, onGameEnd, stopPolling])

  // Update poll error
  useEffect(() => {
    if (pollError) {
      setError(pollError)
    }
  }, [pollError])

  /**
   * Create a new multiplayer session (HOST)
   */
  const createSession = useCallback(async (hostName, questions) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await api.createSession(hostName, questions)
      
      setSessionId(result.sessionId)
      setRoomCode(result.roomCode)
      setPlayerId(result.hostId || result.playerId)
      setIsHost(true)
      setSession(result)
      setGameStatus('waiting')
      
      console.log('✅ Session created:', result.roomCode)
      
      return result
    } catch (err) {
      console.error('❌ Failed to create session:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Join an existing session (PLAYER)
   */
  const joinSession = useCallback(async (roomCode, playerName) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await api.joinSession(roomCode, playerName)
      
      setSessionId(result.sessionId)
      setRoomCode(roomCode)
      setPlayerId(result.playerId)
      setIsHost(false)
      setSession(result)
      setGameStatus('waiting')
      
      console.log('✅ Joined session:', roomCode)
      
      return result
    } catch (err) {
      console.error('❌ Failed to join session:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Start the quiz (HOST only)
   */
  const startQuiz = useCallback(async () => {
    if (!isHost || !sessionId) {
      throw new Error('Only the host can start the quiz')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await api.nextQuestion(sessionId)
      setGameStatus('playing')
      setCurrentQuestion(result.currentQuestion)
      setCurrentQuestionIndex(result.currentQuestionIndex)
      
      console.log('✅ Quiz started')
      
      return result
    } catch (err) {
      console.error('❌ Failed to start quiz:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isHost, sessionId])

  /**
   * Submit an answer
   */
  const submitAnswer = useCallback(async (answerIndex, timeSpent = 0) => {
    if (!sessionId || !playerId) {
      throw new Error('No active session')
    }
    
    if (hasAnswered) {
      console.warn('⚠️ Already answered this question')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await api.submitAnswer(sessionId, playerId, answerIndex, timeSpent)
      setHasAnswered(true)
      
      console.log('✅ Answer submitted:', answerIndex)
      
      return result
    } catch (err) {
      console.error('❌ Failed to submit answer:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [sessionId, playerId, hasAnswered])

  /**
   * Advance to next question (HOST only)
   */
  const nextQuestion = useCallback(async () => {
    if (!isHost || !sessionId) {
      throw new Error('Only the host can advance questions')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await api.nextQuestion(sessionId)
      
      if (result.finished) {
        setGameStatus('finished')
        stopPolling()
      } else {
        setCurrentQuestion(result.currentQuestion)
        setCurrentQuestionIndex(result.currentQuestionIndex)
        setHasAnswered(false)
      }
      
      console.log('✅ Advanced to next question')
      
      return result
    } catch (err) {
      console.error('❌ Failed to advance question:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isHost, sessionId, stopPolling])

  /**
   * Get leaderboard
   */
  const getLeaderboard = useCallback(async () => {
    if (!sessionId) {
      throw new Error('No active session')
    }
    
    try {
      const result = await api.getLeaderboard(sessionId)
      console.log('✅ Leaderboard fetched')
      return result
    } catch (err) {
      console.error('❌ Failed to get leaderboard:', err)
      throw err
    }
  }, [sessionId])

  /**
   * Leave session and cleanup
   */
  const leaveSession = useCallback(() => {
    stopPolling()
    setSession(null)
    setSessionId(null)
    setPlayerId(null)
    setRoomCode(null)
    setIsHost(false)
    setCurrentQuestion(null)
    setCurrentQuestionIndex(0)
    setPlayers([])
    setHasAnswered(false)
    setGameStatus('waiting')
    setError(null)
    
    console.log('👋 Left session')
  }, [stopPolling])

  return {
    // Session state
    session,
    sessionId,
    playerId,
    roomCode,
    isHost,
    
    // Game state
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
    
    // Polling controls
    startPolling,
    stopPolling,
    
    // Status
    loading,
    error
  }
}

export default useMultiplayer

