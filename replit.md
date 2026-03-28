# HireSwift Backend API

A complete Node.js/Express backend for the HireSwift job application Chrome extension.

## Architecture

- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT + Google OAuth 2.0 (Passport.js)
- **File Storage**: Local disk storage with Multer
- **Password Hashing**: bcryptjs

## Project Structure

```
├── index.js              # Main entry point, Express app setup
├── package.json
├── config/
│   ├── db.js             # MongoDB connection
│   └── passport.js       # Google OAuth Passport strategy
├── middleware/
│   ├── auth.js           # JWT protect + role authorization
│   ├── upload.js         # Multer file upload config (PDF/Word, 5MB max)
│   └── errorHandler.js   # Global error handler
├── models/
│   ├── User.js           # User model (admin/agent/student roles)
│   └── Job.js            # Job model (status tracking)
├── routes/
│   ├── auth.js           # Auth routes (register, login, Google OAuth)
│   ├── student.js        # Student routes (profile, resume, jobs)
│   ├── agent.js          # Agent routes (job queue, student management)
│   ├── admin.js          # Admin routes (user management, stats)
│   └── ai.js             # AI routes (answer gen, cover letter, resume review)
└── uploads/              # Resume file storage
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register a new student or agent |
| POST | `/login` | Login with email + password |
| GET | `/google` | Initiate Google OAuth |
| GET | `/google/callback` | Google OAuth callback |
| GET | `/me` | Get current user (protected) |
| POST | `/logout` | Logout (protected) |
| PUT | `/change-password` | Change password (protected) |

### Student (`/api/student`) — Role: student
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/profile` | Get own profile |
| PUT | `/profile` | Update profile |
| POST | `/resume/upload` | Upload resume (PDF/DOCX, max 5MB) |
| GET | `/resume/download` | Download own resume |
| GET | `/jobs` | List own jobs (filterable by status) |
| POST | `/jobs` | Add a job from extension |
| GET | `/jobs/:id` | Get job detail |
| PUT | `/jobs/:id/status` | Update job status |
| DELETE | `/jobs/:id` | Delete a job |
| GET | `/jobs/stats/summary` | Job count by status |

### Agent (`/api/agent`) — Role: agent, admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/queue` | Get assigned job queue |
| GET | `/students` | List assigned students |
| GET | `/students/:id` | Get student detail |
| GET | `/students/:id/resume` | Download student resume |
| GET | `/students/:id/jobs` | Get student's jobs |
| PUT | `/jobs/:id/status` | Update job status |
| POST | `/jobs/:id/assign` | Self-assign a job |
| GET | `/stats` | Agent stats dashboard |

### Admin (`/api/admin`) — Role: admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/users` | List all users (filterable) |
| POST | `/users` | Create user |
| GET | `/users/:id` | Get user detail |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| PUT | `/users/:id/toggle-status` | Activate/deactivate user |
| POST | `/assign-agent` | Assign agent to student |
| GET | `/jobs` | View all jobs |
| GET | `/stats` | Platform-wide stats |

### AI (`/api/ai`) — All authenticated roles
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/generate-answer` | Generate answer for application question |
| POST | `/generate-cover-letter` | Generate personalized cover letter |
| POST | `/improve-resume` | Get resume improvement feedback |

## User Roles

- **student**: Can manage their own profile, resume, and job applications
- **agent**: Manages a queue of student job applications on their behalf
- **admin**: Full platform management, user control, and statistics

## Job Status Flow

`pending` → `applied` → `interview` → `offer`
`pending` → `applied` → `rejected`
`pending`/`applied` → `withdrawn`

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OPENAI_API_KEY` | OpenAI API key (for AI features) |
| `PORT` | Server port (default: 5000) |
| `JWT_EXPIRES_IN` | Token expiry (default: 7d) |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL |

## Chrome Extension Integration

- CORS is enabled for all origins (`*`) with full method support
- Include `Authorization: Bearer <token>` header in all authenticated requests
- Supports both local password login and Google OAuth flows
