// services/emailService.js
// Sends email notifications to students when jobs are applied

import nodemailer from 'nodemailer';

// Create transporter — uses Gmail by default
// Set EMAIL_USER and EMAIL_PASS in your Railway environment variables
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Use Gmail App Password, not regular password
      }
    });
  }
  // Fallback: log emails to console in development
  return null;
};

// ─── Send job applied notification ───────────────────────────────
export async function sendJobAppliedEmail(studentEmail, studentName, jobTitle, company, jobLink) {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'DM Sans', Arial, sans-serif; background: #f4f3ef; margin: 0; padding: 20px; }
  .email-wrap { max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .email-header { background: #5046e5; padding: 28px 32px; }
  .email-logo { color: white; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
  .email-body { padding: 32px; }
  .email-body h2 { font-size: 22px; color: #1a1a18; margin-bottom: 8px; }
  .email-body p { font-size: 14px; color: #6b6960; line-height: 1.7; margin-bottom: 16px; }
  .job-card { background: #f4f3ef; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
  .job-title { font-size: 16px; font-weight: 600; color: #1a1a18; margin-bottom: 4px; }
  .job-company { font-size: 13px; color: #6b6960; }
  .btn { display: inline-block; padding: 12px 28px; background: #5046e5; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 8px; }
  .email-footer { background: #f4f3ef; padding: 20px 32px; font-size: 12px; color: #9b9890; }
  .status-badge { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
</style>
</head>
<body>
<div class="email-wrap">
  <div class="email-header">
    <div class="email-logo">⚡ HireSwift</div>
  </div>
  <div class="email-body">
    <h2>Job application submitted! 🎉</h2>
    <p>Hi ${studentName || 'there'},</p>
    <p>Great news! Our agent has successfully applied to a job on your behalf.</p>
    <div class="job-card">
      <div class="job-title">${jobTitle || 'Job Application'}</div>
      <div class="job-company">${company || 'Company'}</div>
      <div style="margin-top:10px"><span class="status-badge">✓ Applied</span></div>
    </div>
    <p>You can track this application and all others in your dashboard. We'll notify you when we hear back!</p>
    <a href="${process.env.WEBSITE_URL || 'https://hireswift.netlify.app'}/dashboard.html" class="btn">View my dashboard →</a>
    <p style="margin-top:24px;font-size:13px;color:#9b9890">Keep an eye on your email for interview requests. Our agents are continuing to apply to more matching jobs for you.</p>
  </div>
  <div class="email-footer">
    You're receiving this because you're registered with HireSwift.<br/>
    <a href="${process.env.WEBSITE_URL || '#'}" style="color:#5046e5">hireswift.com</a>
  </div>
</div>
</body>
</html>`;

  if (!transporter) {
    console.log(`📧 [EMAIL LOG] Job applied notification to ${studentEmail}:`, { studentName, jobTitle, company });
    return { success: true, logged: true };
  }

  try {
    await transporter.sendMail({
      from: `"HireSwift" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `✓ Applied: ${jobTitle || 'Job Application'} — HireSwift`,
      html
    });
    return { success: true };
  } catch (e) {
    console.error('Email send error:', e.message);
    return { success: false, error: e.message };
  }
}

// ─── Send welcome email ───────────────────────────────────────────
export async function sendWelcomeEmail(studentEmail, studentName) {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body{font-family:Arial,sans-serif;background:#f4f3ef;margin:0;padding:20px;}
  .wrap{max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;}
  .header{background:#5046e5;padding:28px 32px;}
  .logo{color:white;font-size:20px;font-weight:700;}
  .body{padding:32px;}
  .body h2{font-size:22px;color:#1a1a18;margin-bottom:8px;}
  .body p{font-size:14px;color:#6b6960;line-height:1.7;margin-bottom:14px;}
  .steps{background:#f4f3ef;border-radius:10px;padding:20px;margin:20px 0;}
  .step{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;}
  .step-num{width:24px;height:24px;background:#5046e5;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;flex-shrink:0;}
  .step-text{font-size:13px;color:#1a1a18;}
  .btn{display:inline-block;padding:12px 28px;background:#5046e5;color:white;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;}
  .footer{background:#f4f3ef;padding:20px 32px;font-size:12px;color:#9b9890;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><div class="logo">⚡ HireSwift</div></div>
  <div class="body">
    <h2>Welcome to HireSwift, ${studentName}! 🎉</h2>
    <p>You're all set. Our agents will start applying to matching jobs for you within 24 hours.</p>
    <div class="steps">
      <div class="step"><div class="step-num">1</div><div class="step-text"><strong>Profile saved</strong> — Your details are stored securely.</div></div>
      <div class="step"><div class="step-num">2</div><div class="step-text"><strong>Agent assigned</strong> — A dedicated agent will be assigned to you shortly.</div></div>
      <div class="step"><div class="step-num">3</div><div class="step-text"><strong>Applications begin</strong> — We'll apply with AI-tailored resumes for every job.</div></div>
      <div class="step"><div class="step-num">4</div><div class="step-text"><strong>You get interviews</strong> — Focus on preparing, we'll handle the applying!</div></div>
    </div>
    <a href="${process.env.WEBSITE_URL || 'https://hireswift.netlify.app'}/dashboard.html" class="btn">Go to my dashboard →</a>
  </div>
  <div class="footer">⚡ HireSwift — AI-powered job applications</div>
</div>
</body>
</html>`;

  if (!transporter) {
    console.log(`📧 [EMAIL LOG] Welcome email to ${studentEmail}`);
    return { success: true, logged: true };
  }

  try {
    await transporter.sendMail({
      from: `"HireSwift" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `Welcome to HireSwift, ${studentName}! 🚀`,
      html
    });
    return { success: true };
  } catch (e) {
    console.error('Welcome email error:', e.message);
    return { success: false, error: e.message };
  }
}

// ─── Send interview reminder ──────────────────────────────────────
export async function sendInterviewNotification(studentEmail, studentName, jobTitle, company, interviewDate) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`📧 [EMAIL LOG] Interview notification to ${studentEmail}`);
    return { success: true };
  }

  try {
    await transporter.sendMail({
      from: `"HireSwift" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject: `🎯 Interview Request: ${jobTitle} at ${company}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px">
        <h2 style="color:#5046e5">🎯 You have an interview!</h2>
        <p>Great news, ${studentName}! <strong>${company}</strong> has invited you for an interview for the <strong>${jobTitle}</strong> role.</p>
        <p>Date/Time: <strong>${interviewDate || 'Check your email for details'}</strong></p>
        <p>Good luck! You've got this. 💪</p>
        <a href="${process.env.WEBSITE_URL || '#'}/dashboard.html" style="background:#5046e5;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block">View Dashboard</a>
      </div>`
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
