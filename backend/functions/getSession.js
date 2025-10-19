const { getSession } = require('../services/dynamoService');

/**
 * Lambda function to get session details
 * GET /session/{id}
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
    // Extract session ID from path parameters
    const sessionId = event.pathParameters?.id;

    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Session ID is required'
        })
      };
    }

    // Get session from DynamoDB
    const session = await getSession(sessionId);

    if (!session) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Session not found'
        })
      };
    }

    // Return session data (excluding sensitive info if needed)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          sessionId: session.sessionId,
          roomCode: session.roomCode,
          hostName: session.hostName,
          questions: session.questions,
          players: session.players,
          currentQuestion: session.currentQuestion,
          status: session.status,
          createdAt: session.createdAt
        }
      })
    };

  } catch (error) {
    console.error('Error in getSession handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get session',
        message: error.message
      })
    };
  }
};
