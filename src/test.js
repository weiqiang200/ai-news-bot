/**
 * Test script for AI News Bot
 * Run with: node src/test.js
 */

require('dotenv').config();

const { fetchAINews, selectTopTweets } = require('./fetcher');
const { translateTweets } = require('./translator');
const { sendNewsEmail, verifyConnection, generateEmailHtml } = require('./mailer');

async function runTests() {
  console.log('🧪 AI News Bot Tests\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Verify email connection
    console.log('\n📧 Test 1: 验证邮件配置...');
    const isValid = await verifyConnection();
    if (!isValid) {
      console.log('❌ 邮件配置验证失败，请检查 .env 配置');
      console.log('   确保 QQ_EMAIL 和 QQ_AUTH_CODE 已设置');
      process.exit(1);
    }
    console.log('✅ 邮件配置验证通过');

    // Test 2: Fetch tweets
    console.log('\n📰 Test 2: 获取推文...');
    const tweets = await fetchAINews();
    console.log(`✅ 获取到 ${tweets.length} 条推文`);

    // Test 3: Select top tweets
    console.log('\n🔍 Test 3: 筛选推文...');
    const selected = selectTopTweets(tweets, 5);
    console.log(`✅ 筛选出 ${selected.length} 条优质推文`);

    if (selected.length > 0) {
      // Test 4: Translate
      console.log('\n🌐 Test 4: 翻译测试 (翻译1条)...');
      const translated = await translateTweets([selected[0]]);
      console.log('✅ 翻译完成');
      console.log('\n示例翻译:');
      console.log('-'.repeat(40));
      console.log(`原文: ${translated[0].originalContent.substring(0, 100)}...`);
      console.log(`译文: ${translated[0].translatedContent.substring(0, 100)}...`);

      // Test 5: Generate email HTML
      console.log('\n📧 Test 5: 生成邮件HTML...');
      const html = generateEmailHtml(translated);
      console.log(`✅ 邮件HTML生成完成 (${html.length} 字符)`);

      // Test 6: Send test email
      console.log('\n📨 Test 6: 发送测试邮件...');
      await sendNewsEmail(translated);
      console.log('✅ 测试邮件已发送');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 所有测试通过!');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

runTests();
