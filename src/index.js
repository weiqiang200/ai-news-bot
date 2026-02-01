/**
 * AI News Subscription Bot
 * Main entry point
 *
 * Fetches AI news from Hacker News and AI company blogs,
 * translates to Chinese, and sends via email.
 */

require('dotenv').config();

const { fetchAINews, selectTopItems } = require('./fetcher');
const { translateTweets } = require('./translator');
const { sendNewsEmail, verifyConnection } = require('./mailer');

// Configuration
const MAX_ITEMS = 15;

async function main() {
  console.log('='.repeat(50));
  console.log('🤖 AI资讯订阅机器人启动');
  console.log('='.repeat(50));

  try {
    // Step 1: Verify email configuration
    console.log('\n📧 验证邮件配置...');
    const isValid = await verifyConnection();
    if (!isValid) {
      throw new Error('邮件配置验证失败');
    }

    // Step 2: Fetch AI news
    console.log('\n📰 获取AI资讯...');
    const allItems = await fetchAINews();
    console.log(`获取到 ${allItems.length} 条资讯`);

    if (allItems.length === 0) {
      console.log('没有找到新的AI资讯，发送空报告邮件');
      await sendNewsEmail([]);
      return;
    }

    // Step 3: Select top items
    console.log('\n🔍 筛选最佳资讯...');
    const selectedItems = selectTopItems(allItems, MAX_ITEMS);
    console.log(`选择 ${selectedItems.length} 条资讯进行翻译`);

    // Step 4: Translate to Chinese
    console.log('\n🌐 翻译为中文...');
    const translatedItems = await translateTweets(selectedItems);

    // Step 5: Send email
    console.log('\n📧 发送邮件...');
    await sendNewsEmail(translatedItems);

    console.log('\n✅ 完成！所有资讯已发送');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run when executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
