// src/services/api.js
import axios from 'axios'

// Base URL for API - will be set via environment variable
console.log('🔍 DEBUG: Environment loading check')
console.log('🔍 import.meta.env:', import.meta.env)
console.log('🔍 VITE_API_URL specifically:', import.meta.env.VITE_API_URL)
console.log('🔍 DEV mode:', import.meta.env.DEV)
console.log('🔍 MODE:', import.meta.env.MODE)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/dev'

console.log('🔍 Final API_BASE_URL being used:', API_BASE_URL)

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 second timeout for AI operations (Bedrock can take 30-45 seconds)
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', error)

    if (error.response) {
      const message = error.response.data?.error || error.response.data?.message || 'Server error'
      throw new Error(message)
    } else if (error.request) {
      throw new Error('Network error - please check your connection')
    } else {
      throw new Error(error.message || 'Unknown error occurred')
    }
  }
)

// ========================================================================
// File Upload & Study Content
// ========================================================================

/**
 * Upload file content and extract text
 */
export const uploadFile = async (fileContent, fileName, fileType) => {
  try {
    const response = await api.post('/upload', {
      fileContent,
      fileName,
      fileType
    })
    return response.data
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
}

/**
 * Generate AI study content from notes
 */
export const generateStudyContent = async (notes) => {
  try {
    const response = await api.post('/generate', { notes })
    return response.data
  } catch (error) {
    throw new Error(`AI generation failed: ${error.message}`)
  }
}

// ========================================================================
// Quiz Session (Single-Player)
// ========================================================================

/**
 * Create a new quiz session
 */
export const createSession = async (hostName, questions) => {
  try {
    const response = await api.post('/session', {
      hostName,
      questions
    })
    return response.data
  } catch (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }
}

/**
 * Join a quiz session by room code
 */
export const joinSession = async (roomCode, playerName) => {
  try {
    const response = await api.post('/session/join', {
      roomCode,
      playerName
    })
    return response.data
  } catch (error) {
    throw new Error(`Failed to join session: ${error.message}`)
  }
}

/**
 * Get session details
 */
export const getSession = async (sessionId) => {
  try {
    const response = await api.get(`/session/${sessionId}`)
    return response.data
  } catch (error) {
    throw new Error(`Failed to get session: ${error.message}`)
  }
}

/**
 * Submit an answer to a quiz question
 */
export const submitAnswer = async (sessionId, playerId, answer, timeSpent = 0) => {
  try {
    const response = await api.post(`/session/${sessionId}/answer`, {
      playerId,
      answer,
      timeSpent
    })
    return response.data
  } catch (error) {
    throw new Error(`Failed to submit answer: ${error.message}`)
  }
}

/**
 * Advance to the next question
 */
export const nextQuestion = async (sessionId) => {
  try {
    const response = await api.post(`/session/${sessionId}/next`)
    return response.data
  } catch (error) {
    throw new Error(`Failed to advance to next question: ${error.message}`)
  }
}

/**
 * Get leaderboard for a session
 */
export const getLeaderboard = async (sessionId) => {
  try {
    const response = await api.get(`/session/${sessionId}/scores`)
    return response.data
  } catch (error) {
    throw new Error(`Failed to get leaderboard: ${error.message}`)
  }
}

// ========================================================================
// Audio Upload & Transcription
// ========================================================================

export const uploadAudio = async (fileName, fileSize) => {
  try {
    const response = await api.post('/upload/audio', {
      fileName,
      fileSize
    })
    return response.data
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
}

export const getTranscriptionStatus = async (jobId) => {
  try {
    const response = await api.get(`/transcription/${jobId}`)
    return response.data
  } catch (error) {
    throw new Error(`Failed to get transcription status: ${error.message}`)
  }
}

// ========================================================================
// Dynamic Quiz Generation
// ========================================================================

export const generateMoreQuestions = async (originalContent, previousQuestions, count = 10) => {
  try {
    console.log('Generating', count, 'more questions...')
    console.log('Original content length:', originalContent?.length || 0)
    console.log('Previous questions count:', previousQuestions?.length || 0)

    const response = await api.post('/quiz/generate-more', {
      originalContent,
      previousQuestions,
      count
    })

    console.log('Response:', response.data)
    return response.data
  } catch (error) {
    console.error('Generate more questions error:', error)
    throw new Error(`Failed to generate questions: ${error.message}`)
  }
}

// ========================================================================
// Export Functions
// ========================================================================

export const exportToQuizlet = async (flashcards) => {
  try {
    const response = await api.post(
      '/export/quizlet/temp',
      { flashcards },
      {
        responseType: 'text',
        headers: {
          'Accept': 'text/csv'
        }
      }
    )
    return response.data
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`)
  }
}

export const exportToKahoot = async (questions, title, format = 'json') => {
  try {
    const response = await api.post(
      `/export/kahoot?format=${format}`,
      { questions, title },
      {
        responseType: 'text',
        headers: {
          'Accept': format === 'excel' ? 'text/csv' : 'application/json'
        }
      }
    )
    return response.data
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`)
  }
}

export const exportStudyGuide = async (studyData, title = 'AI Study Guide') => {
  try {
    const response = await api.post(
      '/export/study-guide',
      { studyData, title },
      {
        responseType: 'text',
        headers: {
          'Accept': 'text/markdown'
        }
      }
    )
    return response.data
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`)
  }
}

// ========================================================================
// MULTIPLAYER SUPPORT
// ========================================================================

export const MULTIPLAYER_ENABLED =
  String(import.meta.env.VITE_MULTIPLAYER_ENABLED || '').toLowerCase() === 'true'

class MultiplayerDisabledError extends Error {
  constructor() {
    super('MULTIPLAYER_DISABLED')
    this.name = 'MultiplayerDisabledError'
    this.code = 'MULTIPLAYER_DISABLED'
  }
}

/**
 * Create a multiplayer room
 */
export async function createRoom({ setId, hostName, questions = [] }) {
  if (!MULTIPLAYER_ENABLED) throw new MultiplayerDisabledError()
  console.log('Creating room with', questions.length, 'questions')
  const res = await api.post('/multiplayer/rooms', { setId, hostName, questions })
  return res.data
}

/**
 * Join an existing room
 */
export async function joinRoom({ code, playerName }) {
  if (!MULTIPLAYER_ENABLED) throw new MultiplayerDisabledError()
  const res = await api.post(`/multiplayer/rooms/${code}/join`, { playerName })
  return res.data
}

/**
 * Get room state (polling)
 */
export async function getRoom(code) {
  if (!MULTIPLAYER_ENABLED) throw new MultiplayerDisabledError()
  const res = await api.get(`/multiplayer/rooms/${code}`)
  return res.data
}

/**
 * Start game as host
 */
export async function startRoom(code) {
  if (!MULTIPLAYER_ENABLED) throw new MultiplayerDisabledError()
  const res = await api.post(`/multiplayer/rooms/${code}/start`)
  return res.data
}

/**
 * Leave a multiplayer room
 */
export async function leaveRoom(code, playerName) {
  if (!MULTIPLAYER_ENABLED) throw new MultiplayerDisabledError()
  const res = await api.post(`/multiplayer/rooms/${code}/leave`, { playerName })
  return res.data
}

/**
 * Submit an answer during a multiplayer quiz
 */
export async function multiplayerSubmitAnswer({ code, playerName, isCorrect }) {
  if (!MULTIPLAYER_ENABLED) throw new MultiplayerDisabledError()
  const res = await api.post(`/multiplayer/rooms/${code}/answer`, { playerName, isCorrect })
  return res.data
}

/**
 * Advance to the next question (host only)
 */
export async function multiplayerNextQuestion(code) {
  if (!MULTIPLAYER_ENABLED) throw new MultiplayerDisabledError()
  const res = await api.post(`/multiplayer/rooms/${code}/next`)
  return res.data
}

export default api


