import express from 'express';
import { extractRecipe } from '../services/recipeService.js';
import { validateURL, normalizeURLForExtract } from '../utils/validation.js';

const router = express.Router();

function validateProfile(profile) {
  if (profile == null) return null;
  if (typeof profile !== 'object' || Array.isArray(profile)) {
    const e = new Error('Invalid profile format.');
    e.statusCode = 400;
    throw e;
  }
  const MAX_ITEMS = 20;
  const MAX_LEN = 100;
  const stringArray = (val, field) => {
    if (val == null) return undefined;
    if (!Array.isArray(val)) {
      const e = new Error(`profile.${field} must be an array.`);
      e.statusCode = 400;
      throw e;
    }
    if (val.length > MAX_ITEMS) {
      const e = new Error(`profile.${field} exceeds maximum length.`);
      e.statusCode = 400;
      throw e;
    }
    return val.map(s => {
      if (typeof s !== 'string') {
        const e = new Error(`profile.${field} must contain only strings.`);
        e.statusCode = 400;
        throw e;
      }
      return s.trim().slice(0, MAX_LEN);
    }).filter(Boolean);
  };
  const out = {};
  if (profile.allergies !== undefined)          out.allergies = stringArray(profile.allergies, 'allergies');
  if (profile.dietaryPreferences !== undefined) out.dietaryPreferences = stringArray(profile.dietaryPreferences, 'dietaryPreferences');
  if (profile.bespokePreferences !== undefined) out.bespokePreferences = stringArray(profile.bespokePreferences, 'bespokePreferences');
  if (profile.cookingStyle !== undefined) {
    const s = Number(profile.cookingStyle);
    if (!Number.isInteger(s) || s < 1 || s > 5) {
      const e = new Error('profile.cookingStyle must be an integer 1\u20135.');
      e.statusCode = 400;
      throw e;
    }
    out.cookingStyle = s;
  }
  return out;
}

router.post('/extract', async (req, res, next) => {
  try {
    const { url, profile: rawProfile } = req.body;

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

    const profile = validateProfile(rawProfile);
    const result = await extractRecipe(normalized, profile);

    res.json(result);
  } catch (error) {
    console.error('[extract] route catch:', error.message, 'statusCode=', error.statusCode, 'cause=', error.cause?.message);
    next(error);
  }
});

export { router as recipeRouter };
