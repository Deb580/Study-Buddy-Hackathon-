import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import StudySet from './pages/StudySet'
import MultiplayerLobby from './pages/MultiplayerLobby'
import LiveQuiz from './pages/LiveQuiz'
import Results from './pages/Results'
// import DebugDashboard from './pages/DebugDashboard' // Has import issues
import DebugDashboardSimple from './pages/DebugDashboardSimple'
import DebugDashboardWorking from './pages/DebugDashboardWorking'
import TestPage from './pages/TestPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study/:setId" element={<StudySet />} />
          <Route path="/multiplayer" element={<MultiplayerLobby />} />
          <Route path="/live/:code" element={<LiveQuiz />} />
          <Route path="/quiz/:sessionId" element={<LiveQuiz />} />
          <Route path="/results/:sessionId" element={<Results />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/debug-working" element={<DebugDashboardWorking />} />
          <Route path="/debug" element={<DebugDashboardWorking />} />
          <Route path="/debug-simple" element={<DebugDashboardSimple />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
