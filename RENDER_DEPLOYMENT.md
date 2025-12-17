# Render Deployment Guide for VisionAid

## Prerequisites

1. **Neon PostgreSQL Database**
   - Create account at [Neon](https://neon.tech)
   - Create a new project
   - Copy the connection string (includes `?sslmode=require`)

2. **Render Account**
   - Sign up at [Render](https://render.com)

## Step-by-Step Deployment

### 1. Create New Web Service on Render

1. Go to Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (or deploy from public repo)
4. Configure service:
   - **Name**: `visaid` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (project root)
   - **Runtime**: `Node`
   - **Build Command**: `npx prisma generate && npm run build`
   - **Start Command**: `npm start`

### 2. Set Environment Variables

In Render dashboard → Your Service → Environment:

Add these variables:

| Key | Value | Description |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Your Neon PostgreSQL connection string |
| `NEXT_PUBLIC_API_URL` | `https://...` | Your ESP32 API endpoint on Render |

**Important**: 
- `DATABASE_URL` must include `?sslmode=require` for SSL
- Never commit `.env` files to Git

### 3. Database Migration

#### Option A: Post-Deploy Script (Recommended)

In Render dashboard → Your Service → Post-Deploy Script:

```bash
npx prisma migrate deploy
```

This runs migrations automatically after each deployment.

#### Option B: Manual Migration

After first deployment, SSH into your service or use Render Shell:

```bash
npx prisma migrate deploy
```

### 4. Deploy

1. Click "Save Changes" in Render dashboard
2. Render will:
   - Install dependencies (`npm install`)
   - Generate Prisma Client (`npx prisma generate`)
   - Build Next.js app (`npm run build`)
   - Run migrations (if post-deploy script is set)
   - Start the application

### 5. Verify Deployment

1. **Check Service Health**
   - Render dashboard shows service status
   - Green = Running
   - Check logs for any errors

2. **Test Landing Page**
   - Visit your Render URL: `https://your-service.onrender.com`
   - Submit the form with test data

3. **Verify Database**
   - Run locally: `npx prisma studio`
   - Or query database directly via Neon dashboard
   - Confirm user record was created

## Build Configuration Summary

**Build Command**:
```bash
npx prisma generate && npm run build
```

**Start Command**:
```bash
npm start
```

**Post-Deploy Script** (optional):
```bash
npx prisma migrate deploy
```

## Environment Variables Checklist

- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `NEXT_PUBLIC_API_URL` - ESP32 API endpoint

## Troubleshooting

### Build Fails: "Cannot find module '@prisma/client'"

**Solution**: Ensure build command includes `npx prisma generate`:
```bash
npx prisma generate && npm run build
```

### Database Connection Error

**Symptoms**: `P1001: Can't reach database server`

**Solutions**:
1. Verify `DATABASE_URL` is set correctly in Render
2. Check connection string includes `?sslmode=require`
3. Verify Neon database is running
4. Check Neon firewall/network settings

### Migration Errors

**Symptoms**: `Migration failed` or `Migration not found`

**Solutions**:
1. Ensure migrations exist: `prisma/migrations/` directory
2. Run `npx prisma migrate deploy` manually
3. Check database permissions in Neon
4. Verify `DATABASE_URL` is accessible

### Service Crashes on Start

**Check**:
1. Render logs for error messages
2. Verify all environment variables are set
3. Check Prisma Client is generated (should be in build output)
4. Ensure database is accessible

## Monitoring

### View Logs

1. Render dashboard → Your Service → Logs
2. Check for:
   - Prisma Client generation success
   - Database connection status
   - API errors

### Database Monitoring

- **Neon Dashboard**: View database metrics, connections, queries
- **Prisma Studio**: Run locally to view data: `npx prisma studio`

## Production Checklist

Before going live:

- [ ] `DATABASE_URL` is set in Render environment
- [ ] `NEXT_PUBLIC_API_URL` is set correctly
- [ ] Database migrations have been applied
- [ ] Test form submission works
- [ ] Data appears in database (verify via Prisma Studio)
- [ ] Service is running without errors
- [ ] SSL is enabled (Render provides this automatically)

## Cost Considerations

- **Render Free Tier**: 
  - Web services spin down after 15 minutes of inactivity
  - First request may be slow (cold start)
  - Consider paid tier for production

- **Neon Free Tier**:
  - 0.5 GB storage
  - Sufficient for development and small production use

## Support

- **Render Docs**: https://render.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Neon Docs**: https://neon.tech/docs

