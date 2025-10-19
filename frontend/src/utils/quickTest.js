/**
 * Quick Test Script
 * Run this in browser console to quickly test the integration
 */

import { testAllEndpoints, healthCheck } from './apiTester'

// Quick health check
export const quickHealthCheck = async () => {
  console.log('🏥 Running Quick Health Check...')
  const isHealthy = await healthCheck()
  
  if (isHealthy) {
    console.log('✅ Backend is healthy!')
    console.log('🎯 You can proceed with the demo')
  } else {
    console.log('❌ Backend is not responding')
    console.log('📋 Troubleshooting steps:')
    console.log('1. Check if backend is running: ps aux | grep serverless')
    console.log('2. Restart backend: cd backend && npm run offline')
    console.log('3. Check port 3001 is not blocked')
  }
  
  return isHealthy
}

// Quick smoke test (just a few endpoints)
export const quickSmokeTest = async () => {
  console.log('💨 Running Quick Smoke Test...')
  console.log('Testing 3 critical endpoints...\n')
  
  const testSingleEndpoint = (await import('./apiTester')).testSingleEndpoint
  
  const results = []
  
  // Test 1: Generate Content (AI functionality)
  console.log('1️⃣ Testing AI Content Generation...')
  results.push(await testSingleEndpoint('generateStudyContent'))
  
  // Test 2: Create Session (Multiplayer functionality)
  console.log('\n2️⃣ Testing Session Creation...')
  results.push(await testSingleEndpoint('createSession'))
  
  // Test 3: Export (Export functionality)
  console.log('\n3️⃣ Testing Export...')
  results.push(await testSingleEndpoint('exportToQuizlet'))
  
  const passed = results.filter(r => r.status === 'success').length
  const total = results.length
  
  console.log('\n' + '='.repeat(50))
  console.log(`🎯 Smoke Test Complete: ${passed}/${total} passed`)
  console.log('='.repeat(50))
  
  if (passed === total) {
    console.log('✅ All critical features working!')
    console.log('🚀 Ready for demo!')
  } else {
    console.log('⚠️ Some features not working')
    console.log('Check the errors above and fix before demo')
  }
  
  return { passed, total, results }
}

// Demo flow test
export const testDemoFlow = async () => {
  console.log('🎬 Testing Complete Demo Flow...\n')
  
  const api = await import('../services/api')
  
  try {
    // 1. Generate content
    console.log('1️⃣ Generating study content...')
    const content = await api.generateStudyContent(
      'Machine learning is a subset of AI'
    )
    console.log('✅ Content generated:', content)
    
    // 2. Create session
    console.log('\n2️⃣ Creating multiplayer session...')
    const session = await api.createSession('Demo Host', content.questions || [
      {
        question: "What is ML?",
        options: ["AI", "Machine Learning", "Both", "Neither"],
        correctAnswer: 1
      }
    ])
    console.log('✅ Session created:', session.roomCode)
    
    // 3. Join session
    console.log('\n3️⃣ Joining session...')
    const player = await api.joinSession(session.roomCode, 'Demo Player')
    console.log('✅ Player joined:', player.playerId)
    
    // 4. Get session
    console.log('\n4️⃣ Getting session details...')
    const sessionDetails = await api.getSession(session.sessionId)
    console.log('✅ Session details:', sessionDetails)
    
    // 5. Export
    console.log('\n5️⃣ Exporting to Quizlet...')
    const exported = await api.exportToQuizlet(content.flashcards || [
      { term: 'AI', definition: 'Artificial Intelligence' }
    ])
    console.log('✅ Exported:', exported)
    
    console.log('\n' + '='.repeat(50))
    console.log('🎉 DEMO FLOW COMPLETE - ALL FEATURES WORKING!')
    console.log('='.repeat(50))
    
    return {
      success: true,
      sessionId: session.sessionId,
      roomCode: session.roomCode,
      playerId: player.playerId
    }
    
  } catch (error) {
    console.error('❌ Demo flow failed:', error)
    return { success: false, error: error.message }
  }
}

// Export for console use
if (typeof window !== 'undefined') {
  window.quickTest = {
    healthCheck: quickHealthCheck,
    smokeTest: quickSmokeTest,
    demoFlow: testDemoFlow
  }
  
  console.log('🧪 Quick Test Utils Loaded!')
  console.log('Available commands:')
  console.log('  window.quickTest.healthCheck() - Check backend health')
  console.log('  window.quickTest.smokeTest() - Run smoke tests')
  console.log('  window.quickTest.demoFlow() - Test complete demo flow')
}

export default {
  quickHealthCheck,
  quickSmokeTest,
  testDemoFlow
}

