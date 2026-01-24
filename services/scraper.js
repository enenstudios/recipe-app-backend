import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * Scrapes web content from a URL
 * Returns the text content or throws an error
 */
export async function scrapeURL(url) {
  let response;
  
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 10000, // 10 second timeout
      redirect: 'follow',
      follow: 5
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
      throw new Error('TIMEOUT');
    }
    throw new Error('FETCH_ERROR');
  }
  
  // Check for non-200 responses
  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
      throw new Error('ACCESS_DENIED');
    }
    if (response.status === 404) {
      throw new Error('NOT_FOUND');
    }
    throw new Error('HTTP_ERROR');
  }
  
  const html = await response.text();
  
  // Parse with cheerio
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style, noscript').remove();
  
  // Extract text content
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  
  // Also get meta description and title
  const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
  const description = $('meta[name="description"]').attr('content') || 
                      $('meta[property="og:description"]').attr('content') || '';
  
  // Try to find recipe-specific content
  const recipeContent = $('[class*="recipe"], [id*="recipe"], [itemtype*="Recipe"]').text().replace(/\s+/g, ' ').trim();
  
  // Try to find instruction-specific content - prioritize this for better extraction
  const instructionContent = $('[class*="instruction"], [class*="step"], [itemprop="recipeInstructions"], [class*="directions"], [class*="method"], [class*="howto"], ol[class*="recipe"], ol[class*="instruction"], ol[class*="step"]').text().replace(/\s+/g, ' ').trim();
  
  return {
    text: text.substring(0, 10000), // Limit to 10k characters for AI processing
    title: title.substring(0, 200),
    description: description.substring(0, 500),
    recipeContent: recipeContent.substring(0, 5000),
    instructionContent: instructionContent.substring(0, 5000),
    url: url
  };
}
