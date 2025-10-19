import React, { useState } from 'react'
import { Download, ExternalLink, FileText, Brain, BookOpen, Zap } from 'lucide-react'
import { exportToQuizlet, exportToKahoot, exportStudyGuide } from '../services/api'

export default function ExportMenu({ flashcards, questions, studyData }) {
  const [exporting, setExporting] = useState({})
  const [showSuccess, setShowSuccess] = useState('')

  const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async (type, format = null) => {
    const exportKey = `${type}${format ? `-${format}` : ''}`
    setExporting(prev => ({ ...prev, [exportKey]: true }))

    try {
      let content, fileName, mimeType

      switch (type) {
        case 'quizlet':
          content = await exportToQuizlet(flashcards)
          fileName = 'quizlet-import.csv'
          mimeType = 'text/csv'
          break

        case 'kahoot':
          content = await exportToKahoot(questions, 'AI Generated Quiz', format)
          fileName = `kahoot-import.${format === 'excel' ? 'csv' : 'json'}`
          mimeType = format === 'excel' ? 'text/csv' : 'application/json'
          break

        case 'study-guide':
          content = await exportStudyGuide(studyData, 'AI Study Guide')
          fileName = 'study-guide.md'
          mimeType = 'text/markdown'
          break

        default:
          throw new Error('Unknown export type')
      }

      downloadFile(content, fileName, mimeType)

      setShowSuccess(exportKey)
      setTimeout(() => setShowSuccess(''), 3000)

    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed: ' + error.message)
    } finally {
      setExporting(prev => ({ ...prev, [exportKey]: false }))
    }
  }

  const exportOptions = [
    {
      id: 'quizlet',
      title: 'Export to Quizlet',
      description: 'Download flashcards as CSV for easy import',
      icon: Brain,
      color: 'blue',
      count: flashcards?.length || 0,
      format: 'CSV',
      action: () => handleExport('quizlet')
    },
    {
      id: 'kahoot-json',
      title: 'Export to Kahoot (JSON)',
      description: 'Download quiz as JSON for Kahoot import',
      icon: Zap,
      color: 'purple',
      count: questions?.length || 0,
      format: 'JSON',
      action: () => handleExport('kahoot', 'json')
    },
    {
      id: 'kahoot-excel',
      title: 'Export to Kahoot (Excel)',
      description: 'Download quiz as CSV for Excel/Kahoot',
      icon: FileText,
      color: 'green',
      count: questions?.length || 0,
      format: 'CSV',
      action: () => handleExport('kahoot', 'excel')
    },
    {
      id: 'study-guide',
      title: 'Download Study Guide',
      description: 'Complete study guide with all content',
      icon: BookOpen,
      color: 'indigo',
      count: 'All',
      format: 'Markdown',
      action: () => handleExport('study-guide')
    }
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Export Study Materials</h3>
        <p className="text-gray-600">
          Download your study content in various formats to use with your favorite study tools
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {exportOptions.map((option) => {
          const Icon = option.icon
          const isExporting = exporting[option.id]
          const isSuccess = showSuccess === option.id
          const colorClasses = {
            blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
            purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
            green: 'border-green-200 hover:border-green-400 hover:bg-green-50',
            indigo: 'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'
          }

          return (
            <div
              key={option.id}
              className={`relative border-2 rounded-xl p-6 transition-all duration-200 cursor-pointer group ${
                colorClasses[option.color]
              } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={isExporting ? undefined : option.action}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    option.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' :
                    option.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' :
                    option.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' :
                    'bg-indigo-100 group-hover:bg-indigo-200'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      option.color === 'blue' ? 'text-blue-600' :
                      option.color === 'purple' ? 'text-purple-600' :
                      option.color === 'green' ? 'text-green-600' :
                      'text-indigo-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-700">
                      {option.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {option.count} items • {option.format} format
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isExporting && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  )}
                  {isSuccess && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {!isExporting && !isSuccess && (
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {option.description}
              </p>

              {isSuccess && (
                <div className="absolute inset-0 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <p className="text-green-700 font-medium">Downloaded!</p>
                  </div>
                </div>
              )}

              {isExporting && (
                <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 font-medium">Preparing download...</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Integration Tips */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Integration Tips
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium mb-1">Quizlet:</p>
            <p>Import the CSV file directly into Quizlet for instant flashcards</p>
          </div>
          <div>
            <p className="font-medium mb-1">Kahoot:</p>
            <p>Use the JSON file for direct import, or CSV for manual setup</p>
          </div>
          <div>
            <p className="font-medium mb-1">Study Guide:</p>
            <p>Markdown format works with Notion, Obsidian, and most note apps</p>
          </div>
          <div>
            <p className="font-medium mb-1">Custom Use:</p>
            <p>All formats are open and can be modified for your needs</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-gray-900">{flashcards?.length || 0}</p>
          <p className="text-sm text-gray-600">Flashcards</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-gray-900">{questions?.length || 0}</p>
          <p className="text-sm text-gray-600">Quiz Questions</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-gray-900">4</p>
          <p className="text-sm text-gray-600">Export Formats</p>
        </div>
      </div>
    </div>
  )
}
