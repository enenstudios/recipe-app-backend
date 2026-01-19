import { scrapeURL } from './scraper.js';
import { isRecipe, extractRecipeFromContent } from './aiService.js';

/**
 * Main service to extract recipe from URL
 * Handles all error cases with user-friendly messages
 */
export async function extractRecipe(url) {
  // Step 1: Scrape the URL
  let scrapedContent;
  try {
    scrapedContent = await scrapeURL(url);
  } catch (error) {
    if (error.message === 'ACCESS_DENIED' || error.message === 'NOT_FOUND') {
      const customError = new Error('We couldn\'t access this site. Try another recipe.');
      customError.statusCode = 403;
      throw customError;
    }
    if (error.message === 'TIMEOUT' || error.message === 'FETCH_ERROR') {
      const customError = new Error('Something went wrong — try again.');
      customError.statusCode = 500;
      throw customError;
    }
    const customError = new Error('We couldn\'t access this site. Try another recipe.');
    customError.statusCode = 403;
    throw customError;
  }
  
  // Step 2: Check if it's a recipe using AI
  let recipeCheck;
  try {
    recipeCheck = await isRecipe(scrapedContent);
  } catch (error) {
    console.error('Error checking if recipe:', error);
    // Retry once
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      recipeCheck = await isRecipe(scrapedContent);
    } catch (retryError) {
      const customError = new Error('Something went wrong — try again.');
      customError.statusCode = 500;
      throw customError;
    }
  }
  
  if (!recipeCheck) {
    const customError = new Error('We couldn\'t find a recipe on this page.');
    customError.statusCode = 422;
    throw customError;
  }
  
  // Step 3: Extract recipe information
  let recipe;
  try {
    recipe = await extractRecipeFromContent(scrapedContent);
  } catch (error) {
    console.error('Error extracting recipe:', error);
    // Retry once
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      recipe = await extractRecipeFromContent(scrapedContent);
    } catch (retryError) {
      const customError = new Error('Something went wrong — try again.');
      customError.statusCode = 500;
      throw customError;
    }
  }
  
  // Add URL to recipe
  recipe.url = url;
  
  return recipe;
}
