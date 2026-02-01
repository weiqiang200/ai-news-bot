/**
 * AI News Fetcher Module
 * Fetches AI news from Hacker News and AI company blogs
 */

const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser();

// Stable RSS sources
const RSS_SOURCES = [
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
 * Generate a simple summary from content
 */
function generateSummary(content, maxLength = 200) {
  if (!content) return '';

  // Remove HTML tags
  let text = content.replace(/<[^>]*>/g, ' ');

  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // If content is short, return as is
  if (text.length <= maxLength) {
    return text;
  }

  // Find a good break point (at sentence boundary)
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclaim = truncated.lastIndexOf('!');

  const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclaim);

  if (lastSentenceEnd > maxLength * 0.5) {
    return text.substring(0, lastSentenceEnd + 1);
  }

  return truncated + '...';
}

/**
 * Fetch AI stories from Hacker News
 */
async function fetchHackerNewsAI() {
  try {
    console.log('  Fetching from Hacker News...');
    const response = await axios.get(
      'https://hn.algolia.com/api/v1/search_by_date?query=AI%20OR%20artificial%20intelligence&tags=story&hitsPerPage=30',
      { timeout: 15000 }
    );

    const stories = response.data.hits.map(story => ({
      title: story.title || '',
      content: story.story_text || story.comment_text || story.title || '',
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

    const items = feed.items.slice(0, 10).map(item => {
      // Prefer content:encoded for full content
      let fullContent = item['content:encoded'] || item.contentSnippet || item.content || item.description || '';

      return {
        title: item.title || '',
        content: fullContent,
        link: item.link || item.id,
        pubDate: item.pubDate || item.isoDate,
        author: source.name,
        authorHandle: source.name.replace(/\s+/g, ''),
        points: 0
      };
    });

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
 * Clean and summarize content
 */
function processContent(item) {
  // Generate summary
  const summary = generateSummary(item.content || item.title || '', 300);

  // Clean the content for display
  let cleanContent = item.content || '';
  cleanContent = cleanContent.replace(/<[^>]*>/g, ' ');
  cleanContent = cleanContent.replace(/\s+/g, ' ').trim();
  if (cleanContent.length > 800) {
    cleanContent = cleanContent.substring(0, 800) + '...';
  }

  return {
    ...item,
    summary,
    cleanContent
  };
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

  // Process each item (generate summary)
  const processedItems = recentItems.map(item => processContent(item));

  // Sort by points (HN) or date
  processedItems.sort((a, b) => (b.points || 0) - (a.points || 0));

  console.log(`Found ${processedItems.length} recent AI news items`);

  return processedItems;
}

/**
 * Select top N items
 */
function selectTopItems(items, count = 15) {
  const uniqueItems = [];
  const seenTitles = new Set();

  for (const item of items) {
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
