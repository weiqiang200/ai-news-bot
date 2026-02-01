/**
 * Translation Module
 * Uses free translation APIs with fallback
 */

const axios = require('axios');

// Configuration
const FROM_LANG = process.env.TRANSLATE_FROM || 'en';
const TO_LANG = process.env.TRANSLATE_TO || 'zh-CN';

/**
 * Translate using MyMemory API (free, no key required)
 * Source: https://mymemory.translated.net/doc/spec.php
 */
async function translateWithMyMemory(text, from = 'en', to = 'zh-CN') {
  if (!text || text.trim() === '') return '';

  try {
    // MyMemory has limits: 5000 chars per request
    const truncated = text.substring(0, 4000);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=${from}|${to}`;

    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    }
    return `[翻译失败: ${data.responseDetails || 'unknown'}]`;
  } catch (error) {
    return `[翻译失败: ${error.message}]`;
  }
}

/**
 * Translate text
 */
async function translateText(text, from = FROM_LANG, to = TO_LANG) {
  if (!text || text.trim() === '') return '';

  // MyMemory works best with English source
  const sourceLang = from === 'auto' ? 'en' : from;

  return await translateWithMyMemory(text, sourceLang, to);
}

/**
 * Translate a single item
 */
async function translateItem(item) {
  const originalContent = item.content || item.title || '';

  if (!originalContent) {
    return {
      ...item,
      originalContent: '',
      translatedContent: ''
    };
  }

  // Translate the content
  const translatedContent = await translateText(originalContent);

  return {
    ...item,
    originalContent,
    translatedContent
  };
}

/**
 * Translate multiple items
 */
async function translateTweets(items) {
  console.log(`Translating ${items.length} items to Chinese...`);

  const translatedItems = [];

  for (let i = 0; i < items.length; i++) {
    const translated = await translateItem(items[i]);
    translatedItems.push(translated);

    // Progress log and delay to avoid rate limiting
    if ((i + 1) % 5 === 0) {
      console.log(`Progress: ${i + 1}/${items.length}`);
    }

    // Add delay between requests (500ms)
    if (i < items.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('Translation completed!');
  return translatedItems;
}

module.exports = {
  translateText,
  translateTweets
};
