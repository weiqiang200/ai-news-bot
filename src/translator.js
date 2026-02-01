/**
 * Translation Module
 * Translates article summaries using MyMemory API
 */

const axios = require('axios');

// Configuration
const TO_LANG = process.env.TRANSLATE_TO || 'zh-CN';

/**
 * Translate using MyMemory API (free)
 */
async function translateWithMyMemory(text, to = 'zh-CN') {
  if (!text || text.trim() === '') return '';

  try {
    // MyMemory has limits: 5000 chars per request
    const truncated = text.substring(0, 4000);
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(truncated)}&langpair=en|${to}`;

    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;

    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    }
    return `[翻译失败]`;
  } catch (error) {
    return `[翻译失败: ${error.message}]`;
  }
}

/**
 * Translate a single item's summary
 */
async function translateItem(item) {
  // Translate the summary (already extracted by fetcher)
  const summaryToTranslate = item.summary || '';

  if (!summaryToTranslate) {
    return {
      ...item,
      translatedSummary: ''
    };
  }

  const translatedSummary = await translateWithMyMemory(summaryToTranslate, TO_LANG);

  return {
    ...item,
    translatedSummary
  };
}

/**
 * Translate multiple items
 */
async function translateTweets(items) {
  console.log(`Translating ${items.length} summaries to Chinese...`);

  const translatedItems = [];

  for (let i = 0; i < items.length; i++) {
    const translated = await translateItem(items[i]);
    translatedItems.push(translated);

    // Progress log
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
  translateTweets
};
