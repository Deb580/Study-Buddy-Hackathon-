const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const BEDROCK_PROMPT = `You are a study assistant. Analyze the notes below and generate study materials.

Return ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "summary": ["Concise point 1", "Concise point 2", "Concise point 3"],
  "flashcards": [
    {"question": "What is X?", "answer": "X is..."},
    {"question": "Define Y", "answer": "Y means..."}
  ],
  "quiz": [
    {
      "question": "Which of the following best describes...?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": 0,
      "explanation": "Brief explanation"
    }
  ]
}

CRITICAL REQUIREMENTS:
- summary: EXACTLY 3-5 bullet points, each under 150 characters
- flashcards: EXACTLY 7 flashcards with clear Q&A pairs
- quiz: EXACTLY 5 multiple-choice questions
- Each quiz question MUST have exactly 4 options labeled A), B), C), D)
- correctAnswer MUST be 0, 1, 2, or 3 (the index)
- Base ALL content on the actual notes provided
- Keep language clear and concise
- Ensure one correct answer and three plausible distractors for each quiz question

Notes to analyze:
`;

/**
 * Generates study content from notes using AWS Bedrock
 * @param {string} notes - The text content to analyze
 * @returns {Promise<Object>} Generated study content with summary, flashcards, and quiz
 */
async function generateStudyContent(notes) {
  try {
    if (!notes || notes.trim().length === 0) {
      throw new Error('Notes content is required');
    }

    console.log('🔵 [bedrockService] Starting Bedrock request...');
    console.log('🔵 [bedrockService] Notes length:', notes.length);

    const prompt = BEDROCK_PROMPT + notes;

    const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';
    console.log('🔵 [bedrockService] Using model:', modelId);

    // Determine request format based on model
    let requestBody;
    if (modelId.startsWith('amazon.nova')) {
      // Amazon Nova format
      requestBody = {
        messages: [
          {
            role: 'user',
            content: [{ text: prompt }]
          }
        ],
        inferenceConfig: {
          max_new_tokens: 2000,
          temperature: 0.5
        }
      };
    } else {
      // Anthropic Claude format
      requestBody = {
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };
    }

    const command = new InvokeModelCommand({
      modelId: modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    console.log('🔵 [bedrockService] Sending command to Bedrock...');
    const response = await bedrockClient.send(command);
    console.log('🔵 [bedrockService] Received response from Bedrock');

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log('🔵 [bedrockService] Parsed response body');

    // Extract the content based on model type
    let content;
    if (modelId.startsWith('amazon.nova')) {
      // Amazon Nova response format
      content = responseBody.output.message.content[0].text;
    } else {
      // Anthropic Claude response format
      content = responseBody.content[0].text;
    }
    console.log('🔵 [bedrockService] Extracted content:', content.substring(0, 200) + '...');

    // Parse the JSON response - handle markdown code blocks
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }

    const studyContent = JSON.parse(cleanedContent);
    console.log('🔵 [bedrockService] Parsed study content successfully');

    // Validate the response structure
    if (!studyContent.summary || !studyContent.flashcards || !studyContent.quiz) {
      throw new Error('Invalid response format from Bedrock');
    }

    if (!Array.isArray(studyContent.summary) || studyContent.summary.length === 0) {
      throw new Error('Summary must be a non-empty array');
    }

    if (!Array.isArray(studyContent.flashcards) || studyContent.flashcards.length !== 7) {
      console.warn('⚠️ [bedrockService] Expected 7 flashcards, got:', studyContent.flashcards.length);
    }

    if (!Array.isArray(studyContent.quiz) || studyContent.quiz.length !== 5) {
      console.warn('⚠️ [bedrockService] Expected 5 quiz questions, got:', studyContent.quiz.length);
    }

    console.log('✅ [bedrockService] Validation passed, returning study content');
    return studyContent;

  } catch (error) {
    console.error('🔴 [bedrockService] ERROR:', error.name);
    console.error('🔴 [bedrockService] ERROR Message:', error.message);
    console.error('🔴 [bedrockService] ERROR Stack:', error.stack);

    // Check for specific error types
    if (error.name === 'AccessDeniedException') {
      console.error('🔴 [bedrockService] Access denied - check IAM permissions for Bedrock');
    } else if (error.name === 'ResourceNotFoundException') {
      console.error('🔴 [bedrockService] Model not found - check BEDROCK_MODEL_ID');
    } else if (error.name === 'ValidationException') {
      console.error('🔴 [bedrockService] Validation error - check request format');
    }

    // Return fallback content if Bedrock fails
    console.warn('⚠️ [bedrockService] Returning fallback content');
    return {
      summary: [
        "Key concepts from your notes",
        "Important definitions and terms",
        "Main topics and themes covered"
      ],
      flashcards: Array.from({ length: 7 }, (_, i) => ({
        question: `Sample question ${i + 1}?`,
        answer: `Sample answer ${i + 1}`
      })),
      quiz: Array.from({ length: 5 }, (_, i) => ({
        question: `Sample quiz question ${i + 1}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: 0,
        explanation: `Explanation for question ${i + 1}`
      }))
    };
  }
}

module.exports = {
  generateStudyContent
};
