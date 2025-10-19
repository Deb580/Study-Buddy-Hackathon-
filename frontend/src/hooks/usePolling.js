import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Custom hook for polling data at regular intervals
 * 
 * @param {Function} fetchFn - Function to call for fetching data
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Polling interval in milliseconds (default: 2000)
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 * @param {Function} options.shouldStop - Function that receives data and returns true to stop polling
 * @param {Function} options.onSuccess - Callback when fetch succeeds
 * @param {Function} options.onError - Callback when fetch fails
 * @param {Array} options.dependencies - Dependencies that trigger re-polling
 * 
 * @returns {Object} { data, loading, error, startPolling, stopPolling, refetch }
 */
export const usePolling = (fetchFn, options = {}) => {
  const {
    interval = 2000,
    enabled = true,
    shouldStop = null,
    onSuccess = null,
    onError = null,
    dependencies = []
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPolling, setIsPolling] = useState(enabled)
  
  const intervalRef = useRef(null)
  const mountedRef = useRef(true)

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return

    try {
      setError(null)
      const result = await fetchFn()
      
      if (!mountedRef.current) return
      
      setData(result)
      setLoading(false)
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result)
      }
      
      // Check if we should stop polling
      if (shouldStop && shouldStop(result)) {
        console.log('🛑 Polling stopped by shouldStop condition')
        stopPolling()
      }
      
      return result
    } catch (err) {
      if (!mountedRef.current) return
      
      console.error('Polling error:', err)
      setError(err.message || 'Failed to fetch data')
      setLoading(false)
      
      // Call error callback
      if (onError) {
        onError(err)
      }
    }
  }, [fetchFn, shouldStop, onSuccess, onError])

  // Start polling
  const startPolling = useCallback(() => {
    console.log('▶️ Starting polling...')
    setIsPolling(true)
    setLoading(true)
  }, [])

  // Stop polling
  const stopPolling = useCallback(() => {
    console.log('⏸️ Stopping polling...')
    setIsPolling(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Manual refetch
  const refetch = useCallback(async () => {
    console.log('🔄 Manual refetch...')
    setLoading(true)
    return await fetchData()
  }, [fetchData])

  // Set up polling effect
  useEffect(() => {
    if (!isPolling) return

    // Initial fetch
    fetchData()

    // Set up interval
    intervalRef.current = setInterval(() => {
      fetchData()
    }, interval)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPolling, interval, fetchData, ...dependencies])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refetch
  }
}

/**
 * Hook specifically for polling session data
 */
export const useSessionPolling = (sessionId, options = {}) => {
  const fetchSession = useCallback(async () => {
    if (!sessionId) return null
    
    const { getSession } = await import('../services/api')
    return await getSession(sessionId)
  }, [sessionId])

  return usePolling(fetchSession, {
    interval: 2000,
    enabled: !!sessionId,
    ...options
  })
}

/**
 * Hook for polling transcription status
 */
export const useTranscriptionPolling = (jobId, options = {}) => {
  const fetchStatus = useCallback(async () => {
    if (!jobId) return null
    
    const { getTranscriptionStatus } = await import('../services/api')
    return await getTranscriptionStatus(jobId)
  }, [jobId])

  return usePolling(fetchStatus, {
    interval: 3000,
    enabled: !!jobId,
    shouldStop: (data) => data?.status === 'COMPLETED' || data?.status === 'FAILED',
    ...options
  })
}

export default usePolling

