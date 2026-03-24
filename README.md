# 🏦 NovaBank – AI-Powered Banking Transaction System

NovaBank is a **full-stack fintech application** that simulates a modern banking system with **real-time transactions, secure backend architecture, and an AI-powered financial assistant (Nova AI Pro)**.

This project demonstrates **production-level system design**, combining:

* Secure banking operations
* Scalable backend architecture
* AI-driven financial intelligence

---

## 🚀 Features

### 🔐 Authentication

* User Registration & Login (JWT-based)
* Secure session handling

### 💰 Account Management

* View account balance
* Real-time updates after transactions

### 💸 Transactions

* Deposit money
* Withdraw money
* Transfer funds between accounts
* Transaction history with filtering

### ⚡ Concurrency & Safety

* ACID-compliant database transactions
* Row-level locking (`SELECT ... FOR UPDATE`)
* Prevents double spending & race conditions

### 🧠 Nova AI Pro (AI Assistant)

* ChatGPT-like conversational assistant
* Context-aware responses (balance, transactions)
* Predictive insights (future balance, spending trends)
* Multi-step actions (e.g., transfer flow)
* Anomaly detection (fraud-like activity)
* Financial health score & savings analysis

### 🎯 Smart Features

* Budget tracking
* Smart alerts (low balance, unusual activity)
* AI-generated insights
* Voice input support (experimental)

---

## 🧱 Tech Stack

### Frontend

* React.js (Hooks)
* Axios
* Modern UI (Dark Fintech Theme)

### Backend

* Node.js + Express.js
* REST APIs
* JWT Authentication

### Database

* MySQL
* Transaction-safe queries
* Indexed schema

### AI Integration

* OpenAI / Gemini API
* Hybrid AI system (rule-based + LLM)

---

## 🧠 Architecture Overview

Frontend (React)
→ Backend API (Node.js)
→ Database (MySQL)
→ AI Layer (LLM + Local Logic)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/Bank-Transaction-system.git
cd Bank-Transaction-system
```

---

### 2️⃣ Backend Setup

```bash
cd Backend
npm install
```

Create `.env` file:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=bankdb

JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_api_key
```

Run backend:

```bash
npm start
```

---

### 3️⃣ Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

---

## 🧪 API Endpoints

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`

### Account

* `GET /api/account/balance`

### Transactions

* `POST /api/transaction/deposit`
* `POST /api/transaction/withdraw`
* `GET /api/transaction/history`

### AI

* `POST /api/ai/chat`

---

## 🤖 Example AI Queries

* “What is my balance?”
* “How much did I spend this week?”
* “Predict my future balance”
* “Transfer 500 to account 123”
* “Any unusual transactions?”

---

## 🔥 Key Highlights

* Built using **real-world banking principles**
* Handles **concurrent transactions safely**
* Implements **idempotency for API reliability**
* AI assistant behaves like **ChatGPT with financial context**
* Clean, scalable **MVC architecture**

---

## 📸 Screenshots

* Dashboard with analytics
* Transactions page
* AI Assistant (Nova AI Pro)
* Transfer workflow

---

## 💼 Use Case

This project is designed to demonstrate:

* Full-stack development
* System design skills
* AI integration in fintech
* Production-level thinking

---

## 🚀 Future Enhancements

* Real-time WebSocket updates
* Microservices architecture
* Advanced fraud detection ML models
* Mobile app integration
* AI auto-execution (tool calling)

---

## 👨‍💻 Author

**Vignesh S**
CSE Student | Backend & AI Enthusiast

---

## ⭐ Support

If you found this project useful:

* ⭐ Star the repo
* 🍴 Fork it
* 💬 Share feedback

---

> “This is not just a project. It’s a prototype of an intelligent fintech system.”
