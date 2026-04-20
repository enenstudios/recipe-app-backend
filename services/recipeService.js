import { scrapeURL } from './scraper.js';
import { isRecipe, extractRecipeFromContent, applyProfilePreferences } from './aiService.js';

export async function extractRecipe(url, userProfile = null) {
  // Step 1: Scrape the URL
  let scrapedContent;
  try {
    scrapedContent = await scrapeURL(url);
  } catch (error) {
    console.error('[extract] scrapeURL failed:', error.message, error.name, error.code);
    if (error.message === 'ACCESS_DENIED' || error.message === 'NOT_FOUND') {
      const customError = new Error('We couldn\'t access this site. Try another recipe.');
      customError.statusCode = 403;
      customError.cause = error;
      throw customError;
    }
    if (error.message === 'TIMEOUT' || error.message === 'FETCH_ERROR') {
      const customError = new Error('Something went wrong \u2014 try again.');
      customError.statusCode = 500;
      customError.step = 'scrape';
      customError.cause = error;
      throw customError;
    }
    const customError = new Error('We couldn\'t access this site. Try another recipe.');
    customError.statusCode = 403;
    customError.cause = error;
    throw customError;
  }

  // Step 2: Check if it's a recipe using AI
  let recipeCheck;
  try {
    recipeCheck = await isRecipe(scrapedContent);
  } catch (error) {
    console.error('[extract] isRecipe failed:', error.message, error.name);
    // Retry once
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      recipeCheck = await isRecipe(scrapedContent);
    } catch (retryError) {
      console.error('[extract] isRecipe retry failed:', retryError.message);
      const customError = new Error('Something went wrong \u2014 try again.');
      customError.statusCode = 500;
      customError.step = 'isRecipe';
      customError.cause = retryError;
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
    console.error('[extract] extractRecipeFromContent failed:', error.message, error.name);
    // Retry once
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      recipe = await extractRecipeFromContent(scrapedContent);
    } catch (retryError) {
      console.error('[extract] extractRecipeFromContent retry failed:', retryError.message, retryError.cause?.message);
      const customError = new Error('Something went wrong \u2014 try again.');
      customError.statusCode = 500;
      customError.step = 'extract';
      customError.cause = retryError;
      throw customError;
    }
  }

  // Add URL to recipe
  recipe.url = url;

  // Apply profile preferences if provided
  if (userProfile) {
    try {
      const modifications = await applyProfilePreferences(recipe, userProfile);

      return {
        originalRecipe: recipe,
        modifications: {
          warnings: modifications.warnings,
          substitutions: modifications.substitutions,
          modifiedRecipe: modifications.modifiedRecipe
        }
      };
    } catch (error) {
      console.error('Error applying profile preferences:', error);
      // Return original recipe if profile application fails
      return {
        originalRecipe: recipe,
        modifications: {
          warnings: [],
          substitutions: [],
          modifiedRecipe: recipe
        }
      };
    }
  }

  // Return in consistent format even without profile
  return {
    originalRecipe: recipe,
    modifications: {
      warnings: [],
      substitutions: [],
      modifiedRecipe: recipe
    }
  };
}
