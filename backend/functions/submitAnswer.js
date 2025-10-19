const { getSession, updateSession } = require('../services/dynamoService');

/**
 * Lambda function to submit an answer to a quiz question
 * POST /session/{id}/answer
 * Body: { playerId: string, answer: number, timeSpent: number }
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

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { playerId, answer, timeSpent } = body;

    // Validate input
    if (!playerId || typeof playerId !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Player ID is required'
        })
      };
    }

    if (typeof answer !== 'number' || answer < 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Valid answer index is required'
        })
      };
    }

    // Get session
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

    // Check if session is active
    if (session.status !== 'active') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Session is not active'
        })
      };
    }

    // Find player
    const playerIndex = session.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Player not found in session'
        })
      };
    }

    // Get current question
    const currentQuestion = session.questions[session.currentQuestion];
    if (!currentQuestion) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No active question'
        })
      };
    }

    // Check if answer is correct
    const isCorrect = answer === currentQuestion.correctAnswer;
    const points = isCorrect ? 10 : 0;

    // Update player's answer and score
    const players = [...session.players];
    const player = players[playerIndex];
    
    // Check if player already answered this question
    const existingAnswer = player.answers.find(a => a.questionIndex === session.currentQuestion);
    if (existingAnswer) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Player has already answered this question'
        })
      };
    }

    // Add answer to player's answers
    player.answers.push({
      questionIndex: session.currentQuestion,
      answer,
      isCorrect,
      points,
      timeSpent: timeSpent || 0
    });

    // Update player's total score
    player.score = player.answers.reduce((total, a) => total + a.points, 0);

    // Update session with new player data
    await updateSession(sessionId, { players });

    // Return response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          isCorrect,
          points,
          correctAnswer: currentQuestion.correctAnswer,
          explanation: currentQuestion.explanation,
          playerScore: player.score
        }
      })
    };

  } catch (error) {
    console.error('Error in submitAnswer handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to submit answer',
        message: error.message
      })
    };
  }
};
