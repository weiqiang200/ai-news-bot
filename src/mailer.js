/**
 * Email Sender Module
 * Sends AI news summary via QQ邮箱 SMTP
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
 * Generate HTML content for the email - summary only format
 */
function generateEmailHtml(items) {
  const today = format(new Date(), 'yyyy年MM月dd日', { locale: zhCN });

  let itemsHtml = '';

  items.forEach((item, index) => {
    const dateStr = item.pubDate
      ? format(new Date(item.pubDate), 'MM-dd', { locale: zhCN })
      : '';

    // Use translated summary if available, otherwise show original summary
    const contentDisplay = item.translatedSummary || item.summary || '';

    itemsHtml += `
      <div class="item" style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
        <div class="header" style="margin-bottom: 8px;">
          <span class="index" style="background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">
            ${index + 1}
          </span>
          <span class="title" style="font-weight: 600; color: #1f2937; font-size: 16px;">
            ${item.title || '无标题'}
          </span>
          <span class="source" style="color: #6b7280; font-size: 12px; margin-left: 8px;">
            ${item.author} | ${dateStr}
          </span>
        </div>
        <div class="content" style="color: #4b5563; line-height: 1.8; font-size: 14px; padding-left: 32px;">
          ${contentDisplay}
        </div>
        ${item.link ? `
          <div class="link" style="margin-top: 8px; padding-left: 32px;">
            <a href="${item.link}" target="_blank" style="color: #3b82f6; font-size: 12px;">🔗 原文链接</a>
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #f3f4f6; }
        .container { background: white; border-radius: 12px; padding: 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        h1 { color: #1f2937; font-size: 22px; margin-bottom: 4px; }
        .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
        .item { margin-bottom: 20px; }
        .header { margin-bottom: 8px; }
        .index { background: #3b82f6; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px; }
        .title { font-weight: 600; color: #1f2937; font-size: 16px; }
        .source { color: #6b7280; font-size: 12px; margin-left: 8px; }
        .content { color: #4b5563; line-height: 1.8; font-size: 14px; padding-left: 32px; }
        .link { margin-top: 8px; padding-left: 32px; }
        .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 11px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 AI资讯摘要</h1>
        <p class="subtitle">每3天自动推送 | ${today} | 共${items.length}条</p>

        ${itemsHtml}

        <div class="footer">
          <p>数据来源：Hacker News + AI公司官方博客</p>
          <p>翻译：MyMemory | 由AI资讯订阅机器人自动发送</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Send email with AI news summary
 */
async function sendNewsEmail(items) {
  const transporter = createTransporter();
  const recipient = process.env.RECIPIENT_EMAIL;
  const sender = process.env.QQ_EMAIL;

  if (!recipient) {
    throw new Error('RECIPIENT_EMAIL environment variable is required');
  }

  const today = format(new Date(), 'yyyy年MM月dd日', { locale: zhCN });

  const htmlContent = generateEmailHtml(items);

  const mailOptions = {
    from: `"AI资讯" <${sender}>`,
    to: recipient,
    subject: `🤖 AI资讯 - ${today} (${items.length}条摘要)`,
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
