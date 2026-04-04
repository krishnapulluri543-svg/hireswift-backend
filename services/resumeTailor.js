// services/resumeTailor.js
// AI-powered resume tailoring - OpenAI is optional

let openai = null;

// Only initialize OpenAI if API key exists
if (process.env.OPENAI_API_KEY) {
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('✅ OpenAI initialized');
  } catch(e) {
    console.log('⚠️  OpenAI not available:', e.message);
  }
}

export async function tailorResume(studentProfile, jobDescription, jobTitle) {
  const personalData = typeof studentProfile.personalData === 'string'
    ? JSON.parse(studentProfile.personalData || '{}')
    : studentProfile.personalData || {};

  if (!openai) {
    return { success: true, tailoredResume: generateFallback(personalData, jobDescription, jobTitle) };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `Tailor this resume for the job.\n\nStudent: ${JSON.stringify(personalData)}\n\nJob Title: ${jobTitle}\nJob Description: ${jobDescription}\n\nProvide tailored summary, reordered skills, and relevant experience highlights.` }],
      max_tokens: 1500,
    });
    return { success: true, tailoredResume: completion.choices[0].message.content };
  } catch(e) {
    return { success: true, tailoredResume: generateFallback(personalData, jobDescription, jobTitle) };
  }
}

export async function generateCoverLetter(studentProfile, jobDescription, jobTitle, company) {
  const personalData = typeof studentProfile.personalData === 'string'
    ? JSON.parse(studentProfile.personalData || '{}')
    : studentProfile.personalData || {};

  if (!openai) {
    return { success: true, coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for the ${jobTitle} position at ${company}. With my background in ${personalData.skills || 'relevant technologies'}, I am confident I can contribute meaningfully to your team.\n\nThank you for considering my application.\n\nSincerely,\n${personalData.fullName || studentProfile.name}` };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `Write a cover letter for ${personalData.fullName} applying for ${jobTitle} at ${company}. Job: ${jobDescription}. Skills: ${personalData.skills}` }],
      max_tokens: 600,
    });
    return { success: true, coverLetter: completion.choices[0].message.content };
  } catch(e) {
    return { success: false, error: e.message, coverLetter: 'Cover letter generation failed.' };
  }
}

export async function answerJobQuestion(question, studentProfile, jobDescription) {
  const pd = typeof studentProfile === 'string' ? JSON.parse(studentProfile || '{}') : (studentProfile?.personalData || studentProfile || {});

  if (!openai) {
    return { success: true, answer: `Based on my experience with ${pd.skills || 'relevant technologies'}, I am well-suited for this role. I have worked on similar challenges and am confident in my ability to contribute effectively.` };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: `Answer this job application question for a candidate.\nCandidate skills: ${pd.skills}\nExperience: ${JSON.stringify(pd.experienceDetails || [])}\nQuestion: ${question}` }],
      max_tokens: 300,
    });
    return { success: true, answer: completion.choices[0].message.content };
  } catch(e) {
    return { success: false, error: e.message, answer: 'AI answer generation failed.' };
  }
}

function generateFallback(pd, jobDescription, jobTitle) {
  return `[TAILORED RESUME SUMMARY]
${pd.summary || `Experienced professional with skills in ${pd.skills || 'various technologies'}.`}

[RELEVANT SKILLS]
${pd.skills || 'To be updated'}

[EXPERIENCE HIGHLIGHTS]
${(pd.experienceDetails || []).map(e => `• ${e.role} at ${e.company}`).join('\n') || 'See full resume'}

Note: Add OPENAI_API_KEY in Railway variables to enable AI-powered tailoring.`;
}
