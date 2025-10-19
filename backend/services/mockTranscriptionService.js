// Simulates transcription process with DynamoDB persistence
// Returns realistic lecture transcript

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const JOBS_TABLE = process.env.TRANSCRIPTION_JOBS_TABLE || 'ai-study-assistant-dev-TranscriptionJobs';

// Educational transcript content for demo - MLK Speech Summary
const GENERIC_TRANSCRIPT = `This is an educational summary and analysis of Dr. Martin Luther King Jr.'s historic speech delivered at the Lincoln Memorial during the March on Washington for Jobs and Freedom on August 28, 1963.

The speech begins with a powerful historical reference, situating the moment within the broader context of American history and the Emancipation Proclamation signed one hundred years prior. Dr. King emphasizes that despite the passage of a century, African Americans still face segregation and discrimination.

A central theme involves the metaphor of a promissory note - the Constitution and Declaration of Independence as a promise to all Americans of unalienable rights to life, liberty, and the pursuit of happiness. Dr. King argues that America has defaulted on this promise for its citizens of color.

The speech's most famous section articulates a vision of America where people are judged by the content of their character rather than the color of their skin. This dream encompasses brotherhood, justice, and equality across all states and regions.

Key principles emphasized include nonviolent resistance, meeting physical force with soul force, and refusing to satisfy thirst for freedom by drinking from the cup of bitterness and hatred. Dr. King stresses that the struggle must be conducted on the high plane of dignity and discipline.

The speech addresses both the urgency of now and the fierce urgency of the moment, while also acknowledging that this is not an end but a beginning. There is a call to continue working until justice rolls down like waters and righteousness like a mighty stream.

Geographic specificity strengthens the message, with references to various states including Mississippi, Alabama, Georgia, and others, illustrating that this is a national issue requiring nationwide transformation.

The conclusion returns to the theme of hope and faith, expressing confidence that the nation can transform its discords into a beautiful symphony of brotherhood. There is an emphasis on working together, struggling together, and standing up for freedom together.

This speech remains one of the most significant pieces of American oratory, combining biblical references, patriotic imagery, and moral urgency to advance the cause of civil rights and equality.`;


class MockTranscriptionService {
  // Simulate starting a transcription job
  async startTranscription(audioFileName, audioBuffer) {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Simulate processing time (10 seconds for hackathon demo)
    const processingTime = 10000; // 10 seconds
    const now = Date.now();

    const job = {
      jobId,
      status: 'IN_PROGRESS',
      startTime: now,
      estimatedCompletion: now + processingTime,
      fileName: audioFileName,
      ttl: Math.floor((now + 24 * 60 * 60 * 1000) / 1000) // 24 hours
    };

    // Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: JOBS_TABLE,
      Item: job
    }));

    console.log(`✅ Transcription job created: ${jobId}`);

    return {
      jobId,
      status: 'IN_PROGRESS',
      estimatedSeconds: Math.floor(processingTime / 1000)
    };
  }

  // Check job status
  async getJobStatus(jobId) {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: JOBS_TABLE,
        Key: { jobId }
      }));

      const job = result.Item;

      if (!job) {
        return { status: 'NOT_FOUND' };
      }

      const now = Date.now();

      // Check if job should be completed
      if (now >= job.estimatedCompletion) {
        // Mark as completed in DB
        const completedJob = {
          ...job,
          status: 'COMPLETED',
          transcript: GENERIC_TRANSCRIPT,
          completedAt: now
        };

        await docClient.send(new PutCommand({
          TableName: JOBS_TABLE,
          Item: completedJob
        }));

        return {
          status: 'COMPLETED',
          transcript: GENERIC_TRANSCRIPT,
          duration: Math.floor((now - job.startTime) / 1000)
        };
      }

      // Still in progress
      const elapsed = now - job.startTime;
      const total = job.estimatedCompletion - job.startTime;
      const progress = Math.min(95, Math.floor((elapsed / total) * 100));

      return {
        status: 'IN_PROGRESS',
        progress,
        estimatedSecondsRemaining: Math.max(0, Math.floor((job.estimatedCompletion - now) / 1000))
      };
    } catch (error) {
      console.error('Error getting job status:', error);
      return { status: 'NOT_FOUND' };
    }
  }
}

module.exports = new MockTranscriptionService();
