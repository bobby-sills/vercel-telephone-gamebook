# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Twilio-based interactive voice adventure game that allows players to navigate through a story by pressing telephone keypad numbers. The game uses Supabase for session persistence and Express.js for the web server.

## Architecture

- **Single-file Node.js application**: The entire application logic is contained in `server.js`
- **Twilio Voice API**: Handles incoming phone calls and voice responses using TwiML
- **Supabase Database**: Stores user sessions to maintain game state across calls
- **Express.js Server**: Provides webhooks for Twilio and debug endpoints

### Core Components

- **Story Engine**: Static story nodes defined in `storyNodes` object with text and choice mappings
- **Session Management**: Database functions to track user progress through the story
- **Voice Webhooks**: Two main endpoints `/voice` (main game flow) and `/handle-choice` (user input processing)

## Development Commands

- **Start server**: `npm start` - Runs the production server
- **Development mode**: `npm run dev` - Runs with nodemon for auto-restart on file changes
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

- `POST /voice` - Main Twilio webhook for incoming calls
- `POST /handle-choice` - Processes user keypad input
- `GET /` - Health check endpoint
- `GET /debug` - Database inspection endpoint

## Story Structure

Stories are defined as a graph of nodes where each node contains:
- `text` - The narrative spoken to the player
- `choices` - Object mapping keypad digits to next story nodes

Terminal nodes (game endings) have empty `choices` objects.

## Development Notes

- The server must be publicly accessible for Twilio webhooks to work
- Database connection is tested on startup
- User sessions are automatically cleaned up when games end
- Invalid choices prompt users to retry rather than ending the game