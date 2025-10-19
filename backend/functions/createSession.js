const { createSession, generateRoomCode, generateSessionId } = require('../services/dynamoService');

/**
 * Lambda function to create a new quiz session
 * POST /session
 * Body: { hostName: string, questions: array }
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
    const { hostName, questions } = body;

    // Validate input
    if (!hostName || typeof hostName !== 'string' || hostName.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Host name is required'
        })
      };
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Questions array is required and must not be empty'
        })
      };
    }

    // Generate unique identifiers
    const sessionId = generateSessionId();
    const roomCode = generateRoomCode();

    // Create session data
    const sessionData = {
      sessionId,
      roomCode,
      hostName: hostName.trim(),
      questions,
      players: [],
      currentQuestion: 0,
      status: 'waiting'
    };

    // Create session in DynamoDB
    const createdSession = await createSession(sessionData);

    // Return success response
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          sessionId: createdSession.sessionId,
          roomCode: createdSession.roomCode,
          hostName: createdSession.hostName,
          questionCount: createdSession.questions.length,
          status: createdSession.status
        }
      })
    };

  } catch (error) {
    console.error('Error in createSession handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to create session',
        message: error.message
      })
    };
  }
};
