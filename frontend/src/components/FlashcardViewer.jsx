import React, { useState } from 'react'

function FlashcardViewer({ flashcards }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Safety check
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <p className="text-gray-600">No flashcards available.</p>
      </div>
    )
  }

  const currentCard = flashcards[currentIndex]

  const nextCard = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length)
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Flashcards</h3>
        <div className="text-sm text-gray-500">
          {currentIndex + 1} of {flashcards.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-8">
        <div
          className="relative h-64 cursor-pointer"
          onClick={flipCard}
        >
          {/* Front of card (Question) */}
          <div
            className={`absolute inset-0 w-full h-full transition-all duration-500 ${
              isFlipped ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-white-600 rounded-lg shadow-lg flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-black-500 text-lg font-medium mb-2">QUESTION</div>
                <p className="text-black text-lg font-medium leading-relaxed">
                  {currentCard?.question || 'No question available'}
                </p>
              </div>
            </div>
          </div>

          {/* Back of card (Answer) */}
          <div
            className={`absolute inset-0 w-full h-full transition-all duration-500 ${
              isFlipped ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="w-full h-full bg-gradient-to-br from-pink-400 to-white-600 rounded-lg shadow-lg flex items-center justify-center p-6">
              <div className="text-center">
                <div className="text-black text-lg font-medium mb-2">ANSWER</div>
                <p className="text-black text-lg font-medium leading-relaxed">
                  {currentCard?.answer || 'No answer available'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Click the card to flip • {isFlipped ? 'Showing answer' : 'Showing question'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevCard}
          disabled={flashcards.length <= 1}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        <div className="flex space-x-2">
          {flashcards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index)
                setIsFlipped(false)
              }}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-blue-600'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextCard}
          disabled={flashcards.length <= 1}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default FlashcardViewer
