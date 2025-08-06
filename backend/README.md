# MyShopKE Backend API

Backend API for MyShopKE - A marketplace connecting Kenyan farmers and buyers.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod for request/response validation
- **Security**: Helmet, CORS, Rate limiting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Git

### Installation

1. **Clone and navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and secrets
   ```

4. **Set up database**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Seed database with sample data
   npm run db:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check

- `GET /health` - Server health status

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Farmer Endpoints

- `GET /api/farmer/listings` - Get farmer's listings
- `POST /api/farmer/listings` - Create new listing
- `PUT /api/farmer/listings/:id` - Update listing
- `DELETE /api/farmer/listings/:id` - Delete listing
- `GET /api/farmer/dashboard` - Farmer dashboard data

### Buyer Endpoints

- `GET /api/buyer/listings` - Browse all listings
- `GET /api/buyer/listings/search` - Search listings with filters
- `POST /api/buyer/preferences` - Save search preferences
- `GET /api/buyer/preferences` - Get saved preferences
- `POST /api/buyer/interactions` - Log buyer-farmer interactions
- `GET /api/buyer/dashboard` - Buyer dashboard data

### Public Endpoints

- `GET /api/public/categories` - Get crop categories
- `GET /api/public/locations` - Get Kenyan locations
- `GET /api/public/listings` - Get public listings (limited)

## Database Schema

The database uses PostgreSQL with Prisma ORM. Key tables include:

- **User**: Core user information with role-based access
- **UserProfile**: Extended profile data for farmers/buyers
- **ProduceListing**: Farmer produce listings
- **Interaction**: Buyer-farmer communication logs
- **UserPreference**: Saved search filters and preferences

## Development Commands

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push     # Push schema changes to database
npm run db:migrate  # Run database migrations
npm run db:seed     # Seed database with sample data
npm run db:studio   # Open Prisma Studio

# Testing
npm test            # Run tests
npm run test:watch  # Run tests in watch mode
```

## Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `JWT_EXPIRES_IN`: JWT token expiration time
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting to prevent abuse
- CORS protection
- Input validation with Zod
- SQL injection prevention via Prisma
- Security headers with Helmet

## API Response Format

All API responses follow a consistent format:

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Contributing

1. Follow TypeScript best practices
2. Use Zod for input validation
3. Include proper error handling
4. Add tests for new features
5. Update API documentation

## License

MIT License
