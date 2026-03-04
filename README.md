# BiteSpeed Identity Reconciliation API
> Backend Assignment Submission — Consolidate customer identities across multiple contact records.
---

## 📌 Project Overview

When customers make purchases on platforms like Amazon, they often use different email addresses or phone numbers across different orders. This makes it hard to recognize that these orders belong to the same person.

The **Identity Reconciliation API** solves this by intelligently linking contact records that belong to the same individual. It consolidates multiple contact entries — across emails and phone numbers — into a single unified identity, always maintaining one **primary** contact and linking related records as **secondary** contacts.

---

## 🧩 Problem Statement

A customer may place orders using:
- Different email addresses with the same phone number
- Different phone numbers with the same email address
- Completely different contact details that get linked later through shared data points

The challenge is to **detect** these overlaps and **merge** them into a single coherent identity without losing any information.

---

## 💡 Approach / Solution

The solution uses a **relational PostgreSQL database** with a `contacts` table to store and link customer contact records.

**Core rules:**
- Each contact stores an `email`, a `phoneNumber`, or both
- The **oldest** matching contact is treated as the **primary** contact
- Any new contact that shares an email or phone with an existing one becomes a **secondary** contact, linked to the primary via `linkedId`
- If two separate primary groups are later found to belong to the same person, they are **merged** — the older primary survives and the newer one is demoted to secondary (along with its entire linked chain)

On every `/identify` request, the API returns a **consolidated view** of all contact records belonging to the same identity.

---

## 🏗️ Architecture

**Stack:**
- **Backend:** Node.js + Express.js
- **Database:** PostgreSQL (`pg` library)

**Request Flow:**
```
Client Request
     ↓
POST /identify
     ↓
Input Validation
     ↓
DB Query (match by email OR phoneNumber)
     ↓
Identity Reconciliation Logic
  ├── No match      → Create primary contact
  ├── Match found   → Create secondary if new info
  └── Multi-primary → Merge groups, oldest wins
     ↓
Fetch full contact group
     ↓
Consolidated JSON Response
```

**Folder Structure:**
```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── routes/            # Express route definitions
│   ├── services/          # Business logic & DB queries
│   ├── db/                # PostgreSQL connection pool
│   ├── models/            # Table schema creation
│   └── app.js             # Express app setup
├── server.js              # Entry point
├── .env                   # Environment variables
└── package.json
```

---

## 🗄️ Database Schema

**Table: `contacts`**

| Column          | Type         | Description                              |
|-----------------|--------------|------------------------------------------|
| `id`            | SERIAL PK    | Unique auto-increment identifier         |
| `phoneNumber`   | VARCHAR(20)  | Customer's phone number (nullable)       |
| `email`         | VARCHAR(255) | Customer's email address (nullable)      |
| `linkedId`      | INTEGER      | FK → `contacts.id` of the primary contact|
| `linkPrecedence`| VARCHAR(10)  | `'primary'` or `'secondary'`             |
| `createdAt`     | TIMESTAMP    | Record creation time                     |
| `updatedAt`     | TIMESTAMP    | Last update time                         |
| `deletedAt`     | TIMESTAMP    | Soft-delete timestamp (nullable)         |

**Linking logic:**
- A **primary** contact has `linkedId = NULL`
- A **secondary** contact has `linkedId` pointing to its primary contact's `id`

---

## 🧠 Identity Reconciliation Logic

### Case 1 — New Customer
No existing contact matches the incoming email or phone.

→ A new contact is created with `linkPrecedence = 'primary'`.

### Case 2 — Existing Contact with New Information
An existing contact matches, but the incoming request contains a new email or phone number not previously seen.

→ A new contact is created with `linkPrecedence = 'secondary'`, linked to the existing primary.

### Case 3 — Multiple Primary Groups Detected
The incoming request matches contacts belonging to two different primary groups (e.g., one by email, another by phone).

→ The **oldest** primary contact is kept as primary. The newer primary is **demoted to secondary**, and all its linked secondaries are re-parented to the true primary.

After reconciliation, the full group is fetched and a consolidated response is returned.

---

## 📡 API Endpoint

### `POST /identify`

Identifies and reconciles the contact based on the provided email and/or phone number.

**Request Body:**
```json
{
  "email": "example@test.com",
  "phoneNumber": "999999"
}
```
> At least one of `email` or `phoneNumber` must be provided.

---

**Example 1 — New Contact (primary created)**

Request:
```json
{ "email": "lorraine@hillvalley.edu", "phoneNumber": "123456" }
```

Response:
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

---

**Example 2 — Existing contact, new info (secondary created)**

Request:
```json
{ "email": "mcfly@hillvalley.edu", "phoneNumber": "123456" }
```

Response:
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

---

**Error Response (both fields missing):**
```json
{ "error": "Either email or phoneNumber must be provided" }
```

---

## 🚀 How to Run Locally

**Prerequisites:** Node.js, PostgreSQL

```bash
# 1. Clone the repository
git clone https://github.com/akshat111/bitespeed-identity-reconciliation.git
cd bitespeed-identity-reconciliation/backend

# 2. Install dependencies
npm install

# 3. Create a PostgreSQL database
# In psql: CREATE DATABASE bitespeed_db;

# 4. Configure environment variables
# Edit the .env file:
```

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=bitespeed_db
```

```bash
# 5. Start the development server
npm run dev
```

The server starts at `http://localhost:3000`.  
The `contacts` table is created automatically on startup.

---

## 🌐 Deployment

The API is deployed and publicly accessible:

| Endpoint       | Method | URL                          |
|----------------|--------|------------------------------|
| Health Check   | GET    | `<DEPLOYED_URL>/health`      |
| Identify       | POST   | `<DEPLOYED_URL>/identify`    |

> Replace `<DEPLOYED_URL>` with the live deployment URL.

---

## 🛠️ Tech Stack

| Technology   | Purpose                      |
|-------------|------------------------------|
| Node.js      | Runtime environment          |
| Express.js   | HTTP server & routing        |
| PostgreSQL   | Relational database          |
| `pg`         | PostgreSQL client for Node   |
| `dotenv`     | Environment variable management |
| `cors`       | Cross-origin request support |
| `nodemon`    | Dev server auto-reload       |

---

## 🔮 Future Improvements

- **Input validation** — Stricter email format and phone number validation using `joi` or `zod`
- **Logging** — Structured request/error logging with `winston` or `pino`
- **Docker** — Containerize the app and database with `docker-compose`
- **Rate limiting** — Protect the API with `express-rate-limit`
- **Soft deletes** — Implement `deletedAt` filtering across all queries
- **Unit tests** — Add test coverage with `jest` and `supertest`

---

## 👤 Author

Built for the **BiteSpeed Backend Engineer Assignment**.
