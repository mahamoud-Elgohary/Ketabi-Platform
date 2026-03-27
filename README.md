# Ketabi Website Fullstack

Fullstack bookstore platform with:
- **Backend:** Node.js + Express + MongoDB + Redis
- **Frontend:** Angular
- **Uploads:** Local filesystem storage (`/uploads`) for PDF files

This project is configured to run fully on localhost without AWS dependencies.

## Project Structure

```text
Ketabi_Website_Fullstack/
├── Backend/
│   ├── .env
│   └── Ketabi_Website/        # Node.js API
├── Frontend/
│   └── ketabi/                # Angular app
└── README.md
```

## Features

- User authentication with OTP flow
- Books, categories, publishers, cart, orders, reviews
- Real-time chat via Socket.IO
- Local PDF upload and download support
- Swagger API docs

## Prerequisites

- Node.js 18+ (Node 20/22 recommended)
- npm
- MongoDB Atlas or local MongoDB
- Redis running locally (`redis://localhost:6379/0`)

## Environment Setup

Use `Backend/.env` (already expected by the backend app).

Minimum important keys:

```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
REDIS_URL=redis://localhost:6379/0
SESSION_SECRET=your_session_secret
BACKEND_BASE_URL=http://localhost:3000
NODE_ENV=development
```

Optional keys for advanced features:
- Stripe, Google, Facebook, Telegram, Gemini keys

> Note: Stripe webhook/refund runtime paths may be disabled in local mode depending on current code changes for development stability.

## Installation

### Backend

```bash
cd Backend/Ketabi_Website
npm install
```

### Frontend

```bash
cd Frontend/ketabi
npm install
```

## Running Locally

### 1) Start Redis

If not already running:

```bash
redis-server
```

### 2) Start Backend

```bash
cd Backend/Ketabi_Website
npm run dev
```

Expected:
- Server on `http://localhost:3000`
- Swagger docs on `http://localhost:3000/api-docs`

### 3) Start Frontend

```bash
cd Frontend/ketabi
ng serve
```

Open: `http://localhost:4200`

## API and Proxy Configuration

Frontend uses relative API base (`/api`) and Angular proxy configuration:
- `Frontend/ketabi/proxy.conf.json`
- `Frontend/ketabi/angular.json` (`serve.options.proxyConfig`)

Proxy routes:
- `/api` -> `http://localhost:3000`
- `/socket.io` -> `http://localhost:3000` (WebSocket enabled)
- `/uploads` -> `http://localhost:3000`

## File Uploads (Local Storage)

AWS S3 upload flow has been replaced by local storage:
- Files are saved under backend `uploads/`
- Static serving is enabled in backend app:
  - `app.use('/uploads', express.static('uploads'));`

When a file is uploaded, API stores:
- file key/path
- public URL (local)
- metadata (name, mimeType, size, uploadedAt)

## Key Endpoints (Examples)

- Auth:
  - `POST /api/auth/login`
  - `POST /api/auth/confirm-login`
- Books:
  - `POST /api/books/Create-Book` (PDF upload)
  - `GET /api/books/Download-Book/:id`
- Docs:
  - `GET /api-docs`

## Troubleshooting

### Frontend says “Too many attempts”
- Rate limiters may still be active in your local branch; disable auth/api limiter middleware in backend for local testing.

### OTP errors (`confirm-login`)
- Expired OTP: login again to generate a new OTP.
- Ensure browser preserves session cookie between `/login` and `/confirm-login`.

### MongoDB not connecting
- Verify `MONGO_URI` in `Backend/.env`.
- Check Atlas network access / credentials.

### Redis connection error
- Start Redis service.
- Verify `REDIS_URL` matches your local setup.

### Port conflicts
- Backend default: `3000`
- Frontend default: `4200`
- Stop existing processes or use a different port.

## Development Notes

- Backend reads env from `Backend/.env`.
- Keep sensitive secrets out of git.
- Use `npm run dev` for backend hot reload.
- Use `ng serve` for frontend live reload.

## Suggested Next Improvements

- Add automated tests for auth OTP flow and upload/download flow
- Add role-based local feature flags for Stripe-dependent endpoints
- Add Docker compose for Mongo + Redis + backend + frontend
- Add CI checks (lint + test + build)

## License

Internal/Project license (update as needed).
