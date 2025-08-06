# Implementation Plan

- [x] 1. Remove security dependencies and update package.json



  - Remove bcryptjs, @types/bcryptjs, jsonwebtoken, @types/jsonwebtoken, helmet, express-rate-limit, cookie-parser packages
  - Update package.json to remove security-related dependencies
  - Run npm install to update node_modules
  - _Requirements: 4.3, 4.4, 4.5_



- [ ] 2. Create database migration to remove security tables

  - Create Prisma migration to drop sessions table
  - Create Prisma migration to drop audit_logs table
  - Update schema.prisma to remove Session and AuditLog models


  - Run migration to apply database changes
  - _Requirements: 6.1, 6.2_

- [ ] 3. Simplify AuthUtils class to remove all security functions

  - Remove JWT token generation and verification methods


  - Remove password hashing and comparison methods
  - Remove token extraction and validation methods
  - Keep only basic utility functions like email validation
  - _Requirements: 4.3, 4.4_

- [x] 4. Remove authentication middleware completely



  - Delete authenticate middleware function
  - Delete role-based authorization middleware
  - Remove all middleware imports from routes
  - Update route definitions to remove authentication requirements
  - _Requirements: 4.1, 4.2_



- [ ] 5. Simplify AuthController for plain text operations

  - Rewrite register method to store passwords in plain text
  - Rewrite login method to compare plain text passwords directly
  - Remove token generation from all authentication methods
  - Update response format to return complete user objects including passwords

  - Remove password validation and hashing logic
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 2.3_

- [ ] 6. Remove AuthService class entirely

  - Delete AuthService class file
  - Remove AuthService imports from controllers


  - Move any remaining logic directly to AuthController
  - Update controllers to use direct Prisma queries
  - _Requirements: 4.4_

- [ ] 7. Update profile management for simplified access

  - Modify updateProfile method to not require authentication

  - Remove current password verification for profile updates
  - Allow direct password changes without validation
  - Return complete user object after updates
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Remove security middleware from server configuration



  - Remove helmet middleware from server.ts
  - Remove rate limiting middleware
  - Remove CORS restrictions
  - Remove cookie parser middleware
  - Simplify server setup to basic Express configuration
  - _Requirements: 4.2, 4.5_


- [ ] 9. Update all API routes to remove authentication

  - Remove authentication middleware from farmer routes
  - Remove authentication middleware from buyer routes
  - Remove authentication middleware from protected endpoints
  - Make all endpoints publicly accessible
  - _Requirements: 4.1_


- [ ] 10. Implement frontend local storage authentication

  - Create login function that stores user data in localStorage
  - Create getCurrentUser function to retrieve user from localStorage
  - Create logout function to clear localStorage
  - Update authentication context to use localStorage instead of tokens
  - Remove token-based authentication from API calls


  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11. Update database queries to use direct string operations

  - Replace parameterized queries with direct string concatenation
  - Remove input sanitization from database operations
  - Update Prisma queries to use raw SQL where possible



  - Remove data validation before database operations
  - _Requirements: 6.1, 6.3, 6.4_

- [ ] 12. Simplify error handling and responses

  - Replace complex error handling with basic JSON responses
  - Remove security-related error messages
  - Update all endpoints to use simple success/error format
  - Remove error logging and audit trails
  - Return raw database errors to client
  - _Requirements: 6.5_

- [ ] 13. Create tests for simplified authentication system

  - Write tests for plain text password registration
  - Write tests for plain text password login
  - Write tests for profile updates without authentication
  - Write tests for localStorage integration
  - Remove all security-related tests
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1_

- [ ] 14. Update API documentation for simplified endpoints
  - Document new request/response formats
  - Remove authentication requirements from endpoint documentation
  - Update examples to show plain text operations
  - Document localStorage usage for frontend integration
  - _Requirements: 1.5, 2.4, 3.5_
