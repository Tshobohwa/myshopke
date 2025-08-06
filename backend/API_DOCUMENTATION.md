# MyShopKE API Documentation - Simplified Authentication System

## Overview

This API uses a simplified authentication system with plain text password storage and local storage-based session management. **This system is designed for development environments only and should not be used in production.**

## Base URL

```
http://localhost:3001/api
```

## Authentication

The API uses local storage for session management. No JWT tokens or server-side sessions are required.

### Frontend Integration

Store user data in localStorage after successful login:

```javascript
// Login function
const login = async (email, password) => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.success) {
    localStorage.setItem("user", JSON.stringify(data.user));
    return data.user;
  }

  throw new Error(data.message);
};

// Get current user
const getCurrentUser = () => {
  const userData = localStorage.getItem("user");
  return userData ? JSON.parse(userData) : null;
};

// Logout
const logout = () => {
  localStorage.removeItem("user");
};
```

## Response Format

All endpoints return a simple JSON response:

**Success Response:**

```json
{
  "success": true,
  "user": {
    /* user object */
  },
  "data": {
    /* additional data */
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error description"
}
```

## Authentication Endpoints

### POST /auth/register

Register a new user with plain text password storage.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "anypassword",
  "fullName": "John Doe",
  "phoneNumber": "1234567890",
  "role": "FARMER",
  "location": "Nairobi",
  "farmSize": 5.5
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "password": "anypassword",
    "fullName": "John Doe",
    "phoneNumber": "1234567890",
    "role": "FARMER",
    "isActive": true,
    "profile": {
      "location": "Nairobi",
      "farmSize": 5.5
    }
  }
}
```

### POST /auth/login

Login with plain text password comparison.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "anypassword"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "password": "anypassword",
    "fullName": "John Doe",
    "phoneNumber": "1234567890",
    "role": "FARMER",
    "isActive": true,
    "profile": {
      "location": "Nairobi",
      "farmSize": 5.5
    }
  }
}
```

### GET /auth/profile

Get user profile by ID.

**Query Parameters:**

- `userId` (required): User ID

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "password": "anypassword",
    "fullName": "John Doe",
    "phoneNumber": "1234567890",
    "role": "FARMER",
    "isActive": true,
    "profile": {
      "location": "Nairobi",
      "farmSize": 5.5
    }
  }
}
```

### PUT /auth/profile

Update user profile without authentication.

**Request Body:**

```json
{
  "userId": "user_id",
  "fullName": "Updated Name",
  "phoneNumber": "9876543210",
  "location": "Mombasa",
  "farmSize": 10.0
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "password": "anypassword",
    "fullName": "Updated Name",
    "phoneNumber": "9876543210",
    "role": "FARMER",
    "isActive": true,
    "profile": {
      "location": "Mombasa",
      "farmSize": 10.0
    }
  }
}
```

### PUT /auth/change-password

Change user password without validation.

**Request Body:**

```json
{
  "userId": "user_id",
  "newPassword": "newpassword"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "password": "newpassword",
    "fullName": "John Doe",
    "phoneNumber": "1234567890",
    "role": "FARMER",
    "isActive": true,
    "profile": {
      "location": "Nairobi",
      "farmSize": 5.5
    }
  }
}
```

## Farmer Endpoints

All farmer endpoints are now public and require `farmerId` parameter.

### GET /farmer/listings

Get farmer's listings.

**Query Parameters:**

- `farmerId` (required): Farmer's user ID

### POST /farmer/listings

Create new produce listing.

**Request Body:**

```json
{
  "farmerId": "farmer_user_id",
  "cropType": "Tomatoes",
  "quantity": 100,
  "unit": "kg",
  "pricePerUnit": 50,
  "harvestDate": "2024-01-15",
  "location": "Nairobi",
  "description": "Fresh organic tomatoes"
}
```

### PUT /farmer/listings/:id

Update farmer's listing.

**Request Body:**

```json
{
  "farmerId": "farmer_user_id",
  "cropType": "Updated Tomatoes",
  "quantity": 150,
  "pricePerUnit": 60
}
```

### DELETE /farmer/listings/:id

Delete farmer's listing.

**Request Body:**

```json
{
  "farmerId": "farmer_user_id"
}
```

### GET /farmer/dashboard

Get farmer dashboard data.

**Query Parameters:**

- `farmerId` (required): Farmer's user ID

## Buyer Endpoints

All buyer endpoints are now public and require `buyerId` parameter where applicable.

### GET /buyer/listings

Get all active listings with filtering.

**Query Parameters:**

- `search`: Search term
- `location`: Filter by location
- `crop`: Filter by crop type
- `page`: Page number
- `limit`: Items per page

### GET /buyer/listings/search

Advanced search for listings.

**Query Parameters:**

- `query`: Search query
- `location`: Location filter
- `cropType`: Crop type filter
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `harvestDateFrom`: Start date
- `harvestDateTo`: End date

### GET /buyer/preferences

Get buyer preferences.

**Query Parameters:**

- `userId` (required): Buyer's user ID

### POST /buyer/preferences

Save buyer preferences.

**Request Body:**

```json
{
  "userId": "buyer_user_id",
  "searchFilters": {
    "location": "Nairobi",
    "cropType": "Tomatoes"
  },
  "savedListings": ["listing_id_1", "listing_id_2"]
}
```

### POST /buyer/interactions

Log buyer-farmer interactions.

**Request Body:**

```json
{
  "buyerId": "buyer_user_id",
  "listingId": "listing_id",
  "type": "VIEW",
  "metadata": {
    "source": "search_results"
  }
}
```

### GET /buyer/dashboard

Get buyer dashboard data.

**Query Parameters:**

- `buyerId` (required): Buyer's user ID

## Public Endpoints

These endpoints remain unchanged and don't require authentication.

### GET /public/categories

Get all categories.

### GET /public/locations

Get all locations.

### GET /public/listings

Get public listings.

**Query Parameters:**

- `limit`: Number of listings to return

## Security Considerations

⚠️ **WARNING**: This simplified authentication system:

- Stores passwords in plain text
- Has no authentication middleware
- Returns passwords in API responses
- Has no rate limiting
- Has no input validation
- Has no SQL injection protection
- Has no CORS restrictions

**This system should ONLY be used in development environments where security is not a concern.**

## Error Handling

All errors return a simple format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common error messages:

- "User with this email already exists"
- "Invalid credentials"
- "userId is required"
- "farmerId is required"
- "buyerId is required"
- "Registration failed"
- "Login failed"
- "Profile update failed"
- "Password change failed"

## Testing

Run the test suite:

```bash
npm test
```

The test suite includes:

- Plain text password registration
- Plain text password login
- Profile updates without authentication
- Password changes without validation
- All CRUD operations for farmers and buyers
