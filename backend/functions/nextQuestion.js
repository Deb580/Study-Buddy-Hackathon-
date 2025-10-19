const { getSession, updateSession } = require('../services/dynamoService');

/**
 * Lambda function to advance to the next question
 * POST /session/{id}/next
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

    const nextQuestionIndex = session.currentQuestion + 1;
    const totalQuestions = session.questions.length;

    // Check if we've reached the end
    if (nextQuestionIndex >= totalQuestions) {
      // Quiz is finished
      await updateSession(sessionId, { 
        status: 'finished',
        currentQuestion: nextQuestionIndex - 1
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            isFinished: true,
            currentQuestion: nextQuestionIndex - 1,
            totalQuestions,
            message: 'Quiz completed!'
          }
        })
      };
    }

    // Advance to next question
    await updateSession(sessionId, { 
      currentQuestion: nextQuestionIndex
    });

    // Get the next question (without the correct answer for security)
    const nextQuestion = session.questions[nextQuestionIndex];
    const questionForClient = {
      question: nextQuestion.question,
      options: nextQuestion.options,
      questionIndex: nextQuestionIndex,
      totalQuestions
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          isFinished: false,
          question: questionForClient,
          currentQuestion: nextQuestionIndex,
          totalQuestions
        }
      })
    };

  } catch (error) {
    console.error('Error in nextQuestion handler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to advance to next question',
        message: error.message
      })
    };
  }
};
