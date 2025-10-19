const exportService = require('../services/exportService');

/**
 * Lambda function to export quiz to Kahoot format
 * POST /export/kahoot?format=json|excel
 * Body: { questions: array, title: string }
 */
exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    // Get format from query parameters
    const format = event.queryStringParameters?.format || 'json';
    const validFormats = ['json', 'excel'];
    
    if (!validFormats.includes(format)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Invalid format. Use json or excel'
        })
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { questions, title = 'AI Generated Quiz' } = body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'No questions provided'
        })
      };
    }

    let content, contentType, fileName;

    if (format === 'excel') {
      content = exportService.generateKahootExcel(questions);
      contentType = 'text/csv';
      fileName = `kahoot-import-${Date.now()}.csv`;
    } else {
      content = exportService.generateKahootJSON(questions, title);
      contentType = 'application/json';
      fileName = `kahoot-import-${Date.now()}.json`;
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`
      },
      body: content
    };

  } catch (error) {
    console.error('Error in exportKahoot handler:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to export Kahoot format',
        message: error.message
      })
    };
  }
};
