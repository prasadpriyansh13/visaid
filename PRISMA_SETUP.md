# Prisma Setup & Database Configuration

## Overview

VisionAid uses Prisma ORM with Neon PostgreSQL for production database storage. User form data (name, email, phone) is saved to the cloud database.

## Prerequisites

1. **Neon PostgreSQL Database**
   - Sign up at [Neon](https://neon.tech)
   - Create a new project
   - Copy your connection string from the dashboard

2. **Environment Variables**
   - Set `DATABASE_URL` in your environment

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `@prisma/client` - Prisma Client for database queries
- `prisma` - Prisma CLI for migrations and schema management

### 2. Configure Database Connection

#### Local Development

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

Replace with your actual Neon connection string.

#### Production (Render)

1. Go to your Render dashboard
2. Navigate to your service → Environment
3. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon PostgreSQL connection string
4. Save changes

**Important**: Ensure your connection string includes `?sslmode=require` for SSL connection.

### 3. Run Database Migrations

#### First Time Setup

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migrations (for production)
npx prisma migrate deploy
```

**Note**: Use `prisma migrate deploy` (not `migrate dev`) for production deployments on Render.

#### On Render (Production)

Add a build command in Render dashboard:

```bash
npx prisma generate && npm run build
```

Or add a post-deploy script:

```bash
npx prisma migrate deploy
```

### 4. Verify Database Connection

#### Option 1: Prisma Studio (Recommended)

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
- View all users in the database
- Edit, delete, or add records
- See table structure and relationships

#### Option 2: Test API Endpoint

1. Start the development server: `npm run dev`
2. Submit the form on the landing page
3. Check Prisma Studio or query the database to verify the record was created

## Database Schema

### User Model

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  phone     String
  createdAt DateTime @default(now())
}
```

**Table**: `users` (mapped from `User` model)

**Fields**:
- `id`: Auto-incrementing primary key
- `name`: User's full name
- `email`: User's email address
- `phone`: User's phone number
- `createdAt`: Timestamp of record creation

## Production Deployment on Render

### Step 1: Set Environment Variable

1. In Render dashboard → Your Service → Environment
2. Add: `DATABASE_URL` = Your Neon connection string

### Step 2: Update Build Command

In Render dashboard → Your Service → Build Command:

```bash
npx prisma generate && npm run build
```

### Step 3: Add Post-Deploy Script (Optional)

In Render dashboard → Your Service → Post-Deploy Script:

```bash
npx prisma migrate deploy
```

### Step 4: Deploy

Render will:
1. Install dependencies
2. Generate Prisma Client
3. Build Next.js application
4. Run migrations (if post-deploy script is set)
5. Start the application

## Troubleshooting

### Database Connection Errors

**Error**: `P1001: Can't reach database server`

**Solution**:
- Verify `DATABASE_URL` is set correctly
- Check Neon dashboard for connection string
- Ensure connection string includes `?sslmode=require`
- Verify Neon database is running

### Migration Errors

**Error**: `Migration failed`

**Solution**:
- Ensure database is accessible
- Check connection string format
- Run `npx prisma migrate reset` (development only) if needed
- For production, use `npx prisma migrate deploy`

### Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npx prisma generate
```

## Useful Commands

```bash
# Generate Prisma Client
npx prisma generate

# View database in browser
npx prisma studio

# Create a new migration (development)
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (development only - deletes all data!)
npx prisma migrate reset

# Format Prisma schema
npx prisma format

# Validate Prisma schema
npx prisma validate
```

## Security Notes

- **Never commit `.env.local`** - It contains sensitive database credentials
- Use environment variables in production (Render dashboard)
- Connection strings should use SSL (`sslmode=require`)
- Keep Prisma schema in version control (it's safe to commit)

## API Endpoint

**POST** `/api/users`

Saves user form data to PostgreSQL database.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890"
}
```

**Success Response** (201 Created):
```json
{
  "message": "User data saved successfully",
  "userId": 1
}
```

**Error Responses**:
- `400` - Missing or invalid fields
- `409` - Email already exists
- `503` - Database connection error
- `500` - Internal server error

