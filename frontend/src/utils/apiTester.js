/**
 * API Testing Utility
 * Comprehensive endpoint testing for hackathon demo
 */

import * as api from '../services/api'

// Mock data for testing
const TEST_DATA = {
  notes: "Machine learning is a subset of artificial intelligence that focuses on training algorithms.",
  fileContent: "Test file content for upload testing",
  fileName: "test.txt",
  fileType: "text/plain",
  hostName: "Test Host",
  playerName: "Test Player",
  questions: [
    {
      question: "What is 2+2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1,
      explanation: "2+2 equals 4"
    }
  ],
  flashcards: [
    { term: "API", definition: "Application Programming Interface" },
    { term: "REST", definition: "Representational State Transfer" }
  ]
}

/**
 * Test individual endpoint
 */
const testEndpoint = async (name, testFn, description) => {
  console.log(`\n🧪 Testing: ${name}`)
  console.log(`📝 ${description}`)
  
  const startTime = Date.now()
  
  try {
    const result = await testFn()
    const duration = Date.now() - startTime
    
    console.log(`✅ SUCCESS (${duration}ms)`)
    console.log('Response:', result)
    
    return {
      name,
      description,
      status: 'success',
      duration,
      result,
      error: null
    }
  } catch (error) {
    const duration = Date.now() - startTime
    
    console.error(`❌ FAILED (${duration}ms)`)
    console.error('Error:', error.message)
    
    return {
      name,
      description,
      status: 'failed',
      duration,
      result: null,
      error: error.message
    }
  }
}

/**
 * Test all API endpoints
 */
export const testAllEndpoints = async () => {
  console.log('🚀 Starting API Integration Tests...\n')
  console.log('=' .repeat(60))
  
  const results = []
  
  // 1. Upload File
  results.push(await testEndpoint(
    'uploadFile',
    () => api.uploadFile(TEST_DATA.fileContent, TEST_DATA.fileName, TEST_DATA.fileType),
    'Upload and process file content'
  ))
  
  // 2. Generate Study Content
  results.push(await testEndpoint(
    'generateStudyContent',
    () => api.generateStudyContent(TEST_DATA.notes),
    'AI-powered content generation from notes'
  ))
  
  // 3. Create Session
  let sessionId, roomCode
  const createResult = await testEndpoint(
    'createSession',
    async () => {
      const result = await api.createSession(TEST_DATA.hostName, TEST_DATA.questions)
      sessionId = result.sessionId
      roomCode = result.roomCode
      return result
    },
    'Create a new quiz session'
  )
  results.push(createResult)
  
  // 4. Join Session (only if create succeeded)
  if (sessionId && roomCode) {
    let playerId
    const joinResult = await testEndpoint(
      'joinSession',
      async () => {
        const result = await api.joinSession(roomCode, TEST_DATA.playerName)
        playerId = result.playerId
        return result
      },
      'Join an existing session'
    )
    results.push(joinResult)
    
    // 5. Get Session
    results.push(await testEndpoint(
      'getSession',
      () => api.getSession(sessionId),
      'Retrieve session details'
    ))
    
    // 6. Submit Answer (only if we have playerId)
    if (playerId) {
      results.push(await testEndpoint(
        'submitAnswer',
        () => api.submitAnswer(sessionId, playerId, 1, 5),
        'Submit an answer to a question'
      ))
    }
    
    // 7. Next Question
    results.push(await testEndpoint(
      'nextQuestion',
      () => api.nextQuestion(sessionId),
      'Advance to next question'
    ))
    
    // 8. Get Leaderboard
    results.push(await testEndpoint(
      'getLeaderboard',
      () => api.getLeaderboard(sessionId),
      'Retrieve session leaderboard'
    ))
  }
  
  // 9. Upload Audio
  results.push(await testEndpoint(
    'uploadAudio',
    () => api.uploadAudio('test-audio.mp3', 1024000),
    'Upload audio file for transcription'
  ))
  
  // 10. Generate More Questions
  results.push(await testEndpoint(
    'generateMoreQuestions',
    () => api.generateMoreQuestions(TEST_DATA.notes, TEST_DATA.questions, 5),
    'Generate additional quiz questions'
  ))
  
  // 11. Export to Quizlet
  results.push(await testEndpoint(
    'exportToQuizlet',
    () => api.exportToQuizlet(TEST_DATA.flashcards),
    'Export flashcards to Quizlet format'
  ))
  
  // 12. Export to Kahoot
  results.push(await testEndpoint(
    'exportToKahoot',
    () => api.exportToKahoot(TEST_DATA.questions, 'Test Quiz'),
    'Export questions to Kahoot format'
  ))
  
  // 13. Export Study Guide
  results.push(await testEndpoint(
    'exportStudyGuide',
    () => api.exportStudyGuide({
      title: 'Test Study Guide',
      summary: 'Test summary',
      flashcards: TEST_DATA.flashcards,
      questions: TEST_DATA.questions
    }),
    'Generate study guide document'
  ))
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'failed').length
  const total = results.length
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total
  
  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${failed}/${total}`)
  console.log(`⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`)
  console.log(`🎯 Success Rate: ${((passed/total) * 100).toFixed(1)}%`)
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  
  return {
    results,
    summary: {
      total,
      passed,
      failed,
      avgDuration,
      successRate: (passed/total) * 100
    }
  }
}

/**
 * Test single endpoint by name
 */
export const testSingleEndpoint = async (endpointName, customData = {}) => {
  const data = { ...TEST_DATA, ...customData }
  
  const endpoints = {
    uploadFile: () => api.uploadFile(data.fileContent, data.fileName, data.fileType),
    generateStudyContent: () => api.generateStudyContent(data.notes),
    createSession: () => api.createSession(data.hostName, data.questions),
    joinSession: () => api.joinSession(data.roomCode, data.playerName),
    getSession: () => api.getSession(data.sessionId),
    submitAnswer: () => api.submitAnswer(data.sessionId, data.playerId, data.answer || 1, data.timeSpent || 5),
    nextQuestion: () => api.nextQuestion(data.sessionId),
    getLeaderboard: () => api.getLeaderboard(data.sessionId),
    uploadAudio: () => api.uploadAudio(data.fileName || 'test.mp3', data.fileSize || 1024000),
    getTranscriptionStatus: () => api.getTranscriptionStatus(data.jobId),
    generateMoreQuestions: () => api.generateMoreQuestions(data.notes, data.questions, data.count || 5),
    exportToQuizlet: () => api.exportToQuizlet(data.flashcards),
    exportToKahoot: () => api.exportToKahoot(data.questions, data.title || 'Test Quiz'),
    exportStudyGuide: () => api.exportStudyGuide(data.studyData || { flashcards: data.flashcards })
  }
  
  if (!endpoints[endpointName]) {
    throw new Error(`Endpoint "${endpointName}" not found`)
  }
  
  return await testEndpoint(
    endpointName,
    endpoints[endpointName],
    `Testing ${endpointName}`
  )
}

/**
 * Quick health check - test if backend is reachable
 */
export const healthCheck = async () => {
  console.log('🏥 Running Health Check...')
  
  try {
    // Try a simple endpoint
    await api.generateStudyContent("test")
    console.log('✅ Backend is reachable')
    return true
  } catch (error) {
    console.error('❌ Backend is not reachable:', error.message)
    return false
  }
}

export default {
  testAllEndpoints,
  testSingleEndpoint,
  healthCheck,
  TEST_DATA
}

