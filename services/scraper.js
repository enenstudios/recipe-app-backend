import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const SCRAPE_TIMEOUT_MS = 15000;

/**
 * Scrapes web content from a URL.
 * Returns the text content or throws an error.
 */
export async function scrapeURL(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      follow: 5,
      headers: {
        // Use a generic UA; Chrome-style UAs are often blocked by recipe sites (e.g. Fitwaffle)
        'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0; +https://github.com/recipe-app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') throw new Error('TIMEOUT');
    if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
      throw new Error('FETCH_ERROR');
    }
    throw new Error('FETCH_ERROR');
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 403 || response.status === 401) throw new Error('ACCESS_DENIED');
    if (response.status === 404) throw new Error('NOT_FOUND');
    throw new Error('HTTP_ERROR');
  }

  let html;
  try {
    html = await response.text();
  } catch (err) {
    throw new Error('FETCH_ERROR');
  }

  let $;
  try {
    $ = cheerio.load(html);
  } catch (err) {
    throw new Error('FETCH_ERROR');
  }

  $('script, style, noscript').remove();
  const rawBody = ($('body').text() || '').replace(/\s+/g, ' ').trim();
  const rawTitle = ($('title').text() || '').trim() || ($('meta[property="og:title"]').attr('content') || '').trim();
  const rawDesc = ($('meta[name="description"]').attr('content') || '').trim() ||
    ($('meta[property="og:description"]').attr('content') || '').trim();
  const recipeContent = ($('[class*="recipe"], [id*="recipe"], [itemtype*="Recipe"]').text() || '').replace(/\s+/g, ' ').trim();
  const instructionContent = ($('[class*="instruction"], [class*="step"], [itemprop="recipeInstructions"], [class*="directions"], [class*="method"], [class*="howto"], ol[class*="recipe"], ol[class*="instruction"], ol[class*="step"]').text() || '').replace(/\s+/g, ' ').trim();

  return {
    text: rawBody.substring(0, 10000),
    title: rawTitle.substring(0, 200),
    description: rawDesc.substring(0, 500),
    recipeContent: recipeContent.substring(0, 5000),
    instructionContent: instructionContent.substring(0, 5000),
    url: url,
  };
}
