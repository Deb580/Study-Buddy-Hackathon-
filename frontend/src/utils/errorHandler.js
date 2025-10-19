/**
 * Centralized Error Handling Utility
 * Provides user-friendly error messages and toast notifications
 */

/**
 * Error types for categorization
 */
export const ErrorTypes = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTH: 'authentication',
  NOT_FOUND: 'not_found',
  SERVER: 'server',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  network: '🌐 Network error. Please check your internet connection.',
  validation: '⚠️ Please check your input and try again.',
  authentication: '🔒 Authentication failed. Please log in again.',
  not_found: '🔍 The requested resource was not found.',
  server: '🔧 Server error. Please try again later.',
  timeout: '⏱️ Request timed out. Please try again.',
  unknown: '❌ Something went wrong. Please try again.'
}

/**
 * Categorize error based on error object
 */
export const categorizeError = (error) => {
  const message = error.message?.toLowerCase() || ''
  
  if (message.includes('network') || message.includes('connection')) {
    return ErrorTypes.NETWORK
  }
  
  if (message.includes('timeout') || message.includes('timed out')) {
    return ErrorTypes.TIMEOUT
  }
  
  if (message.includes('not found') || message.includes('404')) {
    return ErrorTypes.NOT_FOUND
  }
  
  if (message.includes('unauthorized') || message.includes('401') || message.includes('403')) {
    return ErrorTypes.AUTH
  }
  
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorTypes.VALIDATION
  }
  
  if (message.includes('server') || message.includes('500') || message.includes('502') || message.includes('503')) {
    return ErrorTypes.SERVER
  }
  
  return ErrorTypes.UNKNOWN
}

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error, context = '') => {
  const type = categorizeError(error)
  const baseMessage = ERROR_MESSAGES[type]
  
  if (context) {
    return `${baseMessage}\n\nContext: ${context}`
  }
  
  return baseMessage
}

/**
 * Handle error with logging and user feedback
 */
export const handleError = (error, options = {}) => {
  const {
    context = '',
    showToast = false,
    logToConsole = true,
    onError = null
  } = options
  
  const type = categorizeError(error)
  const message = getUserFriendlyMessage(error, context)
  
  // Log to console
  if (logToConsole) {
    console.group('🚨 Error Handler')
    console.error('Type:', type)
    console.error('Message:', message)
    console.error('Original Error:', error)
    if (context) console.error('Context:', context)
    console.groupEnd()
  }
  
  // Show toast notification (if toast library is available)
  if (showToast && window.toast) {
    window.toast.error(message)
  }
  
  // Custom error callback
  if (onError) {
    onError({ type, message, originalError: error })
  }
  
  return {
    type,
    message,
    originalError: error
  }
}

/**
 * Async error wrapper for API calls
 */
export const withErrorHandling = async (asyncFn, options = {}) => {
  try {
    return await asyncFn()
  } catch (error) {
    const errorInfo = handleError(error, options)
    throw errorInfo
  }
}

/**
 * React error boundary error handler
 */
export const handleBoundaryError = (error, errorInfo) => {
  console.group('🛑 React Error Boundary')
  console.error('Error:', error)
  console.error('Component Stack:', errorInfo.componentStack)
  console.groupEnd()
  
  // You could send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Create a simple toast notification system
 */
export const createToast = () => {
  const container = document.getElementById('toast-container') || createToastContainer()
  
  const show = (message, type = 'info', duration = 5000) => {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.style.cssText = `
      position: relative;
      padding: 1rem 1.5rem;
      margin-bottom: 0.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      max-width: 400px;
    `
    
    const colors = {
      success: 'background: #10b981; color: white;',
      error: 'background: #ef4444; color: white;',
      warning: 'background: #f59e0b; color: white;',
      info: 'background: #3b82f6; color: white;'
    }
    
    toast.style.cssText += colors[type] || colors.info
    toast.textContent = message
    
    container.appendChild(toast)
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-in'
      setTimeout(() => container.removeChild(toast), 300)
    }, duration)
  }
  
  return {
    success: (msg, duration) => show(msg, 'success', duration),
    error: (msg, duration) => show(msg, 'error', duration),
    warning: (msg, duration) => show(msg, 'warning', duration),
    info: (msg, duration) => show(msg, 'info', duration)
  }
}

const createToastContainer = () => {
  const container = document.createElement('div')
  container.id = 'toast-container'
  container.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
  `
  
  // Add animations
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
  document.body.appendChild(container)
  
  return container
}

// Initialize toast system
if (typeof window !== 'undefined') {
  window.toast = createToast()
}

/**
 * Validation helpers
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName} is required`)
  }
}

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address')
  }
}

export const validateRoomCode = (code) => {
  if (!code || code.length !== 6) {
    throw new Error('Room code must be 6 characters')
  }
}

export default {
  ErrorTypes,
  categorizeError,
  getUserFriendlyMessage,
  handleError,
  withErrorHandling,
  handleBoundaryError,
  validateRequired,
  validateEmail,
  validateRoomCode
}

