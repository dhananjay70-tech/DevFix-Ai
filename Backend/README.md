# DevFix AI - Core Backend

Production-ready core business backend for DevFix AI built with Node.js, Express.js, PostgreSQL, and Prisma ORM.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT & bcryptjs
- **Security & Logging**: Helmet, CORS, Morgan

## Project Structure
```
Backend/
├── src/
│   ├── config/          # Database client & app configuration
│   ├── controllers/     # Route request handlers
│   ├── middleware/      # Auth & error handling middlewares
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic & Prisma queries
│   ├── utils/           # Async handler & helper utilities
│   ├── app.js           # Express app setup
│   └── server.js        # Server listener entry point
├── prisma/
│   └── schema.prisma    # Data models (User, Repository, Issue, AgentRun, PullRequest, Approval, ActivityLog)
├── .env.example
├── package.json
└── README.md
```

## Setup Instructions

1. **Install dependencies**:
   ```bash
   cd Backend
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and configure your PostgreSQL connection string:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devfix_db?schema=public"
   PORT=5000
   JWT_SECRET="your_secure_jwt_secret"
   ```

3. **Prisma Setup & Migrations**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

## API Endpoints Summary

- **Health**: `GET /api/health`
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Users**: `GET /api/users/profile`, `PUT /api/users/profile`
- **Repositories**: `GET /api/repositories`, `POST /api/repositories`, `GET /api/repositories/:id`, `PUT /api/repositories/:id`, `DELETE /api/repositories/:id`
- **Issues**: `GET /api/issues`, `POST /api/issues`, `GET /api/issues/:id`, `PUT /api/issues/:id`, `DELETE /api/issues/:id`
- **Agent Runs**: `GET /api/agent-runs`, `POST /api/agent-runs`, `GET /api/agent-runs/:id`, `PUT /api/agent-runs/:id`
- **Pull Requests**: `GET /api/pull-requests`, `POST /api/pull-requests`, `GET /api/pull-requests/:id`, `PUT /api/pull-requests/:id`
- **Approvals**: `GET /api/approvals`, `POST /api/approvals`, `GET /api/approvals/:id`, `PUT /api/approvals/:id`
- **Activity Logs**: `GET /api/activity`, `POST /api/activity`
