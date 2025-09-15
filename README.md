# Scalable Real-Time Chat API with GenAI Integration

A comprehensive real-time chat application built with **Node.js**, **TypeScript**, **Kafka**, **Redis**, **Socket.IO**, **MongoDB**, and **GraphQL**.
It supports private/group messaging, live presence, friendship handling, and intelligent responses using GenAI.

---

## ✨ Features

### 🔐 Authentication & Security

* JWT-based registration and login (**REST API**)
* Access + refresh tokens (rotation & revocation)
* Redis-based refresh token storage
* Email verification
* Bcrypt password hashing
* Protected routes via middleware

### 👤 User Management (**GraphQL API**)

* Retrieve and update user profile (name, avatar, status)
* Search users by username
* Online/Idle/offline status using Redis pub/sub
* Cached status for fast lookup

### 💬 Conversations (**GraphQL API**)

* One-on-one messaging
* Group chat support with roles (admin/member)
* Create/update conversations with metadata (name, avatar, description)
* List all user conversations
* Add/remove participants in group chats

### 📨 Messaging (**GraphQL API**)

* Send text and media messages
* Message history with pagination
* Read/unread status tracking
* Kafka message queue for reliable delivery

### 🤝 Friendships (**GraphQL API**)

* Send and respond to friend requests
* Receive real-time notifications for requests

### ⚡ Real-Time Communication (**Socket.IO**)

* Real-time message delivery
* Presence updates (online/idle/offline)
* Read and delivery receipts
* Live conversation updates
* Real-time friend request notifications

### 🤖 GenAI Integration (Google Gemini)

* Integrated with **Google Gemini API**
* Mention `@genai` in any message to activate the AI assistant
* Accepts text, images, videos, audio, PDFs
* Responds intelligently in text
* Supports immediate or streaming replies

### 📁 Media & Infrastructure

* File/image upload via Multer + Cloudinary + CDN (**REST API**)
* Push notification support (mobile or PWA)
* Multi-device login synchronization
* Input validation using Zod
* Scalable architecture with PM2 + Socket.IO adapter
* Unit & Integration Testing
* 95% test coverage using Jest and Supertest

---

## 🛠 Tech Stack

* **Node.js**, **TypeScript**, **Express**
* **GraphQL (Apollo Server)**
* **MongoDB**, **Redis**, **Kafka**
* **Socket.IO**
* **Cloudinary**, **Zod**
* **PM2**, **Jest**, **Supertest**

---

## 📄 API Documentation

* **REST API Docs:** Included in Postman Collection
* **GraphQL Docs:** Schema & examples available in Postman Collection

🔗 [Postman Collection](https://documenter.getpostman.com/view/41198842/2sB34oBxMZ)

---

## 🚀 Live Deployment

* **REST & GraphQL API URL:** [https://chat-app-api-p97e.onrender.com](https://chat-app-api-p97e.onrender.com)

---

## 🧪 Running Locally

```bash
git clone https://github.com/Mmagdy908/chat-api-genai.git
cd chat-app-api
npm install

# Copy and fill environment variables
cp .env.example .env

# Start in development mode
npm run dev
```

---

## 🧪 Run Tests

```bash
npm run test
```

---

## 📬 Contact

For support or questions, open an issue or email: **[Email](mailto:ymmagdyfofo@gmail.com)**

---

## 📝 License

MIT License © Mmagdy908
