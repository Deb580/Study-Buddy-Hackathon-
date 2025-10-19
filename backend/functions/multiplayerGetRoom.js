const multiplayerService = require('../services/multiplayerService');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'CORS preflight' }) };
  }

  try {
    const code = event.pathParameters?.code;

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Room code is required' })
      };
    }

    const room = await multiplayerService.getRoom(code);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(room)
    };
  } catch (error) {
    console.error('Error getting room:', error);
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
