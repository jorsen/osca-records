# OSCA Records - Senior Citizen & Pensioner Management System

A modern web application for managing senior citizen and pensioner records with secure authentication and comprehensive profile management.

## Features

- **User Authentication**: Secure login and registration with password hashing
- **User Registration**: Complete registration form with all required profile fields
- **Profile Management**: View and edit user profiles with:
  - Personal Information (Name, Birthday, Age, Gender, Address, Location)
  - Contact Details
  - Relationship Status
  - ID Numbers (Senior ID, National ID)
  - Pensioner Status
- **Neon PostgreSQL Database**: Secure cloud database integration
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: JWT with bcryptjs
- **Styling**: Tailwind CSS
- **Hosting Ready**: Deployable to Vercel

## Prerequisites

- Node.js 18+ and npm or yarn
- Git
- Neon account (free at https://console.neon.tech)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd osca-records
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Neon Database

1. Go to https://console.neon.tech and create a free account
2. Create a new project
3. Copy your connection string (looks like: `postgresql://user:password@host/database`)

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your Neon connection string:
   ```
   DATABASE_URL="postgresql://user:password@host/database"
   NEXTAUTH_SECRET="generate-a-random-32-char-string-Here"
   JWT_SECRET="generate-another-random-32-char-string-here"
   ```

3. Generate secure secrets (run in terminal):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste it for both NEXTAUTH_SECRET and JWT_SECRET

### 5. Initialize the Database

Run Prisma migrations to create tables:
```bash
npm run db:push
```

Or if you prefer traditional migrations:
```bash
npm run db:migrate
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### First Time Users

1. **Sign Up**: Click "Sign Up" and fill in all the required information
2. **Verify**: You'll be redirected to login after successful registration
3. **Login**: Use your username and password to log in
4. **View Profile**: See all your information on the profile page
5. **Edit Profile**: Click "Edit Profile" to update any information

### Returning Users

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Enter your username and password
3. Click "Login"
4. You'll be redirected to your profile page

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database migrations
npm run db:migrate
npm run db:push

# Open Prisma Studio to manage data
npm run db:studio
```

## Project Structure

```
osca-records/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   ├── signup/
│   │   │   └── page.tsx          # Registration page
│   │   ├── profile/
│   │   │   └── page.tsx          # User profile page
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── signup/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   └── profile/route.ts
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   └── lib/
│       └── auth.ts               # Auth utilities
├── prisma/
│   └── schema.prisma             # Database schema
├── .env.local                    # Environment variables
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## Database Schema

The application uses a single `User` table with the following fields:

- `id`: Unique identifier (CUID)
- `username`: Unique username for login
- `password`: Hashed password
- `fullName`: User's full name
- `address`: Residential address
- `birthday`: Date of birth
- `age`: Age in years
- `gender`: Gender (Male/Female/Other)
- `location`: City/Municipality
- `relationshipStatus`: Marital status
- `seniorIdNumber`: OSCA Senior ID
- `nationalIdNumber`: Government ID (SSS/GSIS/etc)
- `pensioner`: Boolean indicating if user receives pension
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy!

```bash
npm run build
npm start
```

### Other Platforms

The app can be deployed to any Node.js hosting (AWS, Heroku, DigitalOcean, etc.):

1. Build the application: `npm run build`
2. Set environment variables
3. Start the server: `npm start`

## Security Features

- Passwords are hashed using bcryptjs (10 rounds)
- JWT tokens for stateless authentication
- HTTP-only cookies for token storage
- Input validation on all endpoints
- Environment variables for sensitive data
- SQL injection protection via Prisma ORM

## Future Enhancements

- [ ] Email verification on signup
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Admin dashboard
- [ ] User search and directory
- [ ] Audit logs
- [ ] Export user data
- [ ] Multi-language support

## Troubleshooting

### Database Connection Issues
- Verify your DATABASE_URL in `.env.local`
- Ensure Neon database is active
- Check network connectivity
- Run `npm run db:push` again

### Login/Signup Issues
- Clear browser cookies
- Check environment variables are set
- Verify database connection
- Check browser console for errors

### Port Already in Use
```bash
# Use different port
npm run dev -- -p 3001
```

## Support

For issues and questions:
1. Check the GitHub repository
2. Review error messages in console
3. Check Neon dashboard for database status

## License

[Specify your license here]

## Author

[Your name/organization]

## Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

**Last Updated**: March 2026
