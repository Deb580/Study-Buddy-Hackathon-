const mammoth = require('mammoth');

/**
 * Lambda function to handle file uploads and extract text
 * POST /upload
 * Body: { fileContent: string, fileName: string, fileType: string }
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
    const { fileContent, fileName, fileType } = body;

    // Validate input
    if (!fileContent || typeof fileContent !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'File content is required'
        })
      };
    }

    let extractedText = fileContent;

    // Handle .docx files
    if (fileName && (fileName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      try {
        // Convert base64 to buffer for mammoth
        const buffer = Buffer.from(fileContent, 'base64');
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        console.log('✅ Extracted text from .docx file:', extractedText.substring(0, 100));
      } catch (docxError) {
        console.error('Error parsing .docx:', docxError);
        // Fall back to treating as plain text
        extractedText = fileContent;
      }
    }

    // Basic text cleaning
    extractedText = extractedText
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim();

    if (extractedText.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'No text content found in file'
        })
      };
    }

    // Return extracted text
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          text: extractedText,
          fileName: fileName || 'uploaded-file',
          fileType: fileType || 'text/plain',
          characterCount: extractedText.length
        }
      })
    };

  } catch (error) {
    console.error('Error in uploadHandler:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process file upload',
        message: error.message
      })
    };
  }
};
