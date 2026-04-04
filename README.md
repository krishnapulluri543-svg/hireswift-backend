# HireSwift Backend v2.0

Complete Node.js/Express backend for the HireSwift job application platform.

## Features
- JWT Authentication (login, register, roles)
- Student profile management
- Agent job queue management
- Admin panel (users, jobs, stats)
- AI resume tailoring (OpenAI)
- AI cover letter generation
- Job scraper (LinkedIn, Indeed, Naukri)
- Email notifications (Gmail)
- Auto job scraping every 6 hours
- Self-ping to stay awake

## Folder structure
```
hireswift-complete/
├── index.js              ← Main entry point
├── package.json
├── .env.example          ← Copy to .env
├── config/
│   └── db.js             ← MongoDB connection
├── models/
│   ├── User.js           ← User model (student/agent/admin)
│   └── Job.js            ← Job model
├── middleware/
│   └── auth.js           ← JWT + role protection
├── routes/
│   ├── auth.js           ← Login, register, logout
│   ├── student.js        ← Student profile & jobs
│   ├── agent.js          ← Agent queue & actions
│   ├── admin.js          ← Admin management
│   ├── ai.js             ← AI features
│   └── scraper.js        ← Job scraping
└── services/
    ├── jobScraper.js     ← LinkedIn/Indeed/Naukri scraper
    ├── resumeTailor.js   ← AI resume tailoring
    └── emailService.js   ← Email notifications
```

## Deploy to Railway

1. Push to GitHub
2. Connect Railway to your GitHub repo
3. Add environment variables in Railway
4. Deploy!

## Environment Variables (add in Railway)

| Variable | Required | Description |
|---|---|---|
| MONGODB_URI | ✅ Yes | MongoDB Atlas connection string |
| JWT_SECRET | ✅ Yes | Any long random string |
| PORT | ✅ Yes | Set to 8080 |
| OPENAI_API_KEY | Optional | For AI features |
| EMAIL_USER | Optional | Gmail address |
| EMAIL_PASS | Optional | Gmail App Password |
| WEBSITE_URL | Optional | Your Netlify website URL |
| APP_URL | Optional | Your Railway URL (for self-ping) |

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me
- POST /api/auth/logout

### Student
- GET  /api/student/jobs
- GET  /api/student/profile
- PUT  /api/student/profile
- GET  /api/student/stats

### Agent
- GET  /api/agent/students
- GET  /api/agent/queue?email=
- POST /api/agent/mark-applied?job_id=&email=
- GET  /api/agent/student-info?email=
- GET  /api/agent/resume?email=

### Admin
- GET  /api/admin/stats
- GET  /api/admin/users
- POST /api/admin/users
- POST /api/admin/assign
- GET  /api/admin/jobs
- POST /api/admin/jobs

### AI
- POST /api/ai/generate-answer
- POST /api/ai/generate-cover-letter
- POST /api/ai/improve-resume

### Scraper
- POST /api/scraper/scrape/:email
- POST /api/scraper/scrape-all
