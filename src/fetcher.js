/**
 * RSS Fetcher Module
 * Fetches AI news from Twitter accounts via RSSHub
 */

const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser();

// AI Twitter accounts to follow
const TWITTER_ACCOUNTS = [
  { name: 'AnthropicAI', handle: 'AnthropicAI' },
  { name: 'OpenAI', handle: 'OpenAI' },
  { name: 'DeepMind', handle: 'DeepMind' },
  { name: 'Yann LeCun', handle: 'ylecun' },
  { name: 'Andrew Ng', handle: 'AndrewYNg' },
  { name: 'Ian Goodfellow', handle: 'goodfellow_ian' },
  { name: 'Demis Hassabis', handle: 'demishassabis' },
  { name: 'Jeff Dean', handle: 'JeffDean' },
  { name: 'Fei-Fei Li', handle: 'drfeifei' },
  { name: 'Sam Altman', handle: 'sama' }
];

const RSSHUB_BASE = process.env.RSSHUB_URL || 'https://rsshub.app';

/**
 * Get RSS URL for a Twitter user
 */
function getRssUrl(handle) {
  return `${RSSHUB_BASE}/twitter/user/${handle}`;
}

/**
 * Fetch tweets from a single account
 */
async function fetchAccountTweets(account) {
  try {
    const url = getRssUrl(account.handle);
    console.log(`  Fetching @${account.handle}...`);
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    const feed = await parser.parseString(response.data);
    console.log(`    Got ${feed.items?.length || 0} items from @${account.handle}`);

    if (!feed.items || feed.items.length === 0) {
      return [];
    }

    return feed.items.map(item => ({
      title: item.title || '',
      content: item.contentSnippet || item.content || item.description || '',
      link: item.link,
      pubDate: item.pubDate || item.isoDate,
      author: account.name,
      authorHandle: account.handle
    }));
  } catch (error) {
    console.error(`  Failed to fetch @${account.handle}:`, error.message.substring(0, 100));
    return [];
  }
}

/**
 * Filter tweets from the last N days
 */
function filterRecentTweets(tweets, days = 3) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return tweets.filter(tweet => {
    const pubDate = new Date(tweet.pubDate);
    return pubDate >= cutoffDate;
  });
}

/**
 * Clean tweet content - remove extra whitespace and truncate
 */
function cleanTweetContent(content) {
  if (!content) return '';

  // Remove extra whitespace
  let cleaned = content.replace(/\s+/g, ' ').trim();

  // Remove tweet-specific patterns like "pic.twitter.com/xxx"
  cleaned = cleaned.replace(/pic\.twitter\.com\/\w+/gi, '');

  // Truncate if too long (for readability)
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 500) + '...';
  }

  return cleaned.trim();
}

/**
 * Main function to fetch all AI news
 */
async function fetchAINews() {
  console.log('Fetching AI news from Twitter...');

  const allTweets = [];

  // Fetch from all accounts concurrently
  const results = await Promise.allSettled(
    TWITTER_ACCOUNTS.map(account => fetchAccountTweets(account))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allTweets.push(...result.value);
    } else if (result.status === 'rejected') {
      console.log(`  Failed: ${TWITTER_ACCOUNTS[index].handle}`);
    }
  });

  console.log(`Total raw tweets: ${allTweets.length}`);

  // Filter to recent tweets (last 3 days)
  const recentTweets = filterRecentTweets(allTweets, 3);
  console.log(`Recent tweets (last 3 days): ${recentTweets.length}`);

  // Clean each tweet
  const cleanedTweets = recentTweets.map(tweet => ({
    ...tweet,
    content: cleanTweetContent(tweet.content)
  }));

  // Sort by date (newest first)
  cleanedTweets.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`Found ${cleanedTweets.length} recent AI-related tweets`);

  return cleanedTweets;
}

/**
 * Select top N tweets to include in the email
 */
function selectTopTweets(tweets, count = 15) {
  // Remove duplicates based on content
  const uniqueTweets = [];
  const seenContent = new Set();

  for (const tweet of tweets) {
    const contentKey = tweet.content.toLowerCase().substring(0, 100);
    if (!seenContent.has(contentKey)) {
      seenContent.add(contentKey);
      uniqueTweets.push(tweet);
    }
  }

  return uniqueTweets.slice(0, count);
}

module.exports = {
  fetchAINews,
  selectTopTweets,
  TWITTER_ACCOUNTS
};
