import express from 'express';
import { extractRecipe } from '../services/recipeService.js';
import { validateURL, normalizeURLForExtract } from '../utils/validation.js';

const router = express.Router();

router.post('/extract', async (req, res, next) => {
  try {
    const { url, profile } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL is required'
      });
    }
    
    const normalized = normalizeURLForExtract(url);
    if (!normalized) {
      return res.status(400).json({
        error: 'This doesn\'t look like a valid recipe link.'
      });
    }
    
    const validationError = validateURL(normalized);
    if (validationError) {
      return res.status(400).json({
        error: 'This doesn\'t look like a valid recipe link.'
      });
    }
    
    const result = await extractRecipe(normalized, profile || null);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/recipe.js:28',message:'Sending response',data:{hasOriginalRecipe:!!result.originalRecipe,hasModifications:!!result.modifications,resultKeys:Object.keys(result),originalRecipeKeys:result.originalRecipe ? Object.keys(result.originalRecipe) : []},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    res.json(result);
  } catch (error) {
    console.error('[extract] route catch:', error.message, 'statusCode=', error.statusCode, 'cause=', error.cause?.message);
    next(error);
  }
});

export { router as recipeRouter };
