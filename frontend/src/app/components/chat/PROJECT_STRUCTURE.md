# 📁 ChatWave — Project Folder Structure

> **Full-Stack Real-Time Chat App** · MEAN Stack (MongoDB · Express · Angular · Node.js) · Socket.IO

---

## 🗂️ Root

```
Chat App/
├── backend/          ← Node.js + Express API server
├── frontend/         ← Angular 19 SPA
├── package.json      ← Root (not used; ignore)
└── package-lock.json
```

---

## 🖥️ Backend — `backend/`

```
backend/
├── server.js               ← Entry point: Express + Socket.IO + routes
├── package.json            ← Dependencies: express, mongoose, socket.io,
│                               jsonwebtoken, bcryptjs, dotenv, nodemon
├── .env                    ← 🔒 Secrets (never commit!)
│     PORT=5000
│     MONGO_URI=mongodb+srv://...
│     JWT_SECRET=...
├── .gitignore              ← Excludes node_modules/ and .env
│
├── config/
│   └── db.js               ← MongoDB connection via Mongoose
│
├── models/
│   ├── User.js             ← Schema: username, email, password (hashed), timestamps
│   └── Message.js          ← Schema: sender (ref), receiver (ref), message, timestamps
│
├── middleware/
│   └── auth.js             ← JWT verification middleware (protects private routes)
│
├── controllers/
│   └── authController.js   ← register(), login(), getUsers()
│
├── routes/
│   ├── auth.js             ← POST /api/auth/register
│   │                          POST /api/auth/login
│   │                          GET  /api/auth/users
│   └── messages.js         ← GET  /api/messages/:userId  (chat history)
│                              POST /api/messages           (save message)
│
└── node_modules/           ← (git-ignored)
```

### 🔌 Socket.IO Events (in `server.js`)

| Event            | Direction       | Description                  |
| ---------------- | --------------- | ---------------------------- |
| `userOnline`     | Client → Server | Register user as online      |
| `onlineUsers`    | Server → All    | Broadcast online user list   |
| `sendMessage`    | Client → Server | Send private message         |
| `receiveMessage` | Server → Client | Deliver message to receiver  |
| `typing`         | Client → Server | Notify typing started        |
| `stopTyping`     | Client → Server | Notify typing stopped        |
| `disconnect`     | Auto            | Remove user from online list |

---

## 🌐 Frontend — `frontend/`

```
frontend/
├── src/
│   ├── index.html                  ← Root HTML, title: "ChatWave"
│   ├── main.ts                     ← Angular bootstrap
│   ├── styles.css                  ← Global dark-mode theme + CSS variables
│   │
│   └── app/
│       ├── app.ts                  ← Root component (standalone)
│       ├── app.html                ← <router-outlet /> only
│       ├── app.routes.ts           ← Routes: /login, /register, /chat
│       ├── app.config.ts           ← Providers: HttpClient, Router
│       │
│       ├── services/
│       │   ├── auth.ts             ← AuthService: register, login, logout,
│       │   │                           getToken, getCurrentUser, getUsers
│       │   └── chat.ts             ← ChatService: Socket.IO connect/disconnect,
│       │                               sendMessage, onMessage, getHistory,
│       │                               saveMessage, typing events, onlineUsers
│       │
│       └── components/
│           ├── login/
│           │   ├── login.ts        ← LoginComponent: form state, login(), navigate
│           │   ├── login.html      ← Auth card: SVG logo, email/password fields
│           │   └── login.css       ← Glassmorphism card, gradient button, orb bg
│           │
│           ├── register/
│           │   ├── register.ts     ← RegisterComponent: form state, register()
│           │   ├── register.html   ← Auth card: SVG logo, username/email/password
│           │   └── register.css    ← Same auth styles as login (Angular-scoped)
│           │
│           └── chat/
│               ├── chat.ts         ← ChatComponent: users, messages, socket events,
│               │                       emoji picker, attach, dropdown menu
│               ├── chat.html       ← Full chat UI: sidebar + chat panel + input bar
│               └── chat.css        ← Layout, bubbles, avatars, emoji panel, dropdown
│
├── angular.json                    ← Angular CLI config
├── tsconfig.json                   ← TypeScript config
├── package.json                    ← Dependencies: @angular/*, socket.io-client
└── node_modules/                   ← (git-ignored)
```

---

## 📡 API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint    | Auth?  | Body                          | Response                   |
| ------ | ----------- | ------ | ----------------------------- | -------------------------- |
| POST   | `/register` | ❌     | `{username, email, password}` | `{token, user}`            |
| POST   | `/login`    | ❌     | `{email, password}`           | `{token, user}`            |
| GET    | `/users`    | ✅ JWT | —                             | `[{_id, username, email}]` |

### Message Routes — `/api/messages`

| Method | Endpoint   | Auth?  | Body                  | Response                                   |
| ------ | ---------- | ------ | --------------------- | ------------------------------------------ |
| GET    | `/:userId` | ✅ JWT | —                     | `[{sender, receiver, message, createdAt}]` |
| POST   | `/`        | ✅ JWT | `{receiver, message}` | Saved message object                       |

---

## 🚀 How to Run

### 1. Start Backend

```bash
cd backend
npm run dev       # nodemon server.js → http://localhost:5000
```

### 2. Start Frontend

```bash
cd frontend
npm start         # ng serve → http://localhost:4200
```

### 3. Open in Browser

```
http://localhost:4200
```

---

## 🗝️ Environment Variables (`.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxx.mongodb.net/chatapp
JWT_SECRET=your_secret_here
```

> ⚠️ Never commit `.env` — it's in `.gitignore`

---

## 🧱 Tech Stack Summary

| Layer     | Technology           | Purpose                         |
| --------- | -------------------- | ------------------------------- |
| Database  | MongoDB Atlas        | Store users & messages          |
| ODM       | Mongoose             | Schema + query helpers          |
| Backend   | Node.js + Express    | REST API                        |
| Auth      | JWT + bcryptjs       | Secure login & password hashing |
| Real-time | Socket.IO            | Live messaging & presence       |
| Frontend  | Angular 19           | SPA with standalone components  |
| HTTP      | HttpClient           | REST API calls from Angular     |
| Styling   | Vanilla CSS          | Dark glassmorphism theme        |
| Fonts     | Google Fonts (Inter) | Premium typography              |
