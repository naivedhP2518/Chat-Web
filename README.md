# 💬 ChatWave — Real-Time Chat Application

> A full-stack real-time chat application built with the **MEAN Stack** and **Socket.IO**.

![Tech Stack](https://img.shields.io/badge/MongoDB-Atlas-green) ![Express](https://img.shields.io/badge/Express-4.x-lightgrey) ![Angular](https://img.shields.io/badge/Angular-19-red) ![Node](https://img.shields.io/badge/Node.js-20.x-brightgreen) ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black)

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure register & login
- 💬 **Real-Time Messaging** — Instant delivery via Socket.IO
- 🟢 **Online Presence** — See who's online live
- ⌨️ **Typing Indicators** — Animated typing dots
- 📎 **File Sharing** — Attach and share files
- 😀 **Emoji Picker** — 5-category emoji panel
- 💾 **Message History** — Persistent chat via MongoDB
- 🌙 **Dark Mode UI** — Premium glassmorphism design

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- Angular CLI: `npm install -g @angular/cli`

### 1. Clone the repository

```bash
git clone https://github.com/naivedhP2518/Chat-Web.git
cd Chat-Web
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGO_URI and JWT_SECRET in .env
npm run dev
```

Backend runs at: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:4200`

---

## 🗂️ Project Structure

```
Chat App/
├── backend/          ← Node.js + Express REST API + Socket.IO
│   ├── config/       ← MongoDB connection
│   ├── controllers/  ← Business logic
│   ├── middleware/   ← JWT auth middleware
│   ├── models/       ← Mongoose schemas (User, Message)
│   └── routes/       ← API routes (auth, messages)
│
└── frontend/         ← Angular 19 SPA
    └── src/app/
        ├── components/   ← login, register, chat
        └── services/     ← AuthService, ChatService
```

---

## 🔌 API Endpoints

| Method | Endpoint                | Auth | Description       |
| ------ | ----------------------- | ---- | ----------------- |
| POST   | `/api/auth/register`    | ❌   | Register new user |
| POST   | `/api/auth/login`       | ❌   | Login & get JWT   |
| GET    | `/api/auth/users`       | ✅   | List all users    |
| GET    | `/api/messages/:userId` | ✅   | Chat history      |
| POST   | `/api/messages`         | ✅   | Save a message    |

---

## 🧱 Tech Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| Database       | MongoDB Atlas           |
| Backend        | Node.js + Express       |
| Authentication | JWT + bcryptjs          |
| Real-time      | Socket.IO               |
| Frontend       | Angular 19              |
| Styling        | Vanilla CSS (Dark Mode) |

---


