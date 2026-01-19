import express from 'express';
import { extractRecipe } from '../services/recipeService.js';
import { validateURL } from '../utils/validation.js';

const router = express.Router();

router.post('/extract', async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'URL is required'
      });
    }
    
    // Validate URL
    const validationError = validateURL(url);
    if (validationError) {
      return res.status(400).json({
        error: 'This doesn\'t look like a valid recipe link.'
      });
    }
    
    // Extract recipe
    const recipe = await extractRecipe(url);
    
    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

export { router as recipeRouter };
