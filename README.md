# Ace Card Game

A real-time multiplayer UNO-inspired card game built with React, Socket.IO, and Express.

## Features

- Create and join game rooms with room codes
- Real-time multiplayer gameplay
- Complete UNO-style game mechanics
- In-game chat
- Mobile responsive design
- Beautiful card animations and game state feedback

## Getting Started

### Prerequisites

- Node.js 14+ 
- npm or yarn

### Installation

1. Clone the repository or download the source code

2. Install dependencies
```bash
npm install
```

3. Start the development server and backend
```bash
npm run dev:full
```

This will start both the Vite frontend server and the Express backend server concurrently.

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Technology Stack

- **Frontend**
  - React
  - TypeScript
  - Socket.IO Client
  - Tailwind CSS

- **Backend**
  - Node.js
  - Express
  - Socket.IO

## Game Rules

- Each player starts with 7 cards.
- Match cards by the same color or number.
- Special cards: Skip (skip next player), Reverse (change direction), Draw 2 (next player draws 2 cards and skips turn).
- Wild cards can be played anytime, and you choose the color.
- Wild Draw 4 - next player draws 4 cards and loses their turn.
- First player to get rid of all their cards wins!

## Deployment

The game can be deployed to various platforms:

- Backend: Render, Heroku, or any Node.js hosting service
- Frontend: Netlify, Vercel, or any static site hosting service

Make sure to update the `VITE_SERVER_URL` environment variable in the frontend to point to your deployed backend.

## License

This project is licensed under the MIT License - see the LICENSE file for details.