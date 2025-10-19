const { getSessionByRoomCode, addPlayerToSession, generateSessionId } = require('../services/dynamoService');

/**
 * Lambda function to join a quiz session by room code
 * POST /session/join
 * Body: { roomCode: string, playerName: string }
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
    const { roomCode, playerName } = body;

    // Validate input
    if (!roomCode || typeof roomCode !== 'string' || roomCode.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Room code is required'
        })
      };
    }

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Player name is required'
        })
      };
    }

    // Find session by room code
    const session = await getSessionByRoomCode(roomCode.trim());
    
    if (!session) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Session not found with this room code'
        })
      };
    }

    // Check if session is still waiting for players
    if (session.status !== 'waiting') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Session is no longer accepting new players'
        })
      };
    }

    // Create player data
    const playerId = generateSessionId(); // Reusing this function for player IDs
    const player = {
      id: playerId,
      name: playerName.trim(),
      score: 0,
      answers: []
    };

    // Add player to session
    const updatedSession = await addPlayerToSession(session.sessionId, player);

    // Return success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          sessionId: session.sessionId,
          playerId: playerId,
          playerName: player.name,
          playerCount: updatedSession.players.length,
          hostName: session.hostName,
          status: session.status
        }
      })
    };

  } catch (error) {
    console.error('Error in joinSession handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to join session',
        message: error.message
      })
    };
  }
};
