# Design Document

## Overview

This design completely removes all security measures from the MyShopKE authentication system, implementing a plain text storage approach with local storage-based session management. The system will eliminate JWT tokens, password hashing, authentication middleware, and all security validations to create the simplest possible authentication flow.

## Architecture

### Current vs. Simplified Authentication Flow

**Current Flow:**

1. User submits credentials → Validation → Password hashing → JWT generation → Database storage → Token response
2. Subsequent requests → Token verification → User lookup → Authorization

**Simplified Flow:**

1. User submits credentials → Direct database storage (plain text) → Complete user object response
2. Subsequent requests → No authentication required → Direct data access

### System Components to Remove

- JWT token generation and verification
- bcrypt password hashing
- Authentication middleware
- Session management (server-side)
- Rate limiting
- CORS protection
- Input validation
- SQL injection protection

## Components and Interfaces

### Modified AuthController

The AuthController will be simplified to handle basic CRUD operations:

```typescript
export class AuthController {
  // Simplified registration - no validation or hashing
  static async register(req: Request, res: Response): Promise<void> {
    const { email, password, fullName, phoneNumber, role, location, farmSize } =
      req.body;

    // Direct database insertion without validation
    const user = await prisma.user.create({
      data: {
        email,
        password, // Plain text storage
        fullName,
        phoneNumber,
        role,
        profile: {
          create: {
            location: location || null,
            farmSize: farmSize || null,
          },
        },
      },
      include: { profile: true },
    });

    // Return complete user object including password
    res.json({ success: true, user });
  }

  // Simplified login - direct password comparison
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    // Direct query without parameterization
    const user = await prisma.user.findFirst({
      where: { email, password }, // Plain text comparison
      include: { profile: true },
    });

    if (user) {
      res.json({ success: true, user });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  }

  // Simplified profile update - no authentication required
  static async updateProfile(req: Request, res: Response): Promise<void> {
    const { userId, ...updates } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
      include: { profile: true },
    });

    res.json({ success: true, user });
  }
}
```

### Removed AuthService

The AuthService class will be completely removed as all authentication logic moves directly to the controller.

### Simplified AuthUtils

The AuthUtils class will be reduced to basic helper functions:

```typescript
export class AuthUtils {
  // Remove all JWT and hashing methods
  // Keep only basic utility functions if needed

  static validateEmail(email: string): boolean {
    // Basic email format check (optional)
    return email.includes("@");
  }
}
```

### Removed Authentication Middleware

All authentication middleware will be removed:

- `authenticate` middleware
- Role-based authorization
- Token verification
- Session validation

### Frontend Local Storage Integration

The frontend will handle authentication state using local storage:

```typescript
// Login function
const login = async (email: string, password: string) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    // Store complete user object in local storage
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  }

  throw new Error(data.message);
};

// Get current user from local storage
const getCurrentUser = () => {
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
};

// Logout function
const logout = () => {
  localStorage.removeItem("user");
};
```

## Data Models

### Modified User Model

The User model remains largely the same but with simplified usage:

```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String   // Plain text storage
  role        UserRole
  fullName    String
  phoneNumber String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations remain the same
  profile         UserProfile?
  produceListings ProduceListing[]
  // ... other relations
}
```

### Removed Models

The following models will be removed as they're security-related:

- `Session` model (no server-side sessions)
- `AuditLog` model (no security logging)

### Database Migration

A migration will be needed to:

1. Drop the `sessions` table
2. Drop the `audit_logs` table
3. Update existing hashed passwords to plain text (if needed)

## Error Handling

### Simplified Error Responses

All error handling will be simplified to basic JSON responses:

```typescript
// Success response
{ success: true, user: {...}, data: {...} }

// Error response
{ success: false, message: "Error description" }
```

### Removed Error Types

The following error handling will be removed:

- JWT token errors
- Authentication errors
- Authorization errors
- Validation errors
- Rate limiting errors
- Security-related errors

## API Endpoints

### Modified Authentication Endpoints

```typescript
// POST /api/auth/register
// Body: { email, password, fullName, phoneNumber, role, location?, farmSize? }
// Response: { success: true, user: {...} }

// POST /api/auth/login
// Body: { email, password }
// Response: { success: true, user: {...} }

// PUT /api/auth/profile
// Body: { userId, ...updates }
// Response: { success: true, user: {...} }

// No logout endpoint needed (handled by frontend)
```

### Removed Endpoints

- `/api/auth/refresh` (no tokens)
- `/api/auth/logout` (no server sessions)
- `/api/auth/verify` (no token verification)

### Open API Access

All other API endpoints will be accessible without authentication:

- Farmer endpoints (create/read/update/delete listings)
- Buyer endpoints (search/view listings)
- Public endpoints (categories, locations)

## Testing Strategy

### Simplified Testing

Testing will focus on basic functionality:

```typescript
describe("Simplified Auth", () => {
  test("should register user with plain text password", async () => {
    const userData = {
      email: "test@example.com",
      password: "simple123",
      fullName: "Test User",
      phoneNumber: "1234567890",
      role: "FARMER",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(userData);

    expect(response.body.success).toBe(true);
    expect(response.body.user.password).toBe("simple123");
  });

  test("should login with plain text password comparison", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "simple123" });

    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe("test@example.com");
  });
});
```

### Removed Test Categories

- Security tests
- JWT token tests
- Authentication middleware tests
- Rate limiting tests
- Input validation tests

## Security Considerations

### Intentionally Removed Security

This design intentionally removes all security measures:

- No password hashing (bcrypt removed)
- No JWT tokens (jsonwebtoken removed)
- No input validation (zod validation removed)
- No SQL injection protection
- No rate limiting
- No CORS protection
- No authentication middleware
- No session management
- No audit logging

### Development Environment Only

This simplified system should only be used in development environments where security is not a concern. The plain text password storage and lack of authentication make it unsuitable for any production use.

## Dependencies to Remove

The following npm packages can be removed:

- `bcryptjs` and `@types/bcryptjs`
- `jsonwebtoken` and `@types/jsonwebtoken`
- `helmet` (security headers)
- `express-rate-limit` (rate limiting)
- `cookie-parser` (session cookies)

## Migration Strategy

1. Remove authentication middleware from all routes
2. Update AuthController to use plain text operations
3. Remove AuthService class
4. Simplify AuthUtils class
5. Drop security-related database tables
6. Update frontend to use local storage
7. Remove security-related dependencies
8. Update API documentation
