const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ROOMS_TABLE = process.env.MULTIPLAYER_ROOMS_TABLE || 'ai-study-assistant-dev-MultiplayerRooms';

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createRoom(setId, hostName, questions = []) {
  const code = generateRoomCode();
  const room = {
    code,
    setId,
    host: hostName,
    players: [{ name: hostName, score: 0, id: `player_${Date.now()}` }],
    status: 'waiting', // 'waiting', 'playing', 'finished'
    currentQuestion: 0,
    questions: questions, // Store questions in DynamoDB so all players can access
    createdAt: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expire after 24 hours
  };

  await docClient.send(new PutCommand({
    TableName: ROOMS_TABLE,
    Item: room
  }));

  console.log(`✅ Room created: ${code} with ${questions.length} questions`);
  return room;
}

async function getRoom(code) {
  const result = await docClient.send(new GetCommand({
    TableName: ROOMS_TABLE,
    Key: { code }
  }));

  if (!result.Item) {
    throw new Error('Room not found');
  }

  return result.Item;
}

async function joinRoom(code, playerName) {
  const room = await getRoom(code);

  if (room.status !== 'waiting') {
    throw new Error('Game already started');
  }

  // Check if player already exists
  if (room.players.some(p => p.name === playerName)) {
    throw new Error('Player name already taken');
  }

  const player = {
    name: playerName,
    score: 0,
    id: `player_${Date.now()}_${Math.random().toString(36).substring(7)}`
  };

  room.players.push(player);

  await docClient.send(new PutCommand({
    TableName: ROOMS_TABLE,
    Item: room
  }));

  console.log(`✅ Player ${playerName} joined room ${code}`);
  return room;
}

async function startRoom(code) {
  const room = await getRoom(code);
  room.status = 'playing';
  room.currentQuestion = 0;

  await docClient.send(new PutCommand({
    TableName: ROOMS_TABLE,
    Item: room
  }));

  console.log(`✅ Room ${code} started`);
  return room;
}

async function leaveRoom(code, playerName) {
  const room = await getRoom(code);
  room.players = room.players.filter(p => p.name !== playerName);

  // Delete room if empty
  if (room.players.length === 0) {
    await docClient.send(new DeleteCommand({
      TableName: ROOMS_TABLE,
      Key: { code }
    }));
    console.log(`✅ Room ${code} deleted (empty)`);
    return { deleted: true };
  }

  // Assign new host if host left
  if (room.host === playerName && room.players.length > 0) {
    room.host = room.players[0].name;
  }

  await docClient.send(new PutCommand({
    TableName: ROOMS_TABLE,
    Item: room
  }));

  console.log(`✅ Player ${playerName} left room ${code}`);
  return room;
}

async function submitAnswer(code, playerName, isCorrect) {
  const room = await getRoom(code);
  const player = room.players.find(p => p.name === playerName);

  if (!player) {
    throw new Error('Player not found');
  }

  if (isCorrect) {
    player.score += 1;
  }

  // Track who has answered this question
  if (!room.answeredPlayers) {
    room.answeredPlayers = [];
  }

  if (!room.answeredPlayers.includes(playerName)) {
    room.answeredPlayers.push(playerName);
  }

  // If all players have answered, show leaderboard
  if (room.answeredPlayers.length >= room.players.length) {
    room.showLeaderboard = true;
  }

  await docClient.send(new PutCommand({
    TableName: ROOMS_TABLE,
    Item: room
  }));

  console.log(`✅ ${playerName} answered ${isCorrect ? 'correctly' : 'incorrectly'}`);
  return room;
}

async function nextQuestion(code) {
  const room = await getRoom(code);

  if (room.status !== 'playing') {
    throw new Error('Game is not in progress');
  }

  // Move to next question and hide leaderboard
  room.currentQuestion += 1;
  room.showLeaderboard = false;
  room.answeredPlayers = []; // Reset for next question

  await docClient.send(new PutCommand({
    TableName: ROOMS_TABLE,
    Item: room
  }));

  console.log(`✅ Room ${code} advanced to question ${room.currentQuestion}`);
  return room;
}

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
  startRoom,
  leaveRoom,
  submitAnswer,
  nextQuestion
};
