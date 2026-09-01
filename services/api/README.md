# services/api/README.md

# TokFriends API

NestJS + Prisma + PostgreSQL 기반 백엔드 API

## Setup

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
pnpm prisma:generate

# Push schema to database
pnpm prisma:push

# Seed initial data
pnpm prisma:seed

# Run development server
pnpm start:dev


Scripts

pnpm start - Production server
pnpm start:dev - Development server with hot reload
pnpm build - Build for production
pnpm prisma:generate - Generate Prisma client
pnpm prisma:push - Push schema changes to database
pnpm prisma:seed - Seed database with initial topics
pnpm heroku-build - Koyeb/Heroku build script

Deployment (Koyeb)

Connect GitHub repository
Set build command: npm run heroku-build
Set run command: npm start
Set environment variables:

DATABASE_URL - PostgreSQL connection string
JWT_SECRET - Secret key for JWT
CORS_ORIGIN - Comma-separated allowed origins


Deploy

API Endpoints
Auth

POST /auth/signup/email - Email signup
POST /auth/login/email - Email login

Topics

GET /topics - List all topics with post counts

Posts

POST /posts - Create new post (requires auth)
GET /topics/:id/posts - List posts by topic

Community

POST /community/report - Report user or post (requires auth)
POST /community/block - Block user (requires auth)

Users

GET /users/:id - Get user info (requires auth)

Testing with cURL
1. Email Signup
bashcurl -X POST http://localhost:8000/auth/signup/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "dob": "1995-01-01",
    "gender": "male"
  }'
2. Email Login
bashcurl -X POST http://localhost:8000/auth/login/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
3. Get Topics
bashcurl http://localhost:8000/topics
4. Create Post (with Bearer token)
bashcurl -X POST http://localhost:8000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "topicId": "TOPIC_ID_HERE",
    "content": "This is my first post!"
  }'
5. Get Posts by Topic
bashcurl "http://localhost:8000/topics/TOPIC_ID_HERE/posts?take=20"
6. Report User/Post
bashcurl -X POST http://localhost:8000/community/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "targetUserId": "USER_ID_HERE",
    "reason": "Inappropriate behavior"
  }'
7. Block User
bashcurl -X POST http://localhost:8000/community/block \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "blockedUserId": "USER_ID_TO_BLOCK"
  }'
Swagger Documentation
Access Swagger UI at: http://localhost:8000/docs
Environment Variables

DATABASE_URL - PostgreSQL connection string (required)
JWT_SECRET - Secret for JWT signing (required)
CORS_ORIGIN - Allowed CORS origins (optional, comma-separated)
PORT - Server port (default: 8000)

Project Structure
services/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── types/
│   │   └── express.d.ts
│   └── modules/
│       ├── auth/
│       ├── users/
│       ├── health/
│       ├── topics/
│       ├── posts/
│       └── community/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── package.json
├── tsconfig.json
└── .env.example

