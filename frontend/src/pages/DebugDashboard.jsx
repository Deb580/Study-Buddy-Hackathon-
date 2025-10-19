import React, { useState, useEffect } from 'react'

// Import with proper error handling
console.log('🔍 DebugDashboard: Starting imports...')

const DebugDashboard = () => {
  const [testResults, setTestResults] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTest, setSelectedTest] = useState(null)
  const [customData, setCustomData] = useState({})
  const [backendStatus, setBackendStatus] = useState('checking')
  const [importError, setImportError] = useState(null)
  const [apiTester, setApiTester] = useState(null)

  console.log('🔍 DebugDashboard: Component rendering')

  // Load apiTester dynamically
  useEffect(() => {
    const loadApiTester = async () => {
      try {
        console.log('📦 Loading apiTester...')
        const module = await import('../utils/apiTester')
        console.log('✅ apiTester loaded:', module)
        setApiTester(module)
      } catch (error) {
        console.error('❌ Failed to import apiTester:', error)
        setImportError(error.message)
      }
    }
    loadApiTester()
  }, [])

  // Check backend health when apiTester loads
  useEffect(() => {
    if (!apiTester?.healthCheck) return
    
    const checkHealth = async () => {
      try {
        console.log('🏥 Checking backend health...')
        const isHealthy = await apiTester.healthCheck()
        console.log('🏥 Health check result:', isHealthy)
        setBackendStatus(isHealthy ? 'online' : 'offline')
      } catch (error) {
        console.error('❌ Health check failed:', error)
        setBackendStatus('offline')
      }
    }
    checkHealth()
  }, [apiTester])

  // Run all tests
  const runAllTests = async () => {
    if (!apiTester?.testAllEndpoints) {
      alert('Testing utilities not loaded. Check console for errors.')
      return
    }
    
    setLoading(true)
    setTestResults([])
    setSummary(null)
    
    try {
      console.log('🚀 Running all tests...')
      const { results, summary } = await apiTester.testAllEndpoints()
      console.log('✅ Tests complete:', results, summary)
      setTestResults(results)
      setSummary(summary)
    } catch (error) {
      console.error('❌ Test suite failed:', error)
      alert('Test suite failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Run single test
  const runSingleTest = async (endpointName) => {
    if (!apiTester?.testSingleEndpoint) {
      alert('Testing utilities not loaded')
      return
    }
    
    setLoading(true)
    
    try {
      console.log('🧪 Testing:', endpointName)
      const result = await apiTester.testSingleEndpoint(endpointName, customData)
      console.log('✅ Test result:', result)
      setTestResults([result])
      setSelectedTest(result)
    } catch (error) {
      console.error('❌ Test failed:', error)
      alert('Test failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // If there's an import error, show error message
  if (importError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Import Error</p>
            <p>{importError}</p>
            <p className="mt-2 text-sm">
              Try the minimal version: <a href="/debug-working" className="underline font-bold">Debug Working Dashboard</a>
            </p>
            <p className="mt-2 text-sm">Check browser console (F12) for more details.</p>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (!apiTester) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading testing utilities...</p>
        </div>
      </div>
    )
  }

  // Endpoints list
  const endpoints = [
    { name: 'uploadFile', method: 'POST', path: '/upload', description: 'Upload file content' },
    { name: 'generateStudyContent', method: 'POST', path: '/generate', description: 'Generate AI content' },
    { name: 'createSession', method: 'POST', path: '/session', description: 'Create quiz session' },
    { name: 'joinSession', method: 'POST', path: '/session/join', description: 'Join session' },
    { name: 'getSession', method: 'GET', path: '/session/{id}', description: 'Get session details' },
    { name: 'submitAnswer', method: 'POST', path: '/session/{id}/answer', description: 'Submit answer' },
    { name: 'nextQuestion', method: 'POST', path: '/session/{id}/next', description: 'Next question' },
    { name: 'getLeaderboard', method: 'GET', path: '/session/{id}/scores', description: 'Get leaderboard' },
    { name: 'uploadAudio', method: 'POST', path: '/upload/audio', description: 'Upload audio' },
    { name: 'getTranscriptionStatus', method: 'GET', path: '/transcription/{jobId}', description: 'Get transcription' },
    { name: 'generateMoreQuestions', method: 'POST', path: '/quiz/generate-more', description: 'Generate questions' },
    { name: 'exportToQuizlet', method: 'POST', path: '/export/quizlet/temp', description: 'Export to Quizlet' },
    { name: 'exportToKahoot', method: 'POST', path: '/export/kahoot', description: 'Export to Kahoot' },
    { name: 'exportStudyGuide', method: 'POST', path: '/export/study-guide', description: 'Export study guide' }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-300'
      case 'failed': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800'
      case 'POST': return 'bg-green-100 text-green-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔧 API Debug Dashboard</h1>
          <p className="text-gray-600">Test and monitor all API endpoints</p>
          
          {/* Backend Status */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Backend Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              backendStatus === 'online' ? 'bg-green-100 text-green-800' :
              backendStatus === 'offline' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {backendStatus === 'online' ? '✅ Online' :
               backendStatus === 'offline' ? '❌ Offline' :
               '⏳ Checking...'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-md transition-all"
          >
            {loading ? '⏳ Running Tests...' : '🚀 Run All Tests'}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-md transition-all"
          >
            🔄 Reset
          </button>
        </div>

        {/* Summary Card */}
        {summary && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">📊 Test Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{summary.total}</div>
                <div className="text-sm text-gray-600">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{summary.passed}</div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{summary.avgDuration.toFixed(0)}ms</div>
                <div className="text-sm text-gray-600">Avg Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{summary.successRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Endpoints List */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">📡 API Endpoints</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.name}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-gray-700">{endpoint.path}</code>
                    </div>
                    <button
                      onClick={() => runSingleTest(endpoint.name)}
                      disabled={loading}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 text-sm font-medium transition-all"
                    >
                      Test
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">📝 Test Results</h2>
            {testResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">🧪</div>
                <p>No tests run yet. Click "Run All Tests" or test individual endpoints.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {result.status === 'success' ? '✅' : '❌'}
                        </span>
                        <span className="font-bold">{result.name}</span>
                      </div>
                      <span className="text-sm font-medium">{result.duration}ms</span>
                    </div>
                    
                    <p className="text-sm mb-2">{result.description}</p>
                    
                    {result.status === 'success' && result.result && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium hover:underline">
                          View Response
                        </summary>
                        <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(result.result, null, 2)}
                        </pre>
                      </details>
                    )}
                    
                    {result.status === 'failed' && result.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded">
                        <p className="text-sm font-medium text-red-800">Error:</p>
                        <p className="text-xs text-red-700">{result.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugDashboard
