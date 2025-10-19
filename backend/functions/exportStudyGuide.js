const exportService = require('../services/exportService');

/**
 * Lambda function to export complete study guide
 * POST /export/study-guide
 * Body: { studyData: object }
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
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { studyData, title = 'Study Guide' } = body;

    if (!studyData) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error: 'Study data is required'
        })
      };
    }

    // Generate study guide markdown
    const markdown = exportService.generateStudyGuide(studyData);
    const fileName = `study-guide-${Date.now()}.md`;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${fileName}"`
      },
      body: markdown
    };

  } catch (error) {
    console.error('Error in exportStudyGuide handler:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to export study guide',
        message: error.message
      })
    };
  }
};
