/**
 * AI News Fetcher Module
 * Fetches AI news from Hacker News and AI company blogs
 */

const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser();

// Stable RSS sources
const RSS_SOURCES = [
  // AI Company Blogs
  { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml', type: 'blog' },
  { name: 'Anthropic Blog', url: 'https://www.anthropic.com/rss.xml', type: 'blog' },
  { name: 'DeepMind Blog', url: 'https://deepmind.google/blog/rss/', type: 'blog' },
  { name: 'Google AI Blog', url: 'http://googleaiblog.blogspot.com/atom.xml', type: 'blog' },
  { name: 'Meta AI Blog', url: 'https://ai.meta.com/blog/rss/', type: 'blog' },
  { name: 'MIT News - AI', url: 'https://news.mit.edu/rss/topic/artificial-intelligence2', type: 'news' },
  { name: 'Wired AI', url: 'https://www.wired.com/feed/category/ai/latest/rss', type: 'news' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai/index.xml', type: 'news' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', type: 'news' },
];

/**
 * Fetch AI stories from Hacker News
 */
async function fetchHackerNewsAI() {
  try {
    console.log('  Fetching from Hacker News...');
    const response = await axios.get(
      'https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&hitsPerPage=30',
      { timeout: 15000 }
    );

    const stories = response.data.hits.map(story => ({
      title: story.title || '',
      content: `${story.title}\n${story.url || 'https://news.ycombinator.com/item?id=' + story.objectID}`,
      link: story.url || `https://news.ycombinator.com/item?id=${story.objectID}`,
      pubDate: new Date(story.created_at).toISOString(),
      author: story.author || 'Anonymous',
      authorHandle: 'HackerNews',
      points: story.points || 0
    }));

    console.log(`    Got ${stories.length} AI stories from Hacker News`);
    return stories;
  } catch (error) {
    console.log(`    Failed: ${error.message.substring(0, 60)}`);
    return [];
  }
}

/**
 * Fetch from a single RSS source
 */
async function fetchRssSource(source) {
  try {
    console.log(`  Fetching ${source.name}...`);
    const response = await axios.get(source.url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    const feed = await parser.parseString(response.data);

    if (!feed.items || feed.items.length === 0) {
      console.log(`    No items from ${source.name}`);
      return [];
    }

    const items = feed.items.slice(0, 10).map(item => ({
      title: item.title || '',
      content: item.contentSnippet || item.content || item.description || '',
      link: item.link || item.id,
      pubDate: item.pubDate || item.isoDate,
      author: source.name,
      authorHandle: source.name.replace(/\s+/g, '')
    }));

    console.log(`    Got ${items.length} items from ${source.name}`);
    return items;
  } catch (error) {
    console.log(`    Failed: ${error.message.substring(0, 60)}`);
    return [];
  }
}

/**
 * Filter items from the last N days
 */
function filterRecentItems(items, days = 3) {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return items.filter(item => {
    try {
      const pubDate = new Date(item.pubDate);
      return pubDate >= cutoffDate;
    } catch {
      return false;
    }
  });
}

/**
 * Clean content
 */
function cleanContent(content) {
  if (!content) return '';
  // Remove HTML tags
  let cleaned = content.replace(/<[^>]*>/g, ' ');
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Truncate if too long
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 500) + '...';
  }
  return cleaned.trim();
}

/**
 * Main function to fetch all AI news
 */
async function fetchAINews() {
  console.log('Fetching AI news...');

  const allItems = [];

  // Fetch Hacker News AI stories
  const hnStories = await fetchHackerNewsAI();
  allItems.push(...hnStories);

  // Fetch from all RSS sources concurrently
  const rssResults = await Promise.allSettled(
    RSS_SOURCES.map(source => fetchRssSource(source))
  );

  rssResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
  });

  console.log(`Total raw items: ${allItems.length}`);

  // Filter to recent items (last 3 days)
  const recentItems = filterRecentItems(allItems, 3);
  console.log(`Recent items (last 3 days): ${recentItems.length}`);

  // Clean each item
  const cleanedItems = recentItems.map(item => ({
    ...item,
    content: cleanContent(item.content)
  }));

  // Sort by date (newest first)
  cleanedItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  console.log(`Found ${cleanedItems.length} recent AI news items`);

  return cleanedItems;
}

/**
 * Select top N items to include in the email
 */
function selectTopItems(items, count = 15) {
  // Sort by points (for HN) or just take unique
  const sorted = [...items].sort((a, b) => (b.points || 0) - (a.points || 0));

  // Remove duplicates based on title
  const uniqueItems = [];
  const seenTitles = new Set();

  for (const item of sorted) {
    const titleKey = item.title.toLowerCase().substring(0, 50);
    if (!seenTitles.has(titleKey)) {
      seenTitles.add(titleKey);
      uniqueItems.push(item);
    }
  }

  return uniqueItems.slice(0, count);
}

module.exports = {
  fetchAINews,
  selectTopItems,
  RSS_SOURCES
};
