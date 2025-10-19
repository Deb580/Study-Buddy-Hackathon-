// src/pages/MultiplayerLobby.jsx
import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import {
  createRoom,
  joinRoom,
  getRoom,
  startRoom,
  leaveRoom,
  MULTIPLAYER_ENABLED,
} from '../services/api'
import { Users, Play, DoorOpen, Copy, Crown, Hash, ArrowLeft } from 'lucide-react'

// Small leaderboard component
function Leaderboard({ players }) {
  const sorted = useMemo(
    () => [...(players || [])].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [players]
  )
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Leaderboard</h3>
      </div>
      <ul className="divide-y divide-gray-100">
        {sorted.length === 0 && (
          <li className="py-4 text-gray-500 text-sm">No players yet.</li>
        )}
        {sorted.map((p, idx) => (
          <li key={p.id || p.name + idx} className="py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {idx === 0 && <Crown className="w-4 h-4 text-amber-500" />}
              <span className="font-medium text-gray-800">{p.name}</span>
            </div>
            <span className="text-gray-600">{p.score ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}


export default function MultiplayerLobby({ studyId: studyIdProp, fileName }) {
  const navigate = useNavigate()
  const params = useParams()
  const location = useLocation()
  const studyId = studyIdProp || params.setId || ''

  const fromHome = location.state?.fromHome === true


  const handleBack = React.useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
    } else if (studyId) {
      navigate(`/study/${studyId}`)
    } else {
      navigate('/')
    }
  }, [navigate, studyId])

  const [mode, setMode] = useState(fromHome ? 'join' : 'host')
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [room, setRoom] = useState(null)
  const pollingRef = useRef(null)

  // Poll the room every 3 seconds (optimized with ref to prevent memory leaks)
  useEffect(() => {
    if (!room?.code || !MULTIPLAYER_ENABLED) return

    const pollRoom = async () => {
      try {
        const updated = await getRoom(room.code)
        setRoom(prev => {
          // Only update if data actually changed to prevent unnecessary re-renders
          if (JSON.stringify(prev) !== JSON.stringify(updated)) {
            return updated
          }
          return prev
        })
      } catch (e) {
        console.warn('Polling failed:', e.message)
      }
    }

    pollingRef.current = setInterval(pollRoom, 3000)
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [room?.code])

  // Auto-navigate guests to live quiz when host starts the game
  useEffect(() => {
    if (!room || !name) return

    // If room status changed to 'playing', navigate to live quiz
    if (room.status === 'playing') {
      console.log('Game started! Navigating to live quiz...')
      sessionStorage.setItem(`mp_player_${room.code}`, name)
      navigate(`/live/${room.code}`, { state: { playerName: name } })
    }
  }, [room?.status, room?.code, name, navigate])

  // If multiplayer not yet connected
  if (!MULTIPLAYER_ENABLED) {
    return (
      <div className="min-h-[50vh] bg-transparent">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-semibold text-gray-900">Multiplayer</h1>
              {fromHome && (
                <button
                  onClick={handleBack}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}

            </div>
            <p className="text-gray-600">
              Multiplayer is coming soon! The UI will connect automatically once the backend is live.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <button className="px-5 py-3 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                Host Game
              </button>
              <button className="px-5 py-3 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed">
                Join Game
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Tip: set <code>VITE_MULTIPLAYER_ENABLED=true</code> in <code>.env</code> and restart dev server.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // API actions (memoized with useCallback to prevent unnecessary re-renders)
  const enterAsHost = useCallback(async () => {
    if (!name.trim()) return setError('Enter your display name.')
    setIsBusy(true); setError('')
    try {
      // Debug: log all sessionStorage keys
      console.log('🔍 DEBUG: Looking for studyId:', studyId)
      console.log('🔍 DEBUG: All sessionStorage keys:', Object.keys(sessionStorage))

      // Load questions from sessionStorage to include in room
      const studyData = sessionStorage.getItem(studyId)
      let questions = []
      if (studyData) {
        const parsed = JSON.parse(studyData)
        console.log('🔍 DEBUG: Parsed study data:', parsed)
        questions = parsed.content?.quiz || []
        console.log('✅ Loaded', questions.length, 'questions for multiplayer room')
        if (questions.length > 0) {
          console.log('🔍 DEBUG: First question:', questions[0])
        }
      } else {
        console.error('❌ No study data found in sessionStorage for studyId:', studyId)
        setError('No study data found. Please go to a study set first, then start multiplayer from there.')
      }

      const r = await createRoom({ setId: studyId, hostName: name, questions })
      setRoom(r)
      setRoomCode(r.code)
    } catch (e) {
      setError(e.message || 'Failed to create room.')
    } finally { setIsBusy(false) }
  }, [name, studyId])

  const enterAsGuest = useCallback(async () => {
    if (!name.trim()) return setError('Enter your name.')
    if (!roomCode.trim()) return setError('Enter a room code.')
    setIsBusy(true); setError('')
    try {
      const r = await joinRoom({ code: roomCode.trim(), playerName: name })
      setRoom(r)
    } catch (e) {
      setError(e.message || 'Failed to join room.')
    } finally { setIsBusy(false) }
  }, [name, roomCode])

  const startGame = useCallback(async () => {
    if (!room?.code) return
    try {
      const r = await startRoom(room.code)
      setRoom(r)
      // Save player name and navigate with state
      sessionStorage.setItem(`mp_player_${room.code}`, name)
      navigate(`/live/${room.code}`, { state: { playerName: name } })
    } catch (e) {
      setError(e.message || 'Could not start game.')
    }
  }, [room?.code, name, navigate])


  const onLeave = useCallback(async () => {
    try {
      if (room?.code) await leaveRoom(room.code, name)
    } finally {
      setRoom(null)
      navigate(`/study/${studyId}`)
    }
  }, [room?.code, name, navigate, studyId])

  const copyCode = useCallback(() => {
    if (!room?.code) return
    navigator.clipboard.writeText(room.code)
      .then(() => {
        // Optional: show a toast or temporary message
        console.log('Room code copied!')
      })
      .catch(err => console.error('Failed to copy:', err))
  }, [room?.code])

  // Room view
  if (room?.code) {
    const isHost = room.host === name
    return (
      <div className="bg-transparent">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Multiplayer Lobby</h1>
                <p className="text-gray-600">
                  Study Set: <span className="font-medium">{fileName || studyId}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {fromHome && (
                  <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}

                <button
                  onClick={onLeave}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  <DoorOpen className="w-4 h-4" /> Leave
                </button>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-indigo-600" />
                    <div>
                      <p className="text-sm text-indigo-700">Room Code</p>
                      <p className="text-2xl font-bold tracking-widest text-indigo-900">{room.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-gray-700 border hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" /> Copy
                  </button>
                </div>

                <Leaderboard players={room.players} />
              </div>

              <div className="md:col-span-1">
                <div className="bg-white rounded-xl shadow p-4">
                  <p className="text-sm text-gray-500 mb-2">You are signed in as</p>
                  <p className="text-lg font-semibold text-gray-900">{name}</p>
                  <p className="text-sm text-gray-500">Role: {isHost ? 'Host' : 'Player'}</p>

                  <div className="mt-6">
                    <button
                      disabled={!isHost || (room.players?.length || 0) < 2}
                      onClick={startGame}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white ${isHost && (room.players?.length || 0) >= 2
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-300 cursor-not-allowed'
                        }`}
                    >
                      <Play className="w-5 h-5" />
                      Start Quiz
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Need at least 2 players to start.</p>
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="mt-4 text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    )
  }

  // Pre-room: Host / Join
  return (
    <div className="bg-transparent">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Multiplayer</h1>
            {fromHome && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

          </div>

          <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-6">
            {(location.state?.fromHome ? ['join'] : ['host', 'join']).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-md font-medium ${mode === m ? 'bg-white shadow' : 'text-gray-600'
                  }`}
              >
                {m === 'host' ? 'Host Game' : 'Join Game'}
              </button>
            ))}
          </div>


          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Alex"
              />
            </div>

            {mode === 'join' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
                <input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 tracking-widest text-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123456"
                  maxLength={6}
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-600 mt-3">{error}</p>}

          <div className="mt-6 flex gap-3">
            {(!location.state?.fromHome && mode === 'host') ? (
              <button
                disabled={isBusy}
                onClick={enterAsHost}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Play className="w-5 h-5" /> Create Room
              </button>
            ) : (
              <button
                disabled={isBusy}
                onClick={enterAsGuest}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Play className="w-5 h-5" /> Join Room
              </button>
            )}

            {fromHome && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}


          </div>
        </div>
      </div>
    </div>
  )
}

