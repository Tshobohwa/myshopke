# Design Document

## Overview

This design outlines the transformation of the MyShopKE backend from a traditional Express.js server to a Vercel-compatible serverless application. The solution maintains all existing functionality while adapting to Vercel's serverless architecture using API routes and optimized database connections.

## Architecture

### Current Architecture

- **Express.js Server**: Traditional server running on port 3001
- **Database**: PostgreSQL with Prisma ORM
- **Routes**: Organized into auth, public, buyer, and farmer endpoints
- **Middleware**: CORS, body parsing, error handling

### Target Vercel Architecture

- **Serverless Functions**: Each API route becomes a serverless function
- **API Routes Structure**: Vercel's file-based routing system
- **Database Connection**: Optimized for serverless with connection pooling
- **Middleware**: Adapted for serverless function execution

## Components and Interfaces

### 1. Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "backend/api/**/*.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/api/$1"
    }
  ],
  "functions": {
    "backend/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. API Routes Structure

```
backend/
├── api/
│   ├── auth/
│   │   ├── login.ts
│   │   ├── register.ts
│   │   └── refresh.ts
│   ├── public/
│   │   ├── listings.ts
│   │   └── categories.ts
│   ├── buyer/
│   │   └── [...slug].ts
│   ├── farmer/
│   │   └── [...slug].ts
│   └── health.ts
```

### 3. Shared Utilities

- **Database Connection**: Singleton pattern for Prisma client
- **Middleware Wrapper**: Function to apply Express middleware to Vercel functions
- **Error Handler**: Centralized error handling for serverless functions
- **CORS Handler**: Configurable CORS for each endpoint

### 4. Database Connection Management

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
```

## Data Models

### Environment Variables for Vercel

- `DATABASE_URL`: PostgreSQL connection string with connection pooling
- `JWT_SECRET`: JWT signing secret
- `JWT_REFRESH_SECRET`: Refresh token secret
- `FRONTEND_URL`: CORS origin configuration
- `NODE_ENV`: Environment setting

### Connection Pooling Configuration

```typescript
// Optimized for serverless
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}
```

## Error Handling

### 1. Centralized Error Handler

```typescript
export function withErrorHandler(handler: Function) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      console.error("API Error:", error);
      return res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Something went wrong",
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
}
```

### 2. HTTP Method Validation

```typescript
export function withMethods(methods: string[], handler: Function) {
  return (req: VercelRequest, res: VercelResponse) => {
    if (!methods.includes(req.method || "")) {
      return res.status(405).json({
        success: false,
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: `Method ${req.method} not allowed`,
        },
      });
    }
    return handler(req, res);
  };
}
```

## Testing Strategy

### 1. Local Development

- **Vercel CLI**: Use `vercel dev` for local testing
- **Environment Setup**: Local `.env` file for development
- **Database**: Local PostgreSQL or development database

### 2. Integration Testing

- **API Endpoints**: Test all existing endpoints work correctly
- **Database Operations**: Verify CRUD operations function properly
- **Authentication**: Ensure JWT functionality works in serverless environment

### 3. Performance Testing

- **Cold Start Optimization**: Measure and optimize function startup time
- **Database Connection**: Test connection pooling under load
- **Memory Usage**: Monitor function memory consumption

### 4. Deployment Testing

- **Preview Deployments**: Test on Vercel preview environments
- **Environment Variables**: Verify all secrets are properly configured
- **CORS Configuration**: Test frontend integration

## Migration Strategy

### Phase 1: Setup and Configuration

1. Create Vercel configuration files
2. Set up API routes structure
3. Create shared utilities and middleware

### Phase 2: Route Migration

1. Convert Express routes to Vercel API routes
2. Implement middleware wrappers
3. Test individual endpoints

### Phase 3: Database Optimization

1. Configure connection pooling
2. Optimize Prisma client for serverless
3. Test database operations

### Phase 4: Integration and Testing

1. End-to-end testing
2. Performance optimization
3. Production deployment

## Security Considerations

### 1. Environment Variables

- All secrets stored in Vercel environment variables
- No sensitive data in code or configuration files
- Separate environments for development and production

### 2. CORS Configuration

- Properly configured origins for frontend
- Secure headers for API responses
- Rate limiting considerations for serverless

### 3. Database Security

- Connection string security
- Connection pooling limits
- Query optimization to prevent timeouts

## Performance Optimizations

### 1. Bundle Size

- Tree shaking for unused dependencies
- Separate functions for different route groups
- Minimal imports in each function

### 2. Cold Start Reduction

- Prisma client optimization
- Minimal initialization code
- Shared utilities for common operations

### 3. Database Connections

- Connection pooling configuration
- Query optimization
- Proper connection cleanup
