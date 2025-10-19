const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

/**
 * Generates additional quiz questions using AWS Bedrock
 * @param {string} originalContent - The original study content
 * @param {Array} previousQuestions - Already generated questions
 * @param {number} count - Number of new questions to generate
 * @returns {Promise<Array>} Array of new quiz questions
 */
async function generateNewQuestions(originalContent, previousQuestions, count = 10) {
  try {
    console.log('🔵 [dynamicQuizService] Generating', count, 'new questions');
    console.log('🔵 [dynamicQuizService] Previous questions count:', previousQuestions.length);
    console.log('🔵 [dynamicQuizService] Content length:', originalContent.length);

    // Validate content length
    if (!originalContent || originalContent.trim().length < 50) {
      console.error('🔴 [dynamicQuizService] Content too short (< 50 chars)');
      throw new Error('Content must be at least 50 characters to generate meaningful questions');
    }

    // Limit content length to avoid timeouts
    const truncatedContent = originalContent.length > 3000
      ? originalContent.substring(0, 3000) + '...'
      : originalContent;

    // Extract previous question texts to avoid duplicates
    const previousQuestionTexts = previousQuestions.slice(0, 10).map(q => q.question).join('\n- ');

    // Adjust count based on content length
    const maxQuestionsForContent = Math.floor(truncatedContent.length / 100);
    const adjustedCount = Math.min(count, maxQuestionsForContent, 10);

    if (adjustedCount < count) {
      console.warn(`⚠️ [dynamicQuizService] Adjusting count from ${count} to ${adjustedCount} based on content length`);
    }

    const prompt = `You are a study assistant. Generate ${adjustedCount} NEW multiple-choice quiz questions based ONLY on the study content below.

${previousQuestionTexts ? 'IMPORTANT: Do NOT repeat these previous questions:\n- ' + previousQuestionTexts : ''}

Return ONLY valid JSON (no markdown, no explanation):
{
  "questions": [
    {
      "question": "What is...",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": 0,
      "explanation": "Brief explanation"
    }
  ]
}

CRITICAL REQUIREMENTS:
- Generate EXACTLY ${adjustedCount} questions
- Base ALL questions on the actual content below
- Each question MUST have exactly 4 options labeled A), B), C), D)
- correctAnswer MUST be 0, 1, 2, or 3
- Keep questions clear and concise
- Focus on key concepts from the content
- If content is limited, ask deeper questions about what's there

Study content:
${truncatedContent}`;

    const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';
    console.log('🔵 [dynamicQuizService] Using model:', modelId);

    const requestBody = {
      messages: [
        {
          role: 'user',
          content: [{ text: prompt }]
        }
      ],
      inferenceConfig: {
        max_new_tokens: 2000,
        temperature: 0.6
      }
    };

    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    console.log('🔵 [dynamicQuizService] Sending command to Bedrock...');
    const response = await bedrockClient.send(command);
    console.log('🔵 [dynamicQuizService] Received response from Bedrock');

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.output.message.content[0].text;

    console.log('🔵 [dynamicQuizService] Extracted content:', content.substring(0, 200) + '...');

    // Parse the JSON response - handle markdown code blocks
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    const result = JSON.parse(cleanedContent);
    const newQuestions = result.questions;

    // Validate questions
    if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
      throw new Error('No questions generated');
    }

    // Validate each question structure
    const validQuestions = newQuestions.filter(q => {
      return q.question &&
             Array.isArray(q.options) &&
             q.options.length === 4 &&
             typeof q.correctAnswer === 'number' &&
             q.correctAnswer >= 0 &&
             q.correctAnswer <= 3;
    });

    if (validQuestions.length === 0) {
      throw new Error('No valid questions generated');
    }

    console.log('✅ [dynamicQuizService] Generated', validQuestions.length, 'valid questions');
    return validQuestions;

  } catch (error) {
    console.error('🔴 [dynamicQuizService] ERROR:', error.name);
    console.error('🔴 [dynamicQuizService] ERROR Message:', error.message);
    console.error('🔴 [dynamicQuizService] ERROR Stack:', error.stack);

    // Don't return fallback - throw error so frontend can show meaningful message
    throw new Error(`Failed to generate questions: ${error.message}. Please ensure your content has sufficient detail.`);
  }
}

module.exports = {
  generateNewQuestions
};
