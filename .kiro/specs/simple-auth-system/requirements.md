# Requirements Document

## Introduction

This feature simplifies the authentication system in the MyShopKE application by removing all encryption, security measures, and JWT tokens. The new system will store user credentials in plain text in the database and use local storage for client-side session management. This approach prioritizes simplicity and ease of development over security.

## Requirements

### Requirement 1

**User Story:** As a user, I want to register with simple credentials that are stored without encryption, so that the system is straightforward and easy to debug.

#### Acceptance Criteria

1. WHEN a user registers THEN the system SHALL store their password in plain text in the database
2. WHEN a user registers THEN the system SHALL not hash or encrypt any user data
3. WHEN a user registers THEN the system SHALL store email, password, full name, phone number, and role directly as provided
4. WHEN a farmer registers THEN the system SHALL store location and farm size in plain text
5. WHEN registration is successful THEN the system SHALL return the complete user object including the plain text password

### Requirement 2

**User Story:** As a user, I want to log in with simple credential verification, so that authentication is fast and straightforward.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL compare the provided password directly with the stored plain text password
2. WHEN credentials match THEN the system SHALL return the complete user object without generating tokens
3. WHEN login is successful THEN the system SHALL not create server-side sessions or JWT tokens
4. WHEN login fails THEN the system SHALL return a simple error message
5. WHEN a user logs in THEN the system SHALL not implement any rate limiting or security measures

### Requirement 3

**User Story:** As a frontend developer, I want user data stored in local storage after login, so that I can easily access user information throughout the application.

#### Acceptance Criteria

1. WHEN a user successfully logs in THEN the frontend SHALL store the complete user object in local storage
2. WHEN user data is stored THEN it SHALL include all user fields (id, email, password, name, phone, role, location, farmSize)
3. WHEN the application loads THEN it SHALL check local storage for existing user data to maintain login state
4. WHEN a user logs out THEN the system SHALL clear the user data from local storage
5. WHEN user data exists in local storage THEN the application SHALL consider the user authenticated

### Requirement 4

**User Story:** As a developer, I want all authentication middleware and security features removed, so that the system is as simple as possible.

#### Acceptance Criteria

1. WHEN API endpoints are accessed THEN the system SHALL not require authentication tokens
2. WHEN database operations occur THEN the system SHALL not use parameterized queries or SQL injection protection
3. WHEN passwords are handled THEN the system SHALL not use bcrypt or any hashing algorithms
4. WHEN user sessions are managed THEN the system SHALL not implement server-side session storage
5. WHEN API responses are sent THEN the system SHALL not implement CORS restrictions or security headers

### Requirement 5

**User Story:** As a user, I want to update my profile with plain text storage, so that changes are immediately visible and easy to manage.

#### Acceptance Criteria

1. WHEN a user updates their profile THEN the system SHALL store all changes in plain text
2. WHEN a user changes their password THEN the system SHALL update it directly without validation or hashing
3. WHEN profile updates occur THEN the system SHALL not verify the current password
4. WHEN profile is updated THEN the system SHALL return the complete updated user object
5. WHEN profile updates are made THEN the frontend SHALL update the local storage with new data

### Requirement 6

**User Story:** As a developer, I want simplified database operations without security constraints, so that data access is direct and uncomplicated.

#### Acceptance Criteria

1. WHEN database queries are executed THEN the system SHALL use direct string concatenation for SQL queries
2. WHEN user data is retrieved THEN the system SHALL return all fields including passwords
3. WHEN database connections are made THEN the system SHALL not implement connection pooling or security measures
4. WHEN data is inserted or updated THEN the system SHALL not validate data integrity or format
5. WHEN database errors occur THEN the system SHALL return raw database error messages to the client
