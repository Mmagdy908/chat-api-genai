Sure! Here's a cleaner version of your `README.md` without using the word "optional", and with a **catchy project name** suggestion:

---

# 💬 **NovaChat API** – Scalable Real-Time Chat API with GenAI Integration

NovaChat API is a powerful, scalable backend API for real-time chat applications built with **Node.js**, **TypeScript**, **Kafka**, **Redis**, **Socket.IO**, and **MongoDB**. It supports private/group messaging, live presence, friendship handling, and intelligent responses using GenAI.

---

## ✨ Features

### 🔐 Authentication & Security

* JWT-based registration and login
* Access + refresh tokens (rotation & revocation)
* Redis-based refresh token storage
* Email verification
* Bcrypt password hashing
* Protected routes via middleware

### 👤 User Management

* Retrieve and update user profile (name, avatar, status)
* Search users by username
* Online/offline status using Redis pub/sub
* Cached status for fast lookup

### 💬 Conversations

* One-on-one messaging
* Group chat support with roles (admin/member)
* Create/update conversations with metadata (name, avatar, description)
* List all user conversations
* Add/remove participants in group chats

### 📨 Messaging

* Send text and media messages
* Message history with pagination
* Read/unread status tracking
* Kafka message queue for reliable delivery

### 🤝 Friendships

* Send and respond to friend requests
* Receive real-time notifications for requests

### ⚡ Real-Time Communication (Socket.IO)

* Real-time message delivery
* Presence updates (online/offline)
* Read and delivery receipts
* Live conversation updates
* Real-time friend request notifications

### 🧠 GenAI Integration

* Mention `@genai` in a message to activate AI assistant
* Accepts text, images, videos, audio, PDFs
* Returns intelligent, text-only responses
* Supports immediate or streaming replies

### 📁 Media & Infrastructure

* File/image upload via Multer + Cloudinary + CDN
* Push notification support (mobile or PWA)
* Multi-device login synchronization
* Input validation using Zod
* Scalable architecture with PM2 + Socket.IO adapter
* 95% test coverage using Jest and Supertest

---

## 🛠 Tech Stack

* **Node.js**, **TypeScript**, **Express**
* **MongoDB**, **Redis**, **Kafka**
* **Socket.IO**
* **Cloudinary**, **Zod**
* **PM2**, **Jest**, **Supertest**

---

## 📂 Project Structure

```bash
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── repositories/
├── routes/
├── services/
├── sockets/
├── utils/
└── tests/
```

---

## 📄 API Documentation

* **Postman Collection:** \[Insert Link Here]
* **Socket.IO Events Doc:** \[Insert Link Here]

---

## 🚀 Live Deployment

* **Backend URL:** \[Insert Deployment Link Here]
* **API Docs (if Swagger or ReDoc):** \[Insert Link Here]

---

## 🧪 Running Locally

```bash
git clone https://github.com/your-username/novachat-api.git
cd novachat-api
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

For support or questions, open an issue or email: **\[[your-email@example.com](mailto:your-email@example.com)]**

---

## 📝 License

MIT License © \[Your Name]

---

Would you like me to generate `.env.example` or give a stub for the Postman or socket event docs as well?
