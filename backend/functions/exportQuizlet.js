const exportService = require('../services/exportService');

/**
 * Lambda function to export flashcards to Quizlet format
 * POST /export/quizlet/{setId}
 * Body: { flashcards: array }
 */
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'text/csv'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  try {
    // Extract setId from path parameters
    const setId = event.pathParameters?.setId;

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { flashcards } = body;
    
    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'No flashcards provided' 
        })
      };
    }

    // Generate Quizlet CSV
    const csv = exportService.generateQuizletCSV(flashcards);
    const fileName = `quizlet-import-${setId || 'study-set'}-${Date.now()}.csv`;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`
      },
      body: csv
    };

  } catch (error) {
    console.error('Error in exportQuizlet handler:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to export Quizlet format',
        message: error.message
      })
    };
  }
};
