// services/resumeTailor.js - Uses Groq API (free & fast)

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

async function callGroq(messages, maxTokens = 800) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY not configured');
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature: 0.7 })
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || 'Groq error'); }
  const data = await res.json();
  return data.choices[0].message.content;
}

function getPd(profile) {
  if (!profile) return {};
  try {
    if (typeof profile.personalData === 'string') return JSON.parse(profile.personalData || '{}');
    return profile.personalData || profile || {};
  } catch { return profile || {}; }
}

export async function tailorResume(studentProfile, jobDescription, jobTitle) {
  const pd = getPd(studentProfile);
  if (!process.env.GROQ_API_KEY) {
    return { success: true, tailoredResume: `[TAILORED SUMMARY]\n${pd.summary || 'Experienced professional seeking ' + (jobTitle||'this role') + '.'}\n\n[KEY SKILLS]\n${pd.skills || 'Update your profile with skills'}\n\n[NOTE]\nAdd GROQ_API_KEY in Railway to enable AI tailoring.` };
  }
  try {
    const result = await callGroq([{ role: 'user', content: `Tailor this resume for the job.\n\nCandidate: ${pd.fullName||'Candidate'}\nSkills: ${pd.skills||'Various'}\nSummary: ${pd.summary||''}\nExperience: ${(pd.experienceDetails||[]).map(e=>`${e.role} at ${e.company}`).join(', ')}\n\nJob Title: ${jobTitle||''}\nJob Description: ${(jobDescription||'').slice(0,600)}\n\nProvide:\n[TAILORED SUMMARY] - 2-3 sentences specific to this role\n[TOP SKILLS] - most relevant skills comma separated\n[EXPERIENCE HIGHLIGHTS] - bullet points matching this job\n[MATCH SCORE] - X/100 with brief explanation` }]);
    return { success: true, tailoredResume: result };
  } catch(e) {
    return { success: false, error: e.message, tailoredResume: `AI tailoring failed: ${e.message}` };
  }
}

export async function generateCoverLetter(studentProfile, jobDescription, jobTitle, company) {
  const pd = getPd(studentProfile);
  if (!process.env.GROQ_API_KEY) {
    return { success: true, coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle||'position'} at ${company||'your company'}. With my background in ${pd.skills||'relevant technologies'}, I am confident I can contribute meaningfully.\n\nThank you for your consideration.\n\nSincerely,\n${pd.fullName||'Candidate'}` };
  }
  try {
    const result = await callGroq([{ role: 'user', content: `Write a cover letter for ${pd.fullName||'Candidate'} applying for ${jobTitle} at ${company}.\nSkills: ${pd.skills||''}\nExperience: ${(pd.experienceDetails||[]).map(e=>`${e.role} at ${e.company}`).join(', ')||''}\nJob: ${(jobDescription||'').slice(0,500)}\n\nWrite 3 paragraphs, under 250 words, start with "Dear Hiring Manager,"` }], 500);
    return { success: true, coverLetter: result };
  } catch(e) {
    return { success: false, error: e.message, coverLetter: `Cover letter generation failed: ${e.message}` };
  }
}

export async function answerJobQuestion(question, studentProfile, jobDescription) {
  const pd = getPd(studentProfile);
  if (!process.env.GROQ_API_KEY) {
    return { success: true, answer: `Based on my experience with ${pd.skills||'relevant technologies'}, I am well-suited for this role and excited about this opportunity.` };
  }
  try {
    const result = await callGroq([{ role: 'user', content: `Answer this job application question for a candidate.\nCandidate: ${pd.fullName||'Candidate'}, Skills: ${pd.skills||''}, Work auth: ${pd.workAuthorization||'Authorized'}, Salary: ${pd.targetCompensation||'Negotiable'}\nJob context: ${(jobDescription||'').slice(0,300)}\nQuestion: ${question}\nAnswer in 2-3 sentences, first person, professional.` }], 250);
    return { success: true, answer: result };
  } catch(e) {
    return { success: false, error: e.message, answer: `AI answer failed: ${e.message}` };
  }
}
