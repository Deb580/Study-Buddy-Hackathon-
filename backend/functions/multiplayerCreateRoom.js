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
    const body = JSON.parse(event.body || '{}');
    const { setId, hostName, questions = [] } = body;

    if (!setId || !hostName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'setId and hostName are required' })
      };
    }

    console.log(`Creating room with ${questions.length} questions`);
    const room = await multiplayerService.createRoom(setId, hostName, questions);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(room)
    };
  } catch (error) {
    console.error('Error creating room:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
