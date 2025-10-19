const multiplayerService = require('../services/multiplayerService');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'CORS preflight' }) };
  }

  try {
    const code = event.pathParameters?.code;
    const body = JSON.parse(event.body || '{}');
    const { playerName, isCorrect } = body;

    if (!code || !playerName || typeof isCorrect !== 'boolean') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Room code, playerName, and isCorrect are required' })
      };
    }

    const room = await multiplayerService.submitAnswer(code, playerName, isCorrect);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(room)
    };
  } catch (error) {
    console.error('Error submitting answer:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
