# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Run server (port 5000) and client (port 3000) concurrently
npm run server       # Run only Express backend
npm run client       # Run only React frontend
npm start             #start both frontend and backend
cd client && npm test        # Run React tests
cd client && npm run build   # Build client for production
```

## Architecture

Monorepo with `/server` (Express + Mongoose) and `/client` (React + Tailwind).

**Backend Structure:**
- `server/routes/` - API endpoints (auth, tasks, goals, scheduled, logs, chat, reflection, planner)
- `server/models/` - Mongoose schemas (User, DailyTask, DailyLog, WeeklyGoal, ScheduledTask)
- `server/middleware/auth.js` - JWT authentication middleware for protected routes
- `server/config/db.js` - MongoDB connection

**Frontend Structure:**
- `client/src/contexts/AuthContext.jsx` - Global auth state via React Context
- `client/src/services/api.js` - Centralized Axios client (credentials enabled for cookies)
- `client/src/components/` - Feature components (TasksColumn, GoalsColumn, ReflectionChat, etc.)

## Key Implementation Details

**Date Handling:** Custom 12:30 AM day reset logic - the day changes at 12:30 AM, not midnight. Use `getAdjustedDate()` from `server/utils/dateUtils.js` for consistent date handling.

**Authentication:** PBKDF2-SHA256 with 10,000 iterations. JWT tokens in httpOnly cookies (7-day validity). All protected routes use `authMiddleware`.

**AI Integrations:**
- `/api/reflection/process` - Gemini Flash merges reflections into structured sections
- `/api/planner/parse` - Gemini Flash converts natural language to structured tasks
- `/api/chat/search` - Tavily API searches ML/AI articles

**Database:** DailyLog has unique composite index on `userId` + `date`. Tasks support streak tracking for recurring ("everyday") tasks.

## Deployment

**Environment Variables Required:**
- `MONGODB_URI` - MongoDB connection string (MongoDB Atlas recommended)
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT signing (use strong random string)
- `TAVILY_API_KEY` - Tavily API key for article search feature
- `GEMINI_API_KEY` - Google Gemini API key for AI features

**Building for Production:**
```bash
cd client && npm run build   # Generates /client/build with optimized assets
```

**Production Considerations:**
- CORS origin in `server/server.js` is hardcoded to `localhost:3000` - update for production domain
- Cookie secure flag is environment-aware (enabled when `NODE_ENV=production`)
- No Docker/CI-CD currently configured - manual deployment required
