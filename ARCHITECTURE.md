# OSCA Records - Architecture & Flow Guide

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT SIDE (Browser)                   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Home Page  │  │  Login Page   │  │  Signup Page    │ │
│  │   (Public)   │  │  (Public)     │  │  (Public)       │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│         │                 │                     │           │
│         └─────────────────┼─────────────────────┘           │
│                           │ HTTP Requests                    │
│                   ┌───────▼────────┐                        │
│                   │ Profile Page   │                        │
│                   │ (Protected)    │                        │
│                   └───────┬────────┘                        │
│                           │                                 │
│         Local Storage (JWT Token)                          │
│                           │                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            │ Headers: Authorization: Bearer {token}
                            │ Cookies: auth_token
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVER SIDE (Next.js)                    │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐│
│  │              API Routes (/api)                         ││
│  │                                                         ││
│  │  POST /api/auth/signup   → Register new user          ││
│  │  POST /api/auth/login    → Authenticate user          ││
│  │  POST /api/auth/logout   → Clear session              ││
│  │  GET  /api/profile       → Get user profile           ││
│  │  PUT  /api/profile       → Update user profile        ││
│  │                                                         ││
│  └──────────────┬─────────────────────────────┬──────────┘│
│                 │                             │            │
│         ┌───────▼──────────┐      ┌──────────▼────────┐  │
│         │  Authentication  │      │  Data Validation  │  │
│         │  - Verify Token  │      │  - Hash Password  │  │
│         │  - Hash Password │      │  - Validate Input │  │
│         │  - Generate JWT  │      └───────────────────┘  │
│         └──────────────────┘                              │
│                 │                                          │
└────────────────────────────────────────────────────────────┘
                 │
                 │ Database Queries (Prisma ORM)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│            DATABASE (Neon PostgreSQL)                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                  users Table                         │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ ├─ id (unique identifier)                           │ │
│  │ ├─ username (unique)                                │ │
│  │ ├─ password (hashed)                                │ │
│  │ ├─ fullName                                         │ │
│  │ ├─ address                                          │ │
│  │ ├─ birthday                                         │ │
│  │ ├─ age                                              │ │
│  │ ├─ gender                                           │ │
│  │ ├─ location                                         │ │
│  │ ├─ relationshipStatus                               │ │
│  │ ├─ seniorIdNumber                                   │ │
│  │ ├─ nationalIdNumber                                 │ │
│  │ ├─ pensioner (boolean)                              │ │
│  │ ├─ createdAt (timestamp)                            │ │
│  │ └─ updatedAt (timestamp)                            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  Hosted on: Neon (Free PostgreSQL DBaaS)                   │
└─────────────────────────────────────────────────────────────┘
```

## User Journey

### New User Flow

```
1. Visit Home Page (/)
   ├─ See landing page with features
   ├─ Click "Sign Up"
   │
2. Sign Up Page (/signup)
   ├─ Fill registration form (13 fields)
   ├─ Submit → POST /api/auth/signup
   ├─ Server validates & hashes password
   ├─ Creates user in database
   ├─ Redirects to login
   │
3. Login Page (/login)
   ├─ Enter credentials
   ├─ Submit → POST /api/auth/login
   ├─ Server validates username & password
   ├─ Generates JWT token
   ├─ Returns token & sets HTTP-only cookie
   ├─ Stores token in localStorage
   ├─ Redirects to profile
   │
4. Profile Page (/profile) [Protected]
   ├─ Retrieves token from localStorage
   ├─ Fetches user data → GET /api/profile
   ├─ Displays profile information
   ├─ Option to edit profile
   └─ Option to logout
```

### Returning User Flow

```
1. Visit Home Page (/)
2. Click "Login"
3. Enter credentials
4. POST /api/auth/login
5. Get JWT token
6. Redirected to /profile
7. Profile loads with authenticated data
```

### Edit Profile Flow

```
1. On Profile Page
2. Click "Edit Profile"
3. Form becomes editable
4. Fill in changes
5. Click "Save Changes"
6. Submit → PUT /api/profile
7. Server validates & updates database
8. Returns updated profile
9. Success message shown
10. Form switches back to view mode
```

## Authentication Flow

```
Signup/Login
    ↓
User submits credentials
    ↓
Server validates input
    ↓
Check username exists (signup only)
    ↓
Hash password (signup) / Compare password (login)
    ↓
Create JWT token
    ↓
Set HTTP-only cookie
    ↓
Return token to client
    ↓
Store in localStorage
    ↓
Send with Authorization header on future requests
    ↓
Server verifies token with verifyToken()
    ↓
Extract userId from token
    ↓
Proceed with request or return 401
```

## Protected Route Example

```typescript
// Client-side request to protected endpoint
const token = localStorage.getItem('auth_token');
const res = await fetch('/api/profile', {
  headers: { Authorization: `Bearer ${token}` }
});

// Server validates
function getTokenFromRequest(request) {
  // Try cookie first
  const token = request.cookies.get('auth_token')?.value;
  if (token) return token;
  
  // Try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Verify token
const userId = verifyToken(token);
if (!userId) return 401 Unauthorized;

// Continue with request using userId
```

## Security Layers

```
Layer 1: Input Validation
├─ Check required fields
├─ Validate email format
├─ Check password strength
└─ Validate ID number format

Layer 2: Authentication
├─ Hash passwords (bcryptjs, 10 rounds)
├─ Generate random salt for each password
├─ Use JWT with expiration
└─ HTTP-only cookies

Layer 3: Authorization
├─ Verify JWT token
├─ Check token signature
├─ Check token expiration
├─ Extract userId safely
└─ Only allow access to own data

Layer 4: Database
├─ Use Prisma ORM (prevents SQL injection)
├─ Unique constraints on sensitive fields
├─ Timestamps for audit trail
└─ No sensitive data in logs
```

## Data Flow Examples

### Example 1: User Registration

```
Client:
{
  username: "john_doe",
  password: "secure_password_123",
  fullName: "John Doe",
  age: 75,
  pensioner: "yes"
}
    ↓
Server (/api/auth/signup):
1. Validate all fields
2. Hash password: bcrypt.hash("secure_password_123", salt)
3. Create in database:
   INSERT INTO users (username, password, fullName, age, pensioner)
   VALUES ("john_doe", "$2a$10$...", "John Doe", 75, true)
4. Return success
    ↓
Client:
{
  message: "User created successfully",
  userId: "clm1x2y3z..."
}
```

### Example 2: Profile Fetch

```
Client request:
GET /api/profile
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
    ↓
Server (/api/profile):
1. Extract token: "eyJhbGc..."
2. Verify token: verifyToken(token)
3. Extract userId: "clm1x2y3z..."
4. Query database:
   SELECT * FROM users WHERE id = "clm1x2y3z..."
5. Remove password field
6. Return:
    ↓
Client:
{
  id: "clm1x2y3z...",
  username: "john_doe",
  fullName: "John Doe",
  age: 75,
  pensioner: true,
  ...
}
```

## Environment Variables

```
.env.local (NEVER commit this file)
├─ DATABASE_URL
│  └─ Connection string from Neon
│
├─ NEXTAUTH_SECRET
│  └─ Random 32-char string for session encryption
│
└─ JWT_SECRET
   └─ Random 32-char string for token signing
```

## Technology Stack Decision

```
┌─────────────────────────────────────────┐
│  Why We Chose Each Technology           │
├─────────────────────────────────────────┤
│ Next.js         → Full-stack framework  │
│                   with API routes       │
│                                         │
│ React 18        → Modern UI library     │
│                   with hooks support    │
│                                         │
│ TypeScript      → Type safety, prevents │
│                   common bugs           │
│                                         │
│ Prisma          → Type-safe ORM,       │
│                   auto-migration        │
│                                         │
│ PostgreSQL      → Reliable, scalable,   │
│                   ACID compliant        │
│                                         │
│ Neon            → Serverless Postgres,  │
│                   free tier, autoscale  │
│                                         │
│ Tailwind CSS    → Utility-first, fast   │
│                   styling               │
│                                         │
│ bcryptjs        → Industry standard     │
│                   password hashing      │
│                                         │
│ JWT             → Stateless auth,       │
│                   scalable              │
└─────────────────────────────────────────┘
```

## Deployment Architecture

```
Vercel (Recommended)
├─ Frontend: Hosted serverless functions
├─ API Routes: Also serverless
├─ Automatic HTTPS
├─ CDN for static files
└─ Auto-scaling

Alternative Hosting
├─ Docker container with Node.js
├─ EC2 / DigitalOcean / Heroku
├─ Environment-specific .env files
└─ PM2 for process management
```

## Performance Considerations

1. **Database**: Indexes on username, seniorIdNumber, nationalIdNumber
2. **API**: Token verification is fast (JWT, no database lookup)
3. **Caching**: Profile rarely changes, could cache on client
4. **Security**: Always use HTTPS in production

## Future Scalability

To handle more users:
- Add caching layer (Redis)
- Database connection pooling
- Read replicas for reporting
- Separate auth service
- Message queue for notifications
