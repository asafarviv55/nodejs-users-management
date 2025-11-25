# Users Management API

A REST API for user management with JWT authentication, bcrypt password hashing, and role-based access control.

## Features

### Core Features
- JWT authentication with token-based authorization
- Bcrypt password hashing (10 rounds)
- Role-based access control (admin/user)
- CRUD operations for users
- Rate limiting (100 req/15min)
- Security headers with Helmet
- File-based data persistence

### Advanced Features
- **Enhanced User Profiles**: Avatar upload (base64), email, phone, bio fields
- **Organization Management**: Create and manage organizations/teams with member roles
- **User Invitations**: Token-based invitation system with expiration
- **Audit Logging**: Comprehensive activity trail and audit logs
- **Password Policies**: Strength validation, expiration tracking, history prevention
- **Session Management**: Multiple concurrent sessions with tracking and revocation
- **Advanced Search**: User search with filtering, sorting, and pagination
- **Bulk Operations**: CSV import/export, bulk delete, bulk role updates
- **Account Lockout**: Automatic lockout after failed login attempts (5 attempts/30min)
- **User Preferences**: Customizable user settings (theme, language, notifications, etc.)

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
- `PUT /api/profile` - Update profile (supports avatar, email, phone, bio)

### Users (Authenticated)
- `GET /api/users` - Get all users
- `GET /api/users/search` - Search users with filters and pagination
- `GET /api/users/:id` - Get user by ID

### Users (Admin only)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Organizations (Authenticated)
- `GET /api/organizations/my` - Get my organizations
- `GET /api/organizations` - List all organizations
- `GET /api/organizations/:id` - Get organization details
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/:id` - Update organization (admin)
- `DELETE /api/organizations/:id` - Delete organization (admin)
- `POST /api/organizations/:id/members` - Add member (admin)
- `DELETE /api/organizations/:id/members` - Remove member (admin)
- `PUT /api/organizations/:id/members` - Update member role (admin)

### Invitations (Admin)
- `GET /api/invitations` - List all invitations
- `GET /api/invitations/token/:token` - Get invitation by token (public)
- `POST /api/invitations` - Create invitation
- `POST /api/invitations/accept/:token` - Accept invitation (authenticated)
- `PUT /api/invitations/:id/revoke` - Revoke invitation
- `DELETE /api/invitations/:id` - Delete invitation

### Audit Logs
- `GET /api/audit/my` - Get my activity (authenticated)
- `GET /api/audit` - List all audit logs (admin)
- `GET /api/audit/users/:userId` - Get user activity (admin)
- `GET /api/audit/resources/:resource/:resourceId` - Get resource history (admin)

### Sessions (Authenticated)
- `GET /api/sessions/my` - Get my active sessions
- `DELETE /api/sessions/:sessionId` - Revoke specific session
- `DELETE /api/sessions` - Revoke all my sessions
- `GET /api/sessions/users/:userId` - Get user sessions (admin)
- `POST /api/sessions/cleanup` - Cleanup expired sessions (admin)

### Bulk Operations (Admin)
- `GET /api/bulk/export?format=json|csv` - Export all users
- `POST /api/bulk/import` - Import users from JSON/CSV
- `POST /api/bulk/delete` - Bulk delete users
- `POST /api/bulk/update-role` - Bulk update user roles

### Account Lockout
- `GET /api/lockout/policy` - Get lockout policy (public)
- `GET /api/lockout` - Get all locked accounts (admin)
- `GET /api/lockout/:userId` - Check user lockout status (admin)
- `POST /api/lockout/:userId/unlock` - Unlock account (admin)

### Preferences (Authenticated)
- `GET /api/preferences/defaults` - Get default preferences (public)
- `GET /api/preferences/my` - Get my preferences
- `PUT /api/preferences/my` - Update my preferences
- `POST /api/preferences/my/reset` - Reset to defaults
- `GET /api/preferences/my/export` - Export my preferences
- `POST /api/preferences/my/import` - Import preferences
- `GET /api/preferences/users/:userId` - Get user preferences (admin)

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
- **JWT**: Stateless authentication with role-based authorization
- **CORS**: Configurable origins
- **Password Policy**: Enforced complexity requirements (min 8 chars, uppercase, lowercase, numbers, special chars)
- **Password Expiration**: 90-day expiration with warning notifications
- **Password History**: Prevents reuse of last 5 passwords
- **Account Lockout**: Automatic lockout after 5 failed attempts within 30 minutes (15-minute lockout)
- **Session Management**: Track and revoke sessions, limit concurrent sessions per user (max 5)

## License

MIT
