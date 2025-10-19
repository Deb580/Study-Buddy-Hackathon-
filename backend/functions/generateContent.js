const { generateStudyContent } = require('../services/bedrockService');

/**
 * Lambda function to generate AI study content from notes
 * POST /generate
 * Body: { notes: string }
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
    const { notes } = body;

    // Validate input
    if (!notes || typeof notes !== 'string' || notes.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Notes content is required and must be a non-empty string'
        })
      };
    }

    // Generate study content using Bedrock
    const studyContent = await generateStudyContent(notes);

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: studyContent
      })
    };

  } catch (error) {
    console.error('Error in generateContent handler:', error);

    // Return error response
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate study content',
        message: error.message
      })
    };
  }
};
