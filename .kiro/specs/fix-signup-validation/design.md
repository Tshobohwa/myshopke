# Design Document

## Overview

This design addresses the signup validation error by aligning the Zod validation middleware with the existing disabled password validation policy. The core issue is that while `AuthUtils.validatePasswordStrength()` has been modified to allow weak passwords, the Zod schema in the validation middleware still enforces strong password requirements, creating a conflict that prevents user registration.

## Architecture

### Current Architecture Issue

The authentication system has two validation layers:

1. **Zod Schema Validation** (middleware/validation.ts) - Currently enforces strong passwords
2. **AuthUtils Validation** (utils/auth.ts) - Modified to allow weak passwords

This creates a validation conflict where users are blocked at the middleware level before reaching the AuthUtils validation.

### Proposed Architecture

Align both validation layers to consistently allow weak passwords:

1. **Zod Schema Validation** - Modified to accept any non-empty password
2. **AuthUtils Validation** - Already configured to allow weak passwords
3. **Security Layer** - Password hashing and other security measures remain intact

## Components and Interfaces

### Modified Components

#### 1. Validation Middleware (`backend/src/middleware/validation.ts`)

**Current Password Schema:**

```typescript
password: z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    "Password must contain at least one special character"
  );
```

**Proposed Password Schema:**

```typescript
password: z.string().min(1, "Password is required");
```

#### 2. Authentication Schemas

**Registration Schema Update:**

- Remove complex password validation
- Maintain all other field validations (email, phone, role, etc.)
- Keep conditional validation for farmer-specific fields

**Change Password Schema Update:**

- Update newPassword validation to use simplified schema
- Maintain currentPassword requirement

### Unchanged Components

#### 1. AuthUtils (`backend/src/utils/auth.ts`)

- `validatePasswordStrength()` method already allows weak passwords
- `hashPassword()` method continues to securely hash all passwords
- JWT token generation remains unchanged

#### 2. AuthController (`backend/src/controllers/auth.ts`)

- Registration logic remains the same
- Password hashing continues to use bcrypt
- Token generation and session management unchanged

#### 3. Database Layer

- User model and password storage unchanged
- Session management remains intact
- All security measures at database level preserved

## Data Models

### No Changes Required

The existing data models remain unchanged:

- User model password field continues to store bcrypt hashes
- Session model for refresh token storage unchanged
- Profile model for user-specific data unchanged

### Validation Response Structure

**Current Error Response (causing issues):**

```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    details: [
      {
        field: "password",
        message: "Password must be at least 8 characters",
        code: "too_small"
      },
      // ... more password validation errors
    ]
  }
}
```

**Expected Success Response:**

```typescript
{
  success: true,
  data: {
    user: { /* user data without password */ },
    tokens: {
      accessToken: "jwt_token",
      refreshToken: "refresh_token"
    }
  }
}
```

## Error Handling

### Simplified Error Scenarios

With password validation relaxed, the following error scenarios are eliminated:

- Password too short errors
- Missing character type errors (uppercase, lowercase, numbers, special chars)
- Password complexity requirement errors

### Maintained Error Scenarios

The following validation errors remain active and important:

- **Email Validation**: Invalid email format, duplicate email
- **Required Fields**: Missing email, password, fullName, phoneNumber, role
- **Phone Number**: Invalid Kenyan phone format
- **Role Validation**: Invalid user role (must be FARMER or BUYER)
- **Farmer-Specific**: Missing location for farmer role
- **Database Errors**: Connection issues, constraint violations

### Error Processing Flow

1. **Zod Validation** (middleware) - Basic field presence and format
2. **Business Logic** (controller) - Duplicate email check, database operations
3. **Security Processing** - Password hashing, token generation
4. **Response** - Success with tokens or specific error messages

## Security Implementation

### Maintained Security Measures

Even with relaxed password validation, all security measures remain intact:

#### 1. Password Security

- **Hashing**: All passwords hashed with bcrypt (salt rounds: 12)
- **Storage**: No plain text passwords stored
- **Verification**: Secure password comparison using bcrypt

#### 2. JWT Token Security

- **Access Tokens**: 24-hour expiry with HS256 signing
- **Refresh Tokens**: 7-day expiry with secure storage
- **Token Validation**: Proper signature verification

#### 3. API Security

- **CORS**: Configured for specific frontend domains
- **Rate Limiting**: Brute force protection remains active
- **Input Sanitization**: All other inputs properly validated
- **SQL Injection Prevention**: Prisma ORM protection

#### 4. Session Management

- **Secure Storage**: Refresh tokens stored in database
- **Expiry Handling**: Automatic token cleanup
- **Session Tracking**: User session management

### Security Trade-offs

**Relaxed Security:**

- Users can choose weak passwords
- No enforcement of password complexity

**Maintained Security:**

- All passwords still securely hashed
- Authentication and authorization unchanged
- API security measures intact
- Database security preserved

## Testing Strategy

### Unit Testing

#### 1. Validation Middleware Tests

- Test that weak passwords pass Zod validation
- Verify other field validations remain strict
- Test error message accuracy for non-password fields

#### 2. Integration Tests

- Test complete registration flow with weak passwords
- Verify password hashing works with simple passwords
- Test login functionality with weak passwords

#### 3. Security Tests

- Verify bcrypt hashing for all password types
- Test JWT token generation and validation
- Confirm other security measures remain active

### Test Cases

#### Password Validation Tests

```typescript
// Should pass validation
const weakPasswords = ["123", "a", "password", "test"];
weakPasswords.forEach((password) => {
  // Test Zod schema accepts weak password
  // Test registration succeeds
  // Test password is properly hashed
  // Test login works with weak password
});
```

#### Email Validation Tests

```typescript
// Should fail validation
const invalidEmails = ["invalid", "@domain.com", "user@"];
// Should pass validation
const validEmails = ["user@domain.com", "test@example.org"];
```

#### Registration Flow Tests

```typescript
// Test complete registration with weak password
const registrationData = {
  email: "test@example.com",
  password: "123", // weak password
  fullName: "Test User",
  phoneNumber: "+254712345678",
  role: "BUYER",
};
// Should succeed and return tokens
```

### Error Handling Tests

#### 1. Validation Error Tests

- Test specific error messages for invalid email
- Test required field validation
- Test role-specific validation (farmer location requirement)

#### 2. Business Logic Error Tests

- Test duplicate email registration attempt
- Test database connection error handling
- Test token generation error scenarios
