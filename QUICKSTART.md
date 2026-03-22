# Quick Start Guide - OSCA Records

## 5-Minute Setup

### Step 1: Get Neon Database URL (2 minutes)

1. Go to https://console.neon.tech
2. Sign up (free tier available)
3. Create a new project
4. Click "Copy connection string"
5. It will look like: `postgresql://user:password@neon-host/database`

### Step 2: Configure Environment (1 minute)

1. Open `.env.local` in your editor
2. Paste your Neon URL after `DATABASE_URL=`
3. Generate and add secrets:
   ```
   Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. Save file

Example `.env.local`:
```
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-1.neon.tech/neondb"
NEXTAUTH_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
JWT_SECRET="p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1"
```

### Step 3: Install & Run (2 minutes)

```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

Then open: http://localhost:3000

## What to Test

1. **Home Page**: http://localhost:3000
   - Should show welcome screen
   - Links to Login and Signup

2. **Sign Up**: http://localhost:3000/signup
   - Fill in all fields
   - Click "Create Account"
   - Should redirect to login

3. **Login**: http://localhost:3000/login
   - Use credentials from signup
   - Should redirect to profile

4. **Profile**: http://localhost:3000/profile
   - Should show your information
   - Click "Edit Profile" to update
   - Click "Logout" to sign out

## Database Management

### View/Manage Data

```bash
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

### Reset Database

```bash
# Drop and recreate database
npx prisma migrate reset
```

### Check Database Status

```bash
# See current schema
npx prisma db seed

# Validate connections
npx prisma validate
```

## Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm start                  # Run production build

# Database
npm run db:push            # Apply schema changes
npm run db:migrate         # Create migration
npm run db:studio          # Open Prisma Studio

# Utilities
npm run lint               # Check code
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database connection error | Check DATABASE_URL in .env.local |
| Port 3000 already in use | `npm run dev -- -p 3001` |
| Login not working | Clear cookies, check database |
| Password issues | Check bcryptjs is installed |

## Features Available Now

✅ User Registration
✅ Secure Login/Logout
✅ Profile Management
✅ Edit Profile
✅ View Profile Information
✅ 13 User Profile Fields
✅ Responsive Mobile Design

## Next Steps

1. Customize styling in `src/globals.css` and Tailwind config
2. Add more user fields if needed (update `prisma/schema.prisma`)
3. Add email notifications
4. Implement password reset
5. Add admin dashboard

## File Structure Overview

```
src/
├── app/
│   ├── page.tsx           # Home
│   ├── login/page.tsx     # Login
│   ├── signup/page.tsx    # Register
│   ├── profile/page.tsx   # User Profile
│   └── api/               # Backend APIs
├── lib/auth.ts            # Auth helpers
└── globals.css            # Styles

prisma/
└── schema.prisma          # Database schema
```

## Need Help?

1. Check error messages in browser console (F12)
2. Check terminal output
3. Verify `.env.local` variables
4. Ensure Neon database is running
5. Review README.md for detailed info

---

**You're all set! 🚀**

Visit http://localhost:3000 to get started!
