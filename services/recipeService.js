import { scrapeURL } from './scraper.js';
import { isRecipe, extractRecipeFromContent, applyProfilePreferences } from './aiService.js';

/**
 * Main service to extract recipe from URL
 * Handles all error cases with user-friendly messages
 * Optionally applies user profile preferences
 */
export async function extractRecipe(url, userProfile = null) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'recipeService.js:8',message:'extractRecipe called',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // Step 1: Scrape the URL
  let scrapedContent;
  try {
    scrapedContent = await scrapeURL(url);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'recipeService.js:13',message:'scrapeURL succeeded',data:{hasContent:!!scrapedContent},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    console.error('[extract] scrapeURL failed:', error.message, error.name, error.code);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'recipeService.js:15',message:'scrapeURL error',data:{error:error.message,errorType:error.constructor.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (error.message === 'ACCESS_DENIED' || error.message === 'NOT_FOUND') {
      const customError = new Error('We couldn\'t access this site. Try another recipe.');
      customError.statusCode = 403;
      customError.cause = error;
      throw customError;
    }
    if (error.message === 'TIMEOUT' || error.message === 'FETCH_ERROR') {
      const customError = new Error('Something went wrong — try again.');
      customError.statusCode = 500;
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
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      recipeCheck = await isRecipe(scrapedContent);
    } catch (retryError) {
      console.error('[extract] isRecipe retry failed:', retryError.message);
      const customError = new Error('Something went wrong — try again.');
      customError.statusCode = 500;
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'recipeService.js:55',message:'calling extractRecipeFromContent',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    recipe = await extractRecipeFromContent(scrapedContent);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'recipeService.js:58',message:'extractRecipeFromContent succeeded',data:{hasTitle:!!recipe.title,hasIngredients:!!recipe.ingredients,ingredientsCount:recipe.ingredients?.length||0,hasSteps:!!recipe.steps,stepsCount:recipe.steps?.length||0,hasIntroduction:!!recipe.introduction},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'recipeService.js:60',message:'extractRecipeFromContent error',data:{error:error.message,errorType:error.constructor.name,stack:error.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('[extract] extractRecipeFromContent failed:', error.message, error.name);
    // Retry once
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      recipe = await extractRecipeFromContent(scrapedContent);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'recipeService.js:65',message:'retry extractRecipeFromContent succeeded',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (retryError) {
      console.error('[extract] extractRecipeFromContent retry failed:', retryError.message, retryError.cause?.message);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'recipeService.js:68',message:'retry extractRecipeFromContent failed',data:{error:retryError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const customError = new Error('Something went wrong — try again.');
      customError.statusCode = 500;
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
