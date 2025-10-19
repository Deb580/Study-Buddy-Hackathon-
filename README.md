# Study Buddy Hackathon Project 2025
Turn notes into flashcards & quizzes with AI! Study solo or challenge friends in real time. Export to Quizlet or Kahoot with ease!
Made by Vicente Rivera, Deborah Rabinovich, Matt Kraus, and Marena Aboud


## ✨ Key Features

- 🎙️ **Audio Transcription** - AWS Transcribe converts 2hr+ lectures to text
- 🤖 **AI Generation** - AWS Bedrock creates summaries, flashcards, quizzes
- ♾️ **Infinite Practice** - AI generates unlimited unique questions (our killer feature)
- 🎮 **Multiplayer Quiz** - Real-time Kahoot-style competitions with room codes
- 📤 **Export Anywhere** - Download as Quizlet CSV or Kahoot JSON

---

## 🏗️ Tech Stack

**Frontend:** React, Vite, Tailwind CSS  
**Backend:** AWS Lambda (14 functions), Serverless Framework  
**AI:** AWS Bedrock (Claude 3.5 Sonnet)  
**Audio:** AWS Transcribe  
**Database:** DynamoDB (GSI + TTL)  
**API:** AWS API Gateway

## 🚀 Quick Start
```bash
# Backend
cd backend && npm install && serverless deploy

# Frontend
cd frontend && npm install
echo "VITE_API_URL=https://[YOUR_API].execute-api.us-east-1.amazonaws.com/dev" > .env
npm run dev
