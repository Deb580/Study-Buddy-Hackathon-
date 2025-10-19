import React, { useState } from 'react'
import { Sparkles, Loader2, Zap } from 'lucide-react'
import { generateMoreQuestions as generateMoreQuestionsAPI } from '../services/api'

export default function DynamicQuizController({
  originalContent,
  currentQuestions,
  onNewQuestions
}) {
  const [generating, setGenerating] = useState(false)
  const [totalAsked, setTotalAsked] = useState(currentQuestions.length)
  const [lastGenerated, setLastGenerated] = useState(0)
  const [error, setError] = useState('')

  const handleGenerateMore = async () => {
    setGenerating(true)
    setError('')

    try {
      console.log('Starting question generation...')
      const result = await generateMoreQuestionsAPI(
        originalContent,
        currentQuestions,
        10
      )

      if (result.success && result.questions) {
        console.log('Successfully generated', result.questions.length, 'questions')
        onNewQuestions(result.questions)
        setTotalAsked(result.totalGenerated)
        setLastGenerated(result.questions.length)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate questions')
      alert('Failed to generate questions: ' + (err.message || 'Unknown error'))
    } finally {
      setGenerating(false)
    }
  }

  const getDifficultyDistribution = () => {
    const difficulties = currentQuestions.reduce((acc, q) => {
      acc[q.difficulty] = (acc[q.difficulty] || 0) + 1
      return acc
    }, {})
    return difficulties
  }

  const difficulties = getDifficultyDistribution()

  return (
    <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-xl p-6 border-2 border-pink-200 shadow-lg">
      <div className="flex-1">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Available</p>
            <p className="text-2xl font-bold text-pink-600">{currentQuestions.length}</p>
          </div>
          
          <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Generated</p>
            <p className="text-2xl font-bold text-blue-600">{totalAsked}</p>
          </div>
          
          <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Last Batch</p>
            <p className="text-2xl font-bold text-green-600">{lastGenerated}</p>
          </div>
          
          <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Difficulty Mix</p>
            <p className="text-sm font-medium text-gray-700">
              {difficulties.easy || 0}E / {difficulties.medium || 0}M / {difficulties.hard || 0}H
            </p>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateMore}
          disabled={generating}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-xl font-semibold hover:from-pink-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {generating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>AI is thinking... (this may take 30-45 seconds)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate 10 More Questions</span>
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

