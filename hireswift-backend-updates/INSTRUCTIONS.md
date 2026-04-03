# HireSwift Backend Updates
# How to add job scraper, AI resume tailor & email notifications

## Step 1 — Open Replit Shell and install new packages

Run this in the Shell tab:
npm install axios cheerio nodemailer


## Step 2 — Create these 3 new files in your Replit project

In Replit, create a folder called `services` and add these files:

### services/jobScraper.js
→ Copy the content from jobScraper.js

### services/resumeTailor.js  
→ Copy the content from resumeTailor.js

### services/emailService.js
→ Copy the content from emailService.js

### routes/scraper.js
→ Copy the content from scraperRoute.js

## Step 3 — Update your index.js

Add these lines to your existing index.js:

```javascript
// At the top, add these imports:
import scraperRouter, { startAutoScraper } from './routes/scraper.js';

// After your other routes, add:
app.use('/api/scraper', scraperRouter);

// After MongoDB connects, add:
startAutoScraper(app);
```

## Step 4 — Update your AI route (routes/ai.js)

Replace the AI answer/cover letter functions to use the new resumeTailor service:

```javascript
import { tailorResume, generateCoverLetter, answerJobQuestion } from '../services/resumeTailor.js';
```

## Step 5 — Add email variables in Railway

Go to Railway → hireswift-backend → Variables and add:

EMAIL_USER = your-gmail@gmail.com
EMAIL_PASS = your-gmail-app-password (NOT regular password)
WEBSITE_URL = https://hireswift.netlify.app

### How to get Gmail App Password:
1. Go to myaccount.google.com
2. Security → 2-Step Verification (enable it)
3. App passwords → Create → Select "Mail" → Copy the 16-char password
4. Use that as EMAIL_PASS

## Step 6 — Test the scraper

After deploying, test by calling:
POST https://hireswift-backend-production.up.railway.app/api/scraper/scrape-all

(Use your admin token in Authorization header)

## What each feature does:

### Job Scraper (jobScraper.js)
- Scrapes LinkedIn, Indeed, Naukri based on student's target roles
- Calculates match score for each job
- Runs automatically every 6 hours
- Deduplicates jobs so no duplicates

### AI Resume Tailor (resumeTailor.js)
- Uses GPT-4o-mini to rewrite resume for each job
- Generates personalized cover letters
- Answers job application questions
- Falls back gracefully if no API key

### Email Notifications (emailService.js)
- Sends email when agent applies to a job
- Sends welcome email on registration
- Sends interview notifications
- Uses Gmail SMTP (free)
- Logs to console if no email configured
