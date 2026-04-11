# Ketabi Platform

## Overview

**Ketabi** is a production-style digital bookstore and publishing platform. It connects readers with books and publishers with catalog and order workflows: discovery, cart and checkout, orders, reviews, support tickets, coupons, and administrative tools for sales and refunds.

The system is designed to behave like a real commercial product: structured APIs, persistent data, integrations for payments and notifications, and operational concerns such as logging, scheduled jobs, and API documentation.

**Business value:** it reduces friction for online book sales, gives publishers a channel to manage inventory and orders, and gives administrators visibility into commerce and customer support—all backed by a single coherent backend service.

---

## My Role

**I was responsible for backend development only.** I did not build or own the client application; the repository includes a separate frontend (Angular) that consumes the APIs I designed and implemented.

### Backend responsibilities

| Area | Contribution |
|------|----------------|
| **API design** | RESTful modules under `/api/*`, consistent patterns for validation, responses, and errors |
| **Data modeling** | MongoDB schemas and relationships for users, books, genres, carts, orders, publishers, reviews, tickets, coupons, and related entities |
| **Authentication & authorization** | JWT-based auth with Redis-backed session/token metadata, email confirmation, optional 2FA flows, Google sign-in integration, and route protection middleware |
| **Business logic** | Cart, checkout, orders, coupons, refunds, publisher flows, reviews, support tickets, and AI-assisted book discovery (chatbot) |
| **Performance & reliability** | Redis for caching and token state, background cron jobs (e.g. carts, coupons, orders, user lifecycle), and structured error handling |
| **Security & operations** | Helmet, CORS configuration, encryption for sensitive fields, centralized error handling, request logging (Morgan/Winston), and Swagger/OpenAPI documentation |

---

## Backend Features

- **Authentication** — Registration, login, refresh tokens, email verification, Google OAuth, JWT access tokens validated against Redis, device/session awareness where implemented  
- **Authorization** — Protected routes via middleware; role-aware flows for users, publishers, and administrators  
- **CRUD & domain APIs** — Books, genres, publishers, cart, orders, user profiles, reviews, tickets, coupons, admin sales/refunds  
- **Validation & errors** — Input validation (e.g. Joi), consistent HTTP status codes, centralized `errorHandler` and `AppError` pattern  
- **Payments & webhooks** — Stripe and Paymob integration patterns (configuration-driven)  
- **Real-time** — Socket.IO server initialization for live features  
- **Scalable structure** — Modular routes, controllers, models, middlewares, jobs, and utilities  
- **API documentation** — Swagger UI at `/api-docs` (OpenAPI 3)  
- **Observability** — Structured logging and rotating log files in development/production modes  

---

## Tech Stack

### Backend (primary)

| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express 5** | HTTP server and routing |
| **MongoDB + Mongoose** | Primary datastore and ODM |
| **Redis** | Sessions / token metadata and caching-related usage |
| **JWT (jsonwebtoken)** | Access and refresh token issuance and verification |
| **Joi** | Request validation |
| **Helmet** | Security-related HTTP headers |
| **express-session + connect-redis** | Session store |
| **Socket.IO** | WebSocket layer |
| **node-cron** | Scheduled maintenance and business jobs |
| **Multer** | Multipart / file uploads |
| **Stripe / Paymob** | Payment providers (env-configured) |
| **Nodemailer / Twilio** | Email and SMS (where configured) |
| **Google Generative AI (Gemini)** | AI chatbot and book discovery |
| **Swagger (swagger-jsdoc, swagger-ui-express)** | Interactive API docs |
| **Winston / Morgan** | Logging |

### Frontend (reference only)

The **Angular** application under `Frontend/ketabi` is a separate consumer of this backend. **Frontend implementation is outside my scope of responsibility** for this project; it is listed here only so stakeholders understand the full system composition.

---

## API Overview

Base path: **`/api`** (see `Backend/Ketabi_Website/app.js` for mounting).

| Prefix | Module (high level) |
|--------|---------------------|
| `/api/auth` | Registration, login, tokens, email confirmation, OAuth-related flows |
| `/api/genres` | Genre catalog |
| `/api/books` | Book catalog, details, search-related endpoints |
| `/api/publishers` | Publisher-facing book and order operations |
| `/api/cart` | Shopping cart |
| `/api/orders` | Checkout and order lifecycle |
| `/api/users` | User profile and account-related operations |
| `/api/coupons` | Coupon validation and application |
| `/api/tickets` | Support tickets |
| `/api/reviews` | Product reviews |
| `/api/admin/refunds` | Administrative refund handling |
| `/api/admin/sales` | Sales reporting / admin sales |
| `/api/chatbot` | AI-assisted queries over the catalog |
| `/api/admin` | Administrative operations |

**Interactive documentation:** after starting the server, open **`http://localhost:<PORT>/api-docs`** (default port `3000` unless overridden).

---

## Architecture / Structure

Backend service root: **`Backend/Ketabi_Website/`**

Typical layout:

```
Backend/Ketabi_Website/
├── app.js                 # Express app bootstrap, middleware, route mounting
├── index.js               # Entry: loads environment, starts bootstrap
├── config/                # DB, session, Swagger, payment, S3, etc.
├── routes/                # HTTP route definitions (thin layer)
├── controllers/           # Request handling and orchestration
├── models/                # Mongoose schemas (domain entities)
├── middlewares/           # Auth, CORS, errors, logging, etc.
├── jobs/                  # Cron / scheduled tasks
├── socketIO/              # Real-time server setup
├── chatbot/               # AI chatbot config, services, prompts
├── utils/                 # JWT, email/SMS helpers, errors, async wrappers
├── uploads/               # Local upload storage (created at runtime if missing)
└── logs/                  # Application logs (when enabled)
```

Environment files are commonly loaded from **`Backend/.env`** when running from `Ketabi_Website` (see `index.js`).

---

## Getting Started (Backend Only)

### Prerequisites

- **Node.js** (LTS recommended)  
- **MongoDB** (connection string)  
- **Redis** (URL reachable from the app)  

### Installation

```bash
cd Backend/Ketabi_Website
npm install
```

### Environment variables

Create **`Backend/.env`** (recommended) or copy and edit **`Backend/Ketabi_Website/.env.example`** and align variable names with what the codebase expects.

git **Commonly required (non-exhaustive):**

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection URL |
| `PORT` | HTTP port (default `3000`) |
| `SESSION_SECRET` | Express session secret |
| `JWT_SECRET_ACCESS_KEY` / `JWT_SECRET_REFRESH_KEY` | JWT signing secrets |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` (and optional `*_SECONDS`) | Token lifetimes |
| `CLIENT_URL` | Allowed CORS origin for the web client |
| `ENCRYPTION_KEY` | Sensitive field encryption |
| `APP_EMAIL` / `APP_PASSWORD` | Outbound email (Nodemailer) |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GEMINI_API_KEY` | Chatbot / AI features |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe (when used) |
| `PAYMOB_*` | Paymob configuration (when used) |
| `NODE_ENV` | `development` / `production` |
| `BACKEND_BASE_URL` | Absolute URLs for assets and links |

> **Security:** never commit real secrets. Use a private `.env` and rotate keys for production.

### Run the server

```bash
cd Backend/Ketabi_Website
npm run dev    # nodemon (development)
# or
npm start      # node index.js
```

Confirm MongoDB and Redis are running and reachable before starting.

---

## Use Cases

- **Readers** — Browse books, manage cart and orders, leave reviews, open support tickets, apply coupons  
- **Publishers** — Manage catalog and publisher-specific order flows via dedicated APIs  
- **Administrators** — Oversight of refunds, sales, and platform-level operations  
- **Product / engineering teams** — Integrate mobile or web clients against documented REST endpoints  

---

## Why This Project Is Strong (Backend Perspective)

- **Clear separation of concerns** — Routes, controllers, models, and middleware keep the codebase maintainable as features grow  
- **Security-minded defaults** — Helmet, CORS allowlisting, JWT validation with Redis-backed token state, and encryption for sensitive user data  
- **Operational maturity** — Centralized errors, logging, scheduled jobs, and optional payment webhooks mirror production systems  
- **Discoverable APIs** — Swagger reduces onboarding time for frontend, mobile, or partner integrations  
- **Extensible domain** — Commerce (cart, orders, coupons), content (books, genres), engagement (reviews, chatbot), and support (tickets) in one service boundary  

This README reflects the backend service as implemented in **`Backend/Ketabi_Website`**. For the full-stack picture, the Angular client lives under **`Frontend/ketabi`** and is maintained separately from my backend work.
