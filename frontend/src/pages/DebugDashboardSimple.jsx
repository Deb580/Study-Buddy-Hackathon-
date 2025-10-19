import React, { useState } from 'react'

/**
 * Simple Debug Dashboard - Minimal version for testing
 */
const DebugDashboardSimple = () => {
  const [message, setMessage] = useState('Debug Dashboard Loaded!')

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🔧 Debug Dashboard (Simple)
        </h1>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <p className="text-lg mb-4">{message}</p>
          <button
            onClick={() => setMessage('Button clicked at ' + new Date().toLocaleTimeString())}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Test Button
          </button>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm">
              ✅ If you see this, React is working!
            </p>
            <p className="text-sm mt-2">
              The full debug dashboard might have import errors.
              Check browser console (F12) for details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugDashboardSimple

