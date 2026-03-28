const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

const callOpenAI = async (messages) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key') {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in environment secrets.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'OpenAI API call failed');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
};

router.post('/generate-answer', async (req, res, next) => {
  try {
    const { jobId, question, context } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const user = await User.findById(req.user._id);
    let jobContext = '';

    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        jobContext = `\nJob: ${job.title} at ${job.company}\nJob Description: ${job.description || 'Not provided'}`;
      }
    }

    const profileContext = user.profile
      ? `\nApplicant Skills: ${(user.profile.skills || []).join(', ')}\nApplicant Bio: ${user.profile.bio || 'Not provided'}`
      : '';

    const messages = [
      {
        role: 'system',
        content:
          'You are an expert career coach helping job applicants craft compelling, honest, and concise answers to job application questions. Keep answers professional and under 200 words unless specified.',
      },
      {
        role: 'user',
        content: `Please answer the following job application question:\n\nQuestion: ${question}${jobContext}${profileContext}\n${context ? `Additional Context: ${context}` : ''}`,
      },
    ];

    const answer = await callOpenAI(messages);

    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        $push: { aiAnswers: { question, answer } },
      });
    }

    res.status(200).json({ success: true, data: { question, answer } });
  } catch (error) {
    next(error);
  }
});

router.post('/generate-cover-letter', async (req, res, next) => {
  try {
    const { jobId, tone, additionalInfo } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job ID is required' });
    }

    const [job, user] = await Promise.all([
      Job.findById(jobId),
      User.findById(req.user._id),
    ]);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const applicantName = user.name;
    const skills = user.profile?.skills?.join(', ') || 'Not provided';
    const bio = user.profile?.bio || '';
    const experience = (user.profile?.experience || [])
      .map((e) => `${e.title} at ${e.company}`)
      .join('; ') || 'Not provided';

    const selectedTone = tone || 'professional';

    const messages = [
      {
        role: 'system',
        content: `You are an expert cover letter writer. Write compelling, personalized cover letters that are ${selectedTone} in tone. Keep it concise (3-4 paragraphs) and tailored to the specific job and company.`,
      },
      {
        role: 'user',
        content: `Write a cover letter for the following:

Applicant Name: ${applicantName}
Applicant Skills: ${skills}
Applicant Bio: ${bio}
Work Experience: ${experience}

Job Title: ${job.title}
Company: ${job.company}
Job Description: ${job.description || 'Not provided'}
Requirements: ${(job.requirements || []).join(', ') || 'Not provided'}
${additionalInfo ? `Additional Info: ${additionalInfo}` : ''}

Write a complete, ready-to-send cover letter.`,
      },
    ];

    const coverLetter = await callOpenAI(messages);

    await Job.findByIdAndUpdate(jobId, { coverLetter });

    res.status(200).json({
      success: true,
      data: {
        coverLetter,
        jobTitle: job.title,
        company: job.company,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/improve-resume', async (req, res, next) => {
  try {
    const { resumeText, jobId } = req.body;

    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Resume text is required' });
    }

    let jobContext = '';
    if (jobId) {
      const job = await Job.findById(jobId);
      if (job) {
        jobContext = `\nTarget Job: ${job.title} at ${job.company}\nJob Requirements: ${(job.requirements || []).join(', ')}`;
      }
    }

    const messages = [
      {
        role: 'system',
        content:
          'You are an expert resume writer and career coach. Provide specific, actionable suggestions to improve resumes. Focus on clarity, impact, ATS optimization, and relevance.',
      },
      {
        role: 'user',
        content: `Please review and suggest improvements for this resume:

${resumeText}
${jobContext}

Provide:
1. Key strengths
2. Areas for improvement
3. Specific rewrite suggestions for weak bullet points
4. Keywords to add for ATS
5. Overall score (1-10)`,
      },
    ];

    const feedback = await callOpenAI(messages);

    res.status(200).json({ success: true, data: { feedback } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
