# WiserPin API

NestJS backend API with Clerk authentication, Prisma ORM, and PostgreSQL.

## Features

- ✅ NestJS framework with TypeScript
- ✅ Clerk authentication with JWT verification
- ✅ Prisma ORM with PostgreSQL
- ✅ Multi-tenancy (user data isolation)
- ✅ Swagger/OpenAPI documentation
- ✅ CORS configuration
- ✅ Input validation with class-validator
- ✅ Collections CRUD API
- ✅ Pins CRUD API with duplicate URL detection
- ✅ Docker Compose for local Postgres

## Prerequisites

- Node.js 18+
- pnpm
- Docker (for PostgreSQL)
- Clerk account

## Getting Started

### 1. Setup Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or use existing one
3. Copy your **Secret Key** and **Publishable Key**

### 2. Setup Environment Variables

Create a `.env` file in the `apps/api` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
PORT=3001
NODE_ENV=development

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wiserpin?schema=public"

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Start PostgreSQL

```bash
docker-compose up -d
```

This will start PostgreSQL on `localhost:5432`.

### 4. Install Dependencies

From the monorepo root:

```bash
pnpm install
```

### 5. Setup Database

Generate Prisma Client and push schema to database:

```bash
pnpm --filter @wiserpin/api db:generate
pnpm --filter @wiserpin/api db:push
```

### 6. Run Development Server

```bash
pnpm --filter @wiserpin/api dev
```

The API will be available at:
- **API**: http://localhost:3001
- **Swagger Docs**: http://localhost:3001/api

## API Endpoints

### Health Check
- `GET /` - API root
- `GET /health` - Health check with database status

### Collections
All endpoints require Bearer token authentication.

- `POST /collections` - Create a collection
- `GET /collections` - List all collections
- `GET /collections/:id` - Get single collection with pins
- `PATCH /collections/:id` - Update collection
- `DELETE /collections/:id` - Delete collection

### Pins
All endpoints require Bearer token authentication.

- `POST /pins` - Create a pin (with duplicate URL check)
- `GET /pins` - List all pins (optional `?collectionId=xxx` filter)
- `GET /pins/:id` - Get single pin
- `PATCH /pins/:id` - Update pin
- `DELETE /pins/:id` - Delete pin

## Database Schema

### Users
- `id` (String, PK) - Clerk user ID
- `email` (String, unique)
- `firstName`, `lastName` (String, optional)
- `imageUrl` (String, optional)
- Timestamps

### Collections
- `id` (UUID, PK)
- `name` (String, required)
- `description`, `color`, `icon` (String, optional)
- `userId` (String, FK to Users)
- Timestamps

### Pins
- `id` (UUID, PK)
- `url` (String, required)
- `title` (String, required)
- `description`, `imageUrl`, `favicon` (String, optional)
- `tags` (String array)
- `userId` (String, FK to Users)
- `collectionId` (UUID, FK to Collections, optional)
- Timestamps
- Unique constraint on `[userId, url]`

## Prisma Commands

```bash
# Generate Prisma Client
pnpm --filter @wiserpin/api db:generate

# Push schema changes to database (no migration files)
pnpm --filter @wiserpin/api db:push

# Create migration
pnpm --filter @wiserpin/api db:migrate

# Open Prisma Studio (database GUI)
pnpm --filter @wiserpin/api db:studio
```

## Authentication

All protected endpoints require a Bearer token from Clerk:

```bash
Authorization: Bearer <clerk-jwt-token>
```

The API validates the token using Clerk's SDK and extracts the user ID.

## Multi-Tenancy

All data is scoped to the authenticated user:
- Users can only access their own collections and pins
- `userId` is automatically set from the JWT token
- Foreign key constraints ensure data integrity

## Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (accessing another user's data)
- `404` - Not Found
- `409` - Conflict (duplicate URL)
- `500` - Internal Server Error

## Development

### Stop PostgreSQL

```bash
docker-compose down
```

### Reset Database

```bash
docker-compose down -v  # Remove volumes
docker-compose up -d
pnpm --filter @wiserpin/api db:push
```

### View Logs

```bash
docker-compose logs -f postgres
```

## Production Deployment

For production, use `db:migrate` instead of `db:push` to create migration files:

```bash
pnpm --filter @wiserpin/api db:migrate
```

## Next Steps

- [ ] Connect web app to API
- [ ] Implement cloud sync in extension
- [ ] Add search functionality
- [ ] Add analytics endpoints
- [ ] Add rate limiting
- [ ] Add caching layer
