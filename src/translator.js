/**
 * Translation Module
 * Uses Google Translate API to translate tweet content
 */

const { translate } = require('google-translate-api');
const axios = require('axios');

// Configuration
const FROM_LANG = process.env.TRANSLATE_FROM || 'auto';
const TO_LANG = process.env.TRANSLATE_TO || 'zh-CN';

/**
 * Translate text using Google Translate
 */
async function translateText(text, from = FROM_LANG, to = TO_LANG) {
  if (!text || text.trim() === '') {
    return '';
  }

  try {
    const result = await translate(text, { from, to });
    return result.text;
  } catch (error) {
    console.error('Translation error:', error.message);
    return '[翻译失败]';
  }
}

/**
 * Translate multiple texts in batch
 * Note: Google Translate API has rate limits, so we add delays
 */
async function translateBatch(texts, from = FROM_LANG, to = TO_LANG) {
  const results = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];

    // Add delay to avoid rate limiting
    if (i > 0 && i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const translated = await translateText(text, from, to);
    results.push(translated);
  }

  return results;
}

/**
 * Translate a tweet object (original + translation)
 */
async function translateTweet(tweet) {
  const originalContent = tweet.content;

  if (!originalContent) {
    return {
      ...tweet,
      originalContent: '',
      translatedContent: ''
    };
  }

  // Translate the content
  const translatedContent = await translateText(originalContent);

  return {
    ...tweet,
    originalContent,
    translatedContent
  };
}

/**
 * Translate multiple tweets
 */
async function translateTweets(tweets) {
  console.log(`Transracting ${tweets.length} tweets to Chinese...`);

  const translatedTweets = [];

  for (let i = 0; i < tweets.length; i++) {
    const translated = await translateTweet(tweets[i]);
    translatedTweets.push(translated);

    // Progress log
    if ((i + 1) % 5 === 0) {
      console.log(`Progress: ${i + 1}/${tweets.length}`);
    }
  }

  console.log('Translation completed!');
  return translatedTweets;
}

module.exports = {
  translateText,
  translateBatch,
  translateTweet,
  translateTweets
};
