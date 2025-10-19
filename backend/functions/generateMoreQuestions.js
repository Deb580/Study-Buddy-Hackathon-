const dynamicQuizService = require('../services/dynamicQuizService');

/**
 * Lambda function to generate additional quiz questions using Bedrock AI
 * POST /quiz/generate-more
 * Body: { originalContent: string, previousQuestions: array, count: number }
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
    const { originalContent, previousQuestions, count = 10 } = body;

    // Validate input
    if (!originalContent || typeof originalContent !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Original content is required'
        })
      };
    }

    if (!Array.isArray(previousQuestions)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Previous questions must be an array'
        })
      };
    }

    if (count < 1 || count > 50) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Count must be between 1 and 50'
        })
      };
    }

    // Generate new questions using Bedrock AI
    const newQuestions = await dynamicQuizService.generateNewQuestions(
      originalContent,
      previousQuestions,
      count
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        questions: newQuestions,
        totalGenerated: previousQuestions.length + newQuestions.length,
        message: `Generated ${newQuestions.length} new questions`
      })
    };

  } catch (error) {
    console.error('Error in generateMoreQuestions handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate questions',
        message: error.message
      })
    };
  }
};
