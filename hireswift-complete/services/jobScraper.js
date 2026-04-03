// services/jobScraper.js
// Scrapes jobs from LinkedIn, Indeed, Naukri based on student profile

import axios from 'axios';
import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

// ─── LinkedIn Jobs ────────────────────────────────────────────────
async function scrapeLinkedIn(keyword, location = '', count = 10) {
  try {
    const query = encodeURIComponent(keyword);
    const loc = encodeURIComponent(location || 'India');
    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${query}&location=${loc}&start=0`;

    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(res.data);
    const jobs = [];

    $('li').each((i, el) => {
      if (i >= count) return false;
      const title = $(el).find('.base-search-card__title').text().trim();
      const company = $(el).find('.base-search-card__subtitle').text().trim();
      const loc = $(el).find('.job-search-card__location').text().trim();
      const link = $(el).find('a.base-card__full-link').attr('href');
      if (title && link) {
        jobs.push({
          source: 'LinkedIn',
          title,
          company,
          location: loc,
          jobLink: link.split('?')[0],
          jobDescription: `${title} at ${company} — ${loc}`,
          postedAt: new Date()
        });
      }
    });
    return jobs;
  } catch (e) {
    console.error('LinkedIn scrape error:', e.message);
    return [];
  }
}

// ─── Indeed Jobs ─────────────────────────────────────────────────
async function scrapeIndeed(keyword, location = '', count = 10) {
  try {
    const query = encodeURIComponent(keyword);
    const loc = encodeURIComponent(location || 'India');
    const url = `https://indeed.com/jobs?q=${query}&l=${loc}&limit=${count}`;

    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(res.data);
    const jobs = [];

    $('[data-jk]').each((i, el) => {
      if (i >= count) return false;
      const jk = $(el).attr('data-jk');
      const title = $(el).find('[data-testid="jobTitle"]').text().trim() ||
                    $(el).find('.jobTitle').text().trim();
      const company = $(el).find('[data-testid="company-name"]').text().trim() ||
                      $(el).find('.companyName').text().trim();
      const loc = $(el).find('[data-testid="text-location"]').text().trim() ||
                  $(el).find('.companyLocation').text().trim();
      if (title && jk) {
        jobs.push({
          source: 'Indeed',
          title,
          company,
          location: loc,
          jobLink: `https://indeed.com/viewjob?jk=${jk}`,
          jobDescription: `${title} at ${company} — ${loc}`,
          postedAt: new Date()
        });
      }
    });
    return jobs;
  } catch (e) {
    console.error('Indeed scrape error:', e.message);
    return [];
  }
}

// ─── Naukri Jobs ─────────────────────────────────────────────────
async function scrapeNaukri(keyword, location = '', count = 10) {
  try {
    const query = keyword.toLowerCase().replace(/\s+/g, '-');
    const loc = (location || 'india').toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.naukri.com/${query}-jobs-in-${loc}`;

    const res = await axios.get(url, { headers: HEADERS, timeout: 10000 });
    const $ = cheerio.load(res.data);
    const jobs = [];

    $('article.jobTuple').each((i, el) => {
      if (i >= count) return false;
      const title = $(el).find('.title').text().trim();
      const company = $(el).find('.companyInfo .subTitle').text().trim();
      const loc = $(el).find('.location .ellipsis').text().trim();
      const link = $(el).find('a.title').attr('href');
      if (title && link) {
        jobs.push({
          source: 'Naukri',
          title,
          company,
          location: loc,
          jobLink: link,
          jobDescription: `${title} at ${company} — ${loc}`,
          postedAt: new Date()
        });
      }
    });
    return jobs;
  } catch (e) {
    console.error('Naukri scrape error:', e.message);
    return [];
  }
}

// ─── Main scraper function ────────────────────────────────────────
export async function scrapeJobsForStudent(studentProfile) {
  const keywords = getKeywords(studentProfile);
  const location = studentProfile.city || studentProfile.currentLocation || '';
  const allJobs = [];

  for (const keyword of keywords.slice(0, 3)) {
    const [linkedin, indeed, naukri] = await Promise.allSettled([
      scrapeLinkedIn(keyword, location, 8),
      scrapeIndeed(keyword, location, 8),
      scrapeNaukri(keyword, location, 8)
    ]);

    if (linkedin.status === 'fulfilled') allJobs.push(...linkedin.value);
    if (indeed.status === 'fulfilled') allJobs.push(...indeed.value);
    if (naukri.status === 'fulfilled') allJobs.push(...naukri.value);
  }

  // Deduplicate by link
  const seen = new Set();
  return allJobs.filter(j => {
    if (seen.has(j.jobLink)) return false;
    seen.add(j.jobLink);
    return true;
  });
}

function getKeywords(profile) {
  const keywords = [];

  // From targeted jobs
  if (profile.targetedJobs) {
    const targets = profile.targetedJobs.split(',').map(t => t.trim()).filter(Boolean);
    keywords.push(...targets.slice(0, 3));
  }

  // From skills
  if (profile.skills) {
    const skills = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
    if (skills.length > 0) keywords.push(skills[0] + ' developer');
  }

  // Fallback
  if (keywords.length === 0) keywords.push('Software Engineer');

  return [...new Set(keywords)];
}

// ─── Calculate match score ────────────────────────────────────────
export function calculateMatchScore(job, studentProfile) {
  let score = 50;
  const jobText = `${job.title} ${job.jobDescription}`.toLowerCase();
  const skills = (studentProfile.skills || '').split(',').map(s => s.trim().toLowerCase());

  // Skills match
  skills.forEach(skill => {
    if (skill && jobText.includes(skill)) score += 5;
  });

  // Target role match
  const targets = (studentProfile.targetedJobs || '').split(',').map(t => t.trim().toLowerCase());
  targets.forEach(t => {
    if (t && jobText.includes(t)) score += 10;
  });

  // Location match
  if (studentProfile.openToRelocation === 'Yes') score += 5;
  if (studentProfile.city && job.location?.toLowerCase().includes(studentProfile.city.toLowerCase())) score += 10;

  return Math.min(score, 99);
}
