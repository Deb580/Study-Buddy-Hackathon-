import React from 'react'

function SummaryCard({ summary }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Key Points Summary</h3>
      <div className="space-y-4">
        {summary.map((point, index) => (
          <div key={index} className="flex items-start">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
            </div>
            <p className="text-gray-700 leading-relaxed">{point}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SummaryCard
