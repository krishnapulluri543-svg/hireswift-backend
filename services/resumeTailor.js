// services/resumeTailor.js
// AI-powered resume tailoring for each job application

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Tailor resume for a specific job ────────────────────────────
export async function tailorResume(studentProfile, jobDescription, jobTitle) {
  try {
    const personalData = typeof studentProfile.personalData === 'string'
      ? JSON.parse(studentProfile.personalData)
      : studentProfile.personalData || {};

    const prompt = `You are an expert resume writer. Tailor this student's resume for the specific job below.

STUDENT PROFILE:
Name: ${personalData.fullName || studentProfile.name}
Skills: ${personalData.skills || 'Not specified'}
Experience: ${JSON.stringify(personalData.experienceDetails || [])}
Target roles: ${personalData.targetedJobs || 'Not specified'}
Summary: ${personalData.summary || 'Not specified'}

JOB TITLE: ${jobTitle || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
1. Rewrite the professional summary to match this specific job
2. Reorder skills to put the most relevant ones first
3. Highlight experience points most relevant to this job
4. Add relevant keywords from the job description naturally
5. Keep it honest — only use information from the student profile
6. Format as a clean, ATS-friendly resume in plain text

OUTPUT FORMAT:
[SUMMARY]
(2-3 sentence tailored summary)

[SKILLS]
(Comma-separated, most relevant first)

[EXPERIENCE]
(Bullet points for each role, emphasizing relevant experience)

[MATCH ANALYSIS]
Match score: XX%
Key matches: (list 3-5 key skill/experience matches)
Gaps: (list any important gaps)`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7
    });

    return {
      success: true,
      tailoredResume: completion.choices[0].message.content,
      usage: completion.usage
    };
  } catch (e) {
    console.error('Resume tailor error:', e.message);
    return {
      success: false,
      error: e.message,
      tailoredResume: generateFallbackResume(studentProfile, jobDescription)
    };
  }
}

// ─── Generate cover letter ────────────────────────────────────────
export async function generateCoverLetter(studentProfile, jobDescription, jobTitle, company) {
  try {
    const personalData = typeof studentProfile.personalData === 'string'
      ? JSON.parse(studentProfile.personalData)
      : studentProfile.personalData || {};

    const prompt = `Write a professional, personalized cover letter for this job application.

APPLICANT:
Name: ${personalData.fullName || studentProfile.name}
Email: ${personalData.emailAddress || studentProfile.email}
Skills: ${personalData.skills || 'Not specified'}
Summary: ${personalData.summary || 'Not specified'}
Experience: ${(personalData.experienceDetails || []).map(e => `${e.role} at ${e.company}`).join(', ')}

JOB: ${jobTitle} at ${company || 'the company'}
DESCRIPTION: ${jobDescription}

Write a concise, compelling cover letter (3 paragraphs):
1. Opening: Why this specific role excites them
2. Middle: 2-3 specific achievements/skills that match the job
3. Closing: Call to action

Keep it under 250 words. Professional but not generic. No placeholders.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      temperature: 0.8
    });

    return {
      success: true,
      coverLetter: completion.choices[0].message.content
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      coverLetter: 'Cover letter generation requires OpenAI API key with credits.'
    };
  }
}

// ─── Answer job application questions ────────────────────────────
export async function answerJobQuestion(question, studentProfile, jobDescription) {
  try {
    const personalData = typeof studentProfile === 'string'
      ? JSON.parse(studentProfile)
      : studentProfile?.personalData || studentProfile || {};

    const prompt = `Answer this job application question on behalf of the candidate.

CANDIDATE:
Name: ${personalData.fullName || 'Candidate'}
Skills: ${personalData.skills || 'Not specified'}
Experience: ${JSON.stringify(personalData.experienceDetails || [])}
Work auth: ${personalData.workAuthorization || 'Not specified'}

JOB DESCRIPTION: ${jobDescription || 'Not provided'}

QUESTION: ${question}

Write a professional, specific, honest answer in 2-4 sentences. 
Use first person. Be concise and direct.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7
    });

    return {
      success: true,
      answer: completion.choices[0].message.content
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      answer: 'AI answer generation requires OpenAI API key with credits.'
    };
  }
}

// ─── Fallback resume (no API key) ────────────────────────────────
function generateFallbackResume(profile, jobDescription) {
  const pd = typeof profile.personalData === 'string'
    ? JSON.parse(profile.personalData || '{}')
    : profile.personalData || profile;

  return `[SUMMARY]
${pd.summary || `Experienced professional with skills in ${pd.skills || 'various technologies'}, seeking new opportunities.`}

[SKILLS]
${pd.skills || 'To be updated'}

[EXPERIENCE]
${(pd.experienceDetails || []).map(e =>
  `• ${e.role} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})
   - Location: ${e.city}, ${e.state}`
).join('\n') || 'No experience data available'}

[MATCH ANALYSIS]
Match score: N/A
Note: Add OpenAI API key to enable AI-powered resume tailoring.`;
}
