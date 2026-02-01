/**
 * Email Sender Module
 * Sends AI news via QQ邮箱 SMTP
 */

const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { zhCN } = require('date-fns/locale');

/**
 * Create email transporter
 */
function createTransporter() {
  const email = process.env.QQ_EMAIL;
  const authCode = process.env.QQ_AUTH_CODE;

  if (!email || !authCode) {
    throw new Error('QQ_EMAIL and QQ_AUTH_CODE environment variables are required');
  }

  return nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: email,
      pass: authCode
    }
  });
}

/**
 * Generate HTML content for the email
 */
function generateEmailHtml(tweets) {
  const today = format(new Date(), 'yyyy年MM月dd日', { locale: zhCN });

  let tweetsHtml = '';

  tweets.forEach((tweet, index) => {
    const dateStr = tweet.pubDate
      ? format(new Date(tweet.pubDate), 'yyyy-MM-dd HH:mm', { locale: zhCN })
      : '';

    tweetsHtml += `
      <div class="tweet-item" style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
        <div class="tweet-header" style="margin-bottom: 8px;">
          <span class="author" style="font-weight: 600; color: #1f2937;">
            ${tweet.author || 'Unknown'}
          </span>
          <span class="handle" style="color: #6b7280; margin-left: 8px;">
            @${tweet.authorHandle || ''}
          </span>
          <span class="date" style="color: #9ca3af; font-size: 12px; margin-left: 12px;">
            ${dateStr}
          </span>
        </div>
        <div class="original" style="color: #374151; line-height: 1.6; margin-bottom: 12px; padding: 12px; background: #f9fafb; border-radius: 8px;">
          ${tweet.originalContent || tweet.content}
        </div>
        <div class="translation" style="color: #4b5563; line-height: 1.6; padding: 12px; background: #eff6ff; border-radius: 8px; border-left: 3px solid #3b82f6;">
          <strong style="color: #3b82f6;">中文翻译：</strong>
          ${tweet.translatedContent || '翻译失败'}
        </div>
        ${tweet.link ? `
          <div class="link" style="margin-top: 8px;">
            <a href="${tweet.link}" target="_blank" style="color: #3b82f6; font-size: 12px;">查看原文 →</a>
          </div>
        ` : ''}
      </div>
    `;
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f3f4f6; }
        .container { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; font-size: 24px; margin-bottom: 8px; }
        .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 32px; }
        .tweet-item { margin-bottom: 24px; }
        .tweet-header { margin-bottom: 8px; }
        .author { font-weight: 600; color: #1f2937; }
        .handle { color: #6b7280; margin-left: 8px; }
        .date { color: #9ca3af; font-size: 12px; margin-left: 12px; }
        .original { color: #374151; line-height: 1.6; margin-bottom: 12px; padding: 12px; background: #f9fafb; border-radius: 8px; }
        .translation { color: #4b5563; line-height: 1.6; padding: 12px; background: #eff6ff; border-radius: 8px; border-left: 3px solid #3b82f6; }
        .link { margin-top: 8px; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AI资讯订阅</h1>
        <p class="subtitle">每3天自动推送 | ${today} | 共${tweets.length}条资讯</p>

        ${tweetsHtml}

        <div class="footer">
          <p>本邮件由AI资讯订阅机器人自动发送</p>
          <p>数据来源：Twitter RSS | 翻译：Google Translate</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Send email with AI news
 */
async function sendNewsEmail(tweets) {
  const transporter = createTransporter();
  const recipient = process.env.RECIPIENT_EMAIL;
  const sender = process.env.QQ_EMAIL;

  if (!recipient) {
    throw new Error('RECIPIENT_EMAIL environment variable is required');
  }

  const today = format(new Date(), 'yyyy年MM月dd日', { locale: zhCN });

  const htmlContent = generateEmailHtml(tweets);

  const mailOptions = {
    from: `"AI资讯订阅" <${sender}>`,
    to: recipient,
    subject: `🤖 AI资讯订阅 - ${today} (${tweets.length}条)`,
    html: htmlContent
  };

  console.log(`Sending email to ${recipient}...`);

  const result = await transporter.sendMail(mailOptions);

  console.log('Email sent successfully!');
  console.log('Message ID:', result.messageId);

  return result;
}

/**
 * Verify SMTP connection
 */
async function verifyConnection() {
  const transporter = createTransporter();

  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully!');
    return true;
  } catch (error) {
    console.error('SMTP connection failed:', error.message);
    return false;
  }
}

module.exports = {
  sendNewsEmail,
  verifyConnection,
  generateEmailHtml
};
