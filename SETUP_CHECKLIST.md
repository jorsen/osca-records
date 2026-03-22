# Setup Checklist - OSCA Records

Complete these steps to get your OSCA Records app running:

## Prerequisites
- [ ] Node.js 18+ installed (check: `node --version`)
- [ ] npm 9+ installed (check: `npm --version`)
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## Phase 1: Database Setup (5 minutes)

- [ ] Create Neon account at https://console.neon.tech
- [ ] Create new project
- [ ] Copy connection string (starts with `postgresql://`)
- [ ] Verify connection string format: `postgresql://user:pwd@host/dbname`

## Phase 2: Project Configuration (3 minutes)

- [ ] Open `.env.local` file
- [ ] Paste DATABASE_URL value
- [ ] Generate random 32-char string: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Copy output and paste as NEXTAUTH_SECRET
- [ ] Generate another random string for JWT_SECRET
- [ ] Save `.env.local`
- [ ] Verify `.env.local` is in `.gitignore`

## Phase 3: Dependencies Installation (3 minutes)

```bash
npm install
```

- [ ] Installation completed without errors
- [ ] `node_modules` folder created
- [ ] `package-lock.json` updated

## Phase 4: Database Schema Init (2 minutes)

```bash
npm run db:push
```

- [ ] Schema pushed to Neon database
- [ ] No migration errors
- [ ] Table `users` created

## Phase 5: Start Development Server (1 minute)

```bash
npm run dev
```

- [ ] Server started without errors
- [ ] Output shows: "Local: http://localhost:3000"
- [ ] No TypeScript errors

## Phase 6: Test Features

### Test 1: Home Page
- [ ] Visit http://localhost:3000
- [ ] See welcome screen
- [ ] "Sign Up" button visible
- [ ] "Login" button visible

### Test 2: Sign Up
- [ ] Click "Sign Up"
- [ ] Form loads with all fields:
  - [ ] Username
  - [ ] Password
  - [ ] Full Name
  - [ ] Gender
  - [ ] Birthday
  - [ ] Age
  - [ ] Address
  - [ ] Location
  - [ ] Relationship Status
  - [ ] Senior ID Number
  - [ ] National ID Number
  - [ ] Pensioner dropdown
- [ ] Fill all fields with test data
- [ ] Click "Create Account"
- [ ] Redirected to login page

### Test 3: Login
- [ ] Use credentials from signup
- [ ] Click "Login"
- [ ] Redirected to profile page
- [ ] No login errors

### Test 4: View Profile
- [ ] Profile page loads
- [ ] All entered data displays correctly
- [ ] "Edit Profile" button visible
- [ ] "Logout" button visible

### Test 5: Edit Profile
- [ ] Click "Edit Profile"
- [ ] Form becomes editable
- [ ] Change one field
- [ ] Click "Save Changes"
- [ ] Success message appears
- [ ] Data updated in view

### Test 6: Logout
- [ ] Click "Logout"
- [ ] Redirected to login page
- [ ] Session cleared

## Phase 7: Database Verification (Optional)

```bash
npm run db:studio
```

- [ ] Prisma Studio opens at http://localhost:5555
- [ ] View `users` table
- [ ] See all created test users
- [ ] Direct data editing possible

## Phase 8: Code Quality

```bash
npm run lint
```

- [ ] No critical linting errors

## Phase 9: Build Testing

```bash
npm run build
npm start
```

- [ ] Build completes successfully
- [ ] Production server starts
- [ ] App works on http://localhost:3000

## Common Issues & Solutions

### Issue: "Cannot find module 'bcryptjs'"
- [ ] Run: `npm install --save bcryptjs`
- [ ] Run: `npm install`

### Issue: Database connection error
- [ ] Check .env.local has DATABASE_URL
- [ ] Verify Neon project is active
- [ ] Check internet connection
- [ ] Try: `npm run db:push` again

### Issue: Port 3000 in use
- [ ] Run: `npm run dev -- -p 3001`
- [ ] Visit: http://localhost:3001

### Issue: TypeScript errors
- [ ] Delete `.next` folder
- [ ] Run: `npm run build`
- [ ] Check for syntax errors in edited files

### Issue: Login returns 401
- [ ] Clear browser cookies
- [ ] Check password was hashed correctly
- [ ] Verify user exists in database
- [ ] Check token generation

## Customization Checklist

### UI Customization
- [ ] Update logo/branding in `page.tsx`
- [ ] Change colors in `globals.css`
- [ ] Modify Tailwind config if needed
- [ ] Update app title in `layout.tsx`

### Function Changes
- [ ] Add more user fields:
  - [ ] Update `prisma/schema.prisma`
  - [ ] Run: `npm run db:push`
  - [ ] Update form fields in signup/profile pages
  - [ ] Update API routes

### Validation
- [ ] Add email validation
- [ ] Add password strength requirements
- [ ] Add duplicate ID number checks
- [ ] Add age restrictions (60+)

## Deployment Preparation

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Sensitive data in `.env.local` only
- [ ] `.env.local` not committed to git

### Vercel Deployment
- [ ] Push code to GitHub
- [ ] Connect repo to Vercel
- [ ] Add environment variables:
  - [ ] DATABASE_URL (Neon)
  - [ ] NEXTAUTH_SECRET
  - [ ] JWT_SECRET
- [ ] Deploy
- [ ] Test on live domain

### Other Platforms
- [ ] Build: `npm run build`
- [ ] Set environment variables
- [ ] Start: `npm start`
- [ ] Point domain to server

## Ongoing Maintenance

- [ ] Weekly: Check Neon quota/usage
- [ ] Monthly: Review logs for errors
- [ ] Monthly: Monitor user count
- [ ] Quarterly: Update dependencies: `npm update`
- [ ] Quarterly: Check for security vulnerabilities: `npm audit`

## Performance Optimization (Optional)

- [ ] Enable database query logging
- [ ] Add Prisma client extensions
- [ ] Implement Redis caching
- [ ] Add CDN for static files
- [ ] Optimize images
- [ ] Enable Vercel Edge Functions

## Security Hardening (Optional)

- [ ] Add rate limiting to API routes
- [ ] Implement CSRF protection
- [ ] Add security headers
- [ ] Enable CORS properly
- [ ] Add API key validation
- [ ] Implement logging/audit trail

## Features to Add Later

- [ ] Email verification on signup
- [ ] Password reset email
- [ ] Two-factor authentication
- [ ] Admin dashboard
- [ ] User search directory
- [ ] Data export
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile app

---

**Completion Target**: 20 minutes for full setup

**Support**: Check README.md and QUICKSTART.md if stuck on any step

**Next**: Start with Phase 1!
