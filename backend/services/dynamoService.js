const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'ai-study-assistant-dev-QuizSessions';

/**
 * Creates a new quiz session
 * @param {Object} sessionData - Session data to create
 * @returns {Promise<Object>} Created session
 */
async function createSession(sessionData) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        ...sessionData,
        createdAt: Date.now(),
        ttl: Math.floor(Date.now() / 1000) + 3600 // Auto-delete after 1 hour
      }
    };

    const { PutCommand } = require('@aws-sdk/lib-dynamodb');
    await docClient.send(new PutCommand(params));
    return sessionData;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Gets a session by sessionId
 * @param {string} sessionId - Session ID to retrieve
 * @returns {Promise<Object|null>} Session data or null if not found
 */
async function getSession(sessionId) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        sessionId
      }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting session:', error);
    throw new Error('Failed to get session');
  }
}

/**
 * Gets a session by room code
 * @param {string} roomCode - Room code to search for
 * @returns {Promise<Object|null>} Session data or null if not found
 */
async function getSessionByRoomCode(roomCode) {
  try {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'RoomCodeIndex',
      KeyConditionExpression: 'roomCode = :roomCode',
      ExpressionAttributeValues: {
        ':roomCode': roomCode
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error) {
    console.error('Error getting session by room code:', error);
    throw new Error('Failed to get session by room code');
  }
}

/**
 * Updates a session
 * @param {string} sessionId - Session ID to update
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated session
 */
async function updateSession(sessionId, updateData) {
  try {
    // Build update expression dynamically
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updateData[key];
    });

    const params = {
      TableName: TABLE_NAME,
      Key: {
        sessionId
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error('Error updating session:', error);
    throw new Error('Failed to update session');
  }
}

/**
 * Adds a player to a session
 * @param {string} sessionId - Session ID
 * @param {Object} player - Player data
 * @returns {Promise<Object>} Updated session
 */
async function addPlayerToSession(sessionId, player) {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const players = session.players || [];
    const existingPlayerIndex = players.findIndex(p => p.id === player.id);
    
    if (existingPlayerIndex >= 0) {
      // Update existing player
      players[existingPlayerIndex] = { ...players[existingPlayerIndex], ...player };
    } else {
      // Add new player
      players.push(player);
    }

    return await updateSession(sessionId, { players });
  } catch (error) {
    console.error('Error adding player to session:', error);
    throw new Error('Failed to add player to session');
  }
}

/**
 * Updates a player's score in a session
 * @param {string} sessionId - Session ID
 * @param {string} playerId - Player ID
 * @param {number} score - New score
 * @returns {Promise<Object>} Updated session
 */
async function updatePlayerScore(sessionId, playerId, score) {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const players = session.players || [];
    const playerIndex = players.findIndex(p => p.id === playerId);
    
    if (playerIndex >= 0) {
      players[playerIndex].score = score;
      return await updateSession(sessionId, { players });
    } else {
      throw new Error('Player not found in session');
    }
  } catch (error) {
    console.error('Error updating player score:', error);
    throw new Error('Failed to update player score');
  }
}

/**
 * Generates a unique 6-digit room code
 * @returns {string} Unique room code
 */
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generates a unique session ID
 * @returns {string} Unique session ID
 */
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  createSession,
  getSession,
  getSessionByRoomCode,
  updateSession,
  addPlayerToSession,
  updatePlayerScore,
  generateRoomCode,
  generateSessionId
};
