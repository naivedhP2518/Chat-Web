# 📋 ChatWave — Implementation Details

## Architecture Overview

ChatWave uses a **hybrid real-time + REST** architecture:

- REST API (Express) handles auth, user listing, and message persistence
- Socket.IO handles real-time message delivery and online presence

---

## Backend Implementation

### Authentication Flow

1. User registers → password hashed with `bcryptjs` → stored in MongoDB
2. User logs in → JWT token issued (expires never by default)
3. Protected routes use `middleware/auth.js` to verify the JWT

### Real-Time Messaging

- Each user is mapped: `{ userId: socketId }` in memory
- On `sendMessage`, the server routes to the receiver's `socketId`
- Messages are also saved to MongoDB via the REST API for persistence
- On disconnect, the user is removed from the online map

### DNS Fix

`server.js` overrides Node.js DNS to use Google's public servers (`8.8.8.8`)  
to bypass college/ISP networks that block MongoDB Atlas SRV record lookups.

---

## Frontend Implementation

### Services

| Service       | Responsibility                                                       |
| ------------- | -------------------------------------------------------------------- |
| `AuthService` | Register, login, logout, token storage, getUsers                     |
| `ChatService` | Socket.IO connect/disconnect, send/receive messages, history, typing |

### Components

| Component           | Route       | Description                                       |
| ------------------- | ----------- | ------------------------------------------------- |
| `LoginComponent`    | `/login`    | Email + password form, JWT stored to localStorage |
| `RegisterComponent` | `/register` | Username + email + password, redirects to login   |
| `ChatComponent`     | `/chat`     | Full chat UI with sidebar, bubbles, emoji picker  |

### Chat Features

- **Message bubbles**: Sent (purple gradient) vs Received (glass card)
- **Typing indicator**: Bouncing 3-dot animation
- **Emoji picker**: 5-category (Smileys/Gestures/Hearts/Fun/Objects), scrollable grid
- **Attach button**: Triggers file picker, sends filename as message
- **Three-dot menu**: Clear Chat, Copy Username, Sign Out dropdown

---

## Design System

| Token            | Value                     |
| ---------------- | ------------------------- |
| Primary accent   | `#6366f1` (Indigo)        |
| Secondary accent | `#8b5cf6` (Purple)        |
| Background       | `#0f1117`                 |
| Card background  | `rgba(255,255,255,0.025)` |
| Border           | `rgba(255,255,255,0.07)`  |
| Font             | Inter (Google Fonts)      |

---

## Security Considerations

- Passwords are **never stored in plain text** (bcryptjs, 10 rounds)
- JWT secret is stored in `.env`, never hardcoded
- CORS configured to only allow `http://localhost:4200`
- All message/user routes require a valid JWT header
