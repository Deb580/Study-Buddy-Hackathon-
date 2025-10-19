const mockTranscriptionService = require('../services/mockTranscriptionService');

/**
 * Lambda function to handle audio file uploads and start transcription
 * POST /upload/audio
 * Body: { fileName: string, fileSize: number }
 */
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileSize } = body;

    // Validate input
    if (!fileName || typeof fileName !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'File name is required'
        })
      };
    }

    if (!fileSize || typeof fileSize !== 'number') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'File size is required'
        })
      };
    }

    // Validate file size (100MB limit)
    if (fileSize > 100 * 1024 * 1024) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'File too large. Maximum size is 100MB'
        })
      };
    }

    // Validate file type (basic check)
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.wma'];
    const hasValidExtension = audioExtensions.some(ext => 
      fileName.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid file type. Please upload an audio file (MP3, WAV, M4A, AAC, OGG, WMA)'
        })
      };
    }

    // In real version: upload to S3 first
    // For now, we'll simulate the upload and start transcription
    const result = await mockTranscriptionService.startTranscription(fileName, null);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        jobId: result.jobId,
        status: result.status,
        estimatedSeconds: result.estimatedSeconds,
        message: 'Audio uploaded successfully. Transcription in progress.'
      })
    };

  } catch (error) {
    console.error('Error in uploadAudio handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process audio upload',
        message: error.message
      })
    };
  }
};
