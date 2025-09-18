# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Twilio-based interactive voice adventure game that allows players to navigate through a story by pressing telephone keypad numbers. The game uses Supabase for session persistence and Express.js for the web server.

## Architecture

- **Serverless Functions**: Application deployed as Vercel serverless functions in `/api` directory
- **Twilio Voice API**: Handles incoming phone calls and voice responses using TwiML
- **Supabase Database**: Stores user sessions to maintain game state across calls
- **Express.js Server**: Local development server in `server.js` for testing

### Core Components

- **Story Engine**: Static story nodes defined in `storyNodes` object with text and choice mappings
- **Session Management**: Database functions to track user progress through the story
- **Voice Webhooks**: Two main endpoints `/api/voice` (main game flow) and `/api/handle-choice` (user input processing)
- **Security**: Rate limiting and phone number validation to prevent abuse

## Development Commands

- **Start local server**: `npm start` - Runs the local development server
- **Development mode**: `npm run dev` - Runs with nodemon for auto-restart on file changes
- **Code analysis**: `npm run lint` - Check for code issues with ESLint
- **Install dependencies**: `npm install`

## Environment Configuration

The application requires these environment variables in `.env`:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `PORT` - Server port (defaults to 3000)

## Database Schema

The application expects a Supabase table named `user_sessions` with:
- `phone_number` (primary key) - Caller's phone number
- `current_node` - Current position in the story
- `updated_at` - Last update timestamp

## Key Endpoints

- `POST /api/voice` - Main Twilio webhook for incoming calls
- `POST /api/handle-choice` - Processes user keypad input
- `GET /api/index` - Health check endpoint

## Story Structure

Stories are defined as a graph of nodes where each node contains:
- `text` - The narrative spoken to the player
- `choices` - Object mapping keypad digits to next story nodes

Terminal nodes (game endings) have empty `choices` objects.

## Development Notes

- The serverless functions must be publicly accessible for Twilio webhooks to work
- Database connection is tested on startup (local development only)
- User sessions are automatically cleaned up when games end
- Invalid choices prompt users to retry rather than ending the game
- Rate limiting prevents abuse: 20 calls/minute per phone number for voice, 30/minute for choices

## Debugging

- **Vercel Function Logs**: Monitor calls and errors in Vercel dashboard → Functions → Logs
- **Supabase Dashboard**: View user sessions and database state directly
- **Local Development**: Use `npm run dev` with ngrok for testing webhooks locally