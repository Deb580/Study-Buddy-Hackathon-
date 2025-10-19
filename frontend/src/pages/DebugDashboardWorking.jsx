import React, { useState } from 'react'

/**
 * Minimal Working Debug Dashboard - No external dependencies
 * Tests API endpoints directly with fetch
 */
const DebugDashboardWorking = () => {
  const [results, setResults] = useState([])
  const [testing, setTesting] = useState(false)
  const [backendStatus, setBackendStatus] = useState('unknown')

  // Inline test function - no imports needed
  const testEndpoint = async (name, url, method = 'POST', body = null) => {
    console.log(`Testing: ${name}`)
    const startTime = Date.now()
    
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      }
      
      if (body && method === 'POST') {
        options.body = JSON.stringify(body)
      }
      
      const response = await fetch(url, options)
      const duration = Date.now() - startTime
      const data = await response.json()
      
      return {
        name,
        status: response.ok ? 'success' : 'failed',
        duration,
        statusCode: response.status,
        data: response.ok ? data : null,
        error: response.ok ? null : (data.error || data.message || 'Request failed')
      }
    } catch (error) {
      const duration = Date.now() - startTime
      return {
        name,
        status: 'failed',
        duration,
        statusCode: 0,
        data: null,
        error: error.message
      }
    }
  }

  // Check backend health
  const checkHealth = async () => {
    try {
      const result = await testEndpoint(
        'Health Check',
        'http://localhost:3001/dev/generate',
        'POST',
        { notes: 'test' }
      )
      setBackendStatus(result.status === 'success' ? 'online' : 'offline')
      return result.status === 'success'
    } catch (error) {
      setBackendStatus('offline')
      return false
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setTesting(true)
    setResults([])
    
    const API_BASE = 'http://localhost:3001/dev'
    const testResults = []
    
    console.log('🧪 Starting API Tests...')
    
    // Test 1: Generate Content
    testResults.push(await testEndpoint(
      'generateStudyContent',
      `${API_BASE}/generate`,
      'POST',
      { notes: 'Machine learning is a subset of AI' }
    ))
    
    // Test 2: Upload File
    testResults.push(await testEndpoint(
      'uploadFile',
      `${API_BASE}/upload`,
      'POST',
      { fileContent: 'test', fileName: 'test.txt', fileType: 'text/plain' }
    ))
    
    // Test 3: Create Session
    const sessionResult = await testEndpoint(
      'createSession',
      `${API_BASE}/session`,
      'POST',
      {
        hostName: 'Test Host',
        questions: [{
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctAnswer: 1
        }]
      }
    )
    testResults.push(sessionResult)
    
    // If session created, test join
    if (sessionResult.status === 'success' && sessionResult.data?.roomCode) {
      testResults.push(await testEndpoint(
        'joinSession',
        `${API_BASE}/session/join`,
        'POST',
        { roomCode: sessionResult.data.roomCode, playerName: 'Test Player' }
      ))
      
      // Test get session
      if (sessionResult.data?.sessionId) {
        testResults.push(await testEndpoint(
          'getSession',
          `${API_BASE}/session/${sessionResult.data.sessionId}`,
          'GET'
        ))
      }
    }
    
    // Test export endpoints
    testResults.push(await testEndpoint(
      'exportToQuizlet',
      `${API_BASE}/export/quizlet/temp`,
      'POST',
      { flashcards: [{ term: 'Test', definition: 'Definition' }] }
    ))
    
    testResults.push(await testEndpoint(
      'exportToKahoot',
      `${API_BASE}/export/kahoot`,
      'POST',
      {
        questions: [{
          question: 'Test?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 0
        }],
        title: 'Test Quiz'
      }
    ))
    
    setResults(testResults)
    setTesting(false)
    
    // Summary
    const passed = testResults.filter(r => r.status === 'success').length
    const total = testResults.length
    console.log(`✅ Tests Complete: ${passed}/${total} passed`)
  }

  React.useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Debug Dashboard (Working)
          </h1>
          <p style={{ color: '#6b7280' }}>
            Minimal version - no external dependencies
          </p>
          
          {/* Backend Status */}
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: '500' }}>Backend Status:</span>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              background: backendStatus === 'online' ? '#d1fae5' : backendStatus === 'offline' ? '#fee2e2' : '#fef3c7',
              color: backendStatus === 'online' ? '#065f46' : backendStatus === 'offline' ? '#991b1b' : '#92400e'
            }}>
              {backendStatus === 'online' ? '✅ Online' :
               backendStatus === 'offline' ? '❌ Offline' :
               '⏳ Checking...'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={runAllTests}
            disabled={testing}
            style={{
              padding: '0.75rem 1.5rem',
              background: testing ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              cursor: testing ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            {testing ? '⏳ Testing...' : '🚀 Run All Tests'}
          </button>
          
          <button
            onClick={checkHealth}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            🏥 Check Health
          </button>
          
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            🔄 Reset
          </button>
        </div>

        {/* Results */}
        <div style={{ background: 'white', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Test Results
          </h2>
          
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧪</div>
              <p>No tests run yet. Click "Run All Tests" to begin.</p>
            </div>
          ) : (
            <div>
              {/* Summary */}
              <div style={{ 
                padding: '1rem', 
                background: '#f3f4f6', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-around'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {results.length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                    {results.filter(r => r.status === 'success').length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Passed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                    {results.filter(r => r.status === 'failed').length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Failed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                    {Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)}ms
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Avg Time</div>
                </div>
              </div>
              
              {/* Individual Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {results.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '1rem',
                      border: '2px solid',
                      borderColor: result.status === 'success' ? '#d1fae5' : '#fee2e2',
                      background: result.status === 'success' ? '#f0fdf4' : '#fef2f2',
                      borderRadius: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>
                          {result.status === 'success' ? '✅' : '❌'}
                        </span>
                        <span style={{ fontWeight: 'bold' }}>{result.name}</span>
                        <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          ({result.statusCode})
                        </span>
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {result.duration}ms
                      </span>
                    </div>
                    
                    {result.error && (
                      <div style={{ 
                        marginTop: '0.5rem', 
                        padding: '0.5rem', 
                        background: '#fee2e2', 
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem',
                        color: '#991b1b'
                      }}>
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                    
                    {result.data && (
                      <details style={{ marginTop: '0.5rem' }}>
                        <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: '500' }}>
                          View Response
                        </summary>
                        <pre style={{ 
                          marginTop: '0.5rem', 
                          padding: '0.5rem', 
                          background: 'white', 
                          borderRadius: '0.25rem', 
                          fontSize: '0.75rem',
                          overflow: 'auto'
                        }}>
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: '#fef3c7', 
          border: '1px solid #fbbf24',
          borderRadius: '0.5rem'
        }}>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>
            <strong>💡 This is the minimal working version.</strong> If this works, the issue with the full dashboard is in the imports or dependencies.
          </p>
        </div>
      </div>
    </div>
  )
}

export default DebugDashboardWorking

