# Users Management API

A REST API for user management with JWT authentication, bcrypt password hashing, and role-based access control.

## Features

- JWT authentication
- Bcrypt password hashing
- Role-based access control (admin/user)
- CRUD operations for users
- Rate limiting
- Security headers with Helmet
- File-based data persistence

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, express-rate-limit

## Installation

```bash
# Clone the repository
git clone https://github.com/asafarviv55/nodejs-users-management.git
cd nodejs-users-management

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize data file
cp data/users.example.json data/users.json

# Start the server
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration | 1h |
| `CORS_ORIGIN` | CORS origin | * |
| `DATA_PATH` | Path to users data file | ./data/users.json |

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token

### Profile (Authenticated)
- `GET /api/profile` - Get current user profile
- `PUT /api/profile` - Update profile

### Users (Authenticated)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Users (Admin only)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "john", "password": "secret123", "profession": "developer"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name": "john", "password": "secret123"}'
```

### Get users (with token)
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Docker

```bash
# Set JWT_SECRET in environment or .env file
export JWT_SECRET=your-secret-key

# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f api
```

## Project Structure

```
src/
├── config/          # Configuration
├── controllers/     # Route handlers
├── middleware/      # Express middleware
├── routes/          # API routes
└── services/        # Business logic
data/
└── users.json       # User data storage
```

## Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: 100 requests per 15 minutes
- **bcrypt**: Password hashing (10 rounds)
- **JWT**: Stateless authentication
- **CORS**: Configurable origins

## License

MIT
