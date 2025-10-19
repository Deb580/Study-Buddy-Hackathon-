const mockTranscriptionService = require('../services/mockTranscriptionService');

/**
 * Lambda function to check transcription job status
 * GET /transcription/{jobId}
 */
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  try {
    // Extract job ID from path parameters
    const jobId = event.pathParameters?.jobId;

    if (!jobId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Job ID is required'
        })
      };
    }

    // Get transcription status
    const status = await mockTranscriptionService.getJobStatus(jobId);

    if (status.status === 'NOT_FOUND') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Transcription job not found'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...status
      })
    };

  } catch (error) {
    console.error('Error in getTranscriptionStatus handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get transcription status',
        message: error.message
      })
    };
  }
};
