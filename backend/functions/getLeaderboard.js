const { getSession } = require('../services/dynamoService');

/**
 * Lambda function to get leaderboard for a session
 * GET /session/{id}/scores
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

    // Create leaderboard from players
    const leaderboard = session.players
      .map(player => ({
        id: player.id,
        name: player.name,
        score: player.score,
        answersCount: player.answers.length,
        correctAnswers: player.answers.filter(a => a.isCorrect).length
      }))
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          leaderboard,
          totalPlayers: leaderboard.length,
          sessionStatus: session.status,
          currentQuestion: session.currentQuestion,
          totalQuestions: session.questions.length
        }
      })
    };

  } catch (error) {
    console.error('Error in getLeaderboard handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get leaderboard',
        message: error.message
      })
    };
  }
};
