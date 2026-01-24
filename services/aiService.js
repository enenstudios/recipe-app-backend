import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
});

// Predefined grocery aisle categories
const GROCERY_AISLES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Bakery',
  'Pantry/Dry Goods',
  'Frozen',
  'Beverages',
  'Other'
];

/** Parse JSON from model output; strip markdown code blocks if present. */
function parseJSON(str) {
  if (!str || typeof str !== 'string') throw new SyntaxError('Empty or invalid JSON string');
  let s = str.trim();
  const md = /^```(?:json)?\s*([\s\S]*?)```\s*$/;
  const m = s.match(md);
  if (m) s = m[1].trim();
  return JSON.parse(s);
}

/**
 * Determines if the scraped content contains a recipe
 */
export async function isRecipe(content) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that determines if web content contains a recipe. Respond with only "yes" or "no".'
        },
        {
          role: 'user',
          content: `Does this web content contain a recipe?\n\nTitle: ${content.title}\n\nContent: ${content.text.substring(0, 2000)}`
        }
      ],
      max_tokens: 10,
      temperature: 0
    });
    
    const answer = response.choices[0].message.content.trim().toLowerCase();
    return answer === 'yes' || answer.startsWith('yes');
  } catch (error) {
    console.error('Error checking if recipe:', error);
    throw error;
  }
}

/**
 * Extracts recipe information from web content with structured steps
 */
export async function extractRecipeFromContent(content) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:51',message:'extractRecipeFromContent called',data:{hasContent:!!content},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Prioritize instruction-specific content if available
    const primaryContent = content.instructionContent || content.recipeContent || content.text.substring(0, 3000);
    
    // First, extract ingredients
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:57',message:'calling extractIngredients',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const ingredients = await extractIngredients(content);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:60',message:'extractIngredients completed',data:{ingredientsCount:ingredients?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Extract introduction separately
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:63',message:'calling extractIntroduction',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const introduction = await extractIntroduction(content);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:66',message:'extractIntroduction completed',data:{hasIntroduction:!!introduction,introLength:introduction?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Then extract structured steps with tips and alternatives
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:69',message:'calling extractStructuredSteps',data:{ingredientsCount:ingredients?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const steps = await extractStructuredSteps(content, ingredients);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:72',message:'extractStructuredSteps completed',data:{stepsCount:steps?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const title = await extractTitle(content);
    const result = {
      title: title,
      ingredients: ingredients,
      introduction: introduction,
      steps: steps
    };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:80',message:'extractRecipeFromContent returning',data:{hasTitle:!!result.title,hasIngredients:!!result.ingredients,hasSteps:!!result.steps,hasIntroduction:!!result.introduction,resultKeys:Object.keys(result)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return result;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4a6fd756-1d14-48cb-b935-5fa63a916716',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'aiService.js:83',message:'extractRecipeFromContent error',data:{error:error.message,errorType:error.constructor.name,isSyntaxError:error instanceof SyntaxError,stack:error.stack?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Error extracting recipe:', error);
    
    if (error instanceof SyntaxError) {
      // Try one more time with a simpler prompt
      return retryExtraction(content);
    }
    
    throw error;
  }
}

/**
 * Extracts recipe title from content
 */
async function extractTitle(content) {
  if (content.title && content.title.trim()) {
    return content.title.trim();
  }
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract the recipe title. Return only the title, nothing else.'
        },
        {
          role: 'user',
          content: `Extract the recipe title from: ${content.text.substring(0, 1000)}`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    return 'Recipe';
  }
}

/**
 * Extracts introductory/narrative content from recipe (description, context, etc.)
 * This is content that appears before the actual cooking steps
 */
async function extractIntroduction(content) {
  const primaryContent = content.instructionContent || content.recipeContent || content.text.substring(0, 3000);
  
  const prompt = `Extract any introductory or descriptive text about this recipe. This includes:
- Recipe descriptions or context
- Why the recipe is good or when to enjoy it
- General information about the dish
- Author's personal notes or stories about the recipe

DO NOT include:
- Ingredient lists
- Cooking instructions or steps
- Tips that are part of specific steps
- Nutritional information

If there is no introductory content, return null.

Return JSON with this structure:
{
  "introduction": "introductory text here" or null
}

Web content:
Title: ${content.title}
Description: ${content.description}
${content.instructionContent ? `Instructions: ${content.instructionContent.substring(0, 2000)}` : ''}
Recipe content: ${primaryContent.substring(0, 3000)}
Full text: ${content.text.substring(0, 4000)}

Return only valid JSON, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract recipe introduction/description. Return valid JSON only. Return null if no introduction exists.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500
    });
    
    const result = parseJSON(response.choices[0].message.content);
    const intro = result?.introduction;
    return intro && typeof intro === 'string' && intro.trim() ? intro.trim() : null;
  } catch (error) {
    console.error('Error extracting introduction:', error);
    return null;
  }
}

/**
 * Extracts ingredients from content
 */
async function extractIngredients(content) {
  const primaryContent = content.instructionContent || content.recipeContent || content.text.substring(0, 3000);
  
  const prompt = `Extract ONLY the ingredients list from this recipe content. Return a JSON array of ingredients.

Return JSON with this exact structure:
{
  "ingredients": [
    {
      "name": "ingredient name (normalized, singular form when possible)",
      "quantity": "amount (e.g., '2 cups', '1 tsp', '200g') or null if not specified",
      "aisle": "one of: ${GROCERY_AISLES.join(', ')}"
    }
  ]
}

Rules:
1. Extract ONLY ingredients that are actually used in the recipe
2. Normalize ingredient names (e.g., "sweet potatoes" not "sweet potato", "onion" not "onions")
3. For each ingredient, assign it to the most appropriate aisle
4. Quantity should include units if mentioned, otherwise use null
5. Do NOT include ingredients mentioned only in descriptions or tips

Web content:
Title: ${content.title}
${content.instructionContent ? `Instructions: ${content.instructionContent.substring(0, 4000)}` : ''}
Recipe content: ${primaryContent.substring(0, 4000)}
Full text: ${content.text.substring(0, 5000)}

Return only valid JSON, no additional text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that extracts recipe ingredients. Always return valid JSON only. Extract only the actual ingredients used in the recipe, not descriptions or tips.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 2000
  });
  
  const result = parseJSON(response.choices[0].message.content);
  const raw = Array.isArray(result.ingredients) ? result.ingredients : [];
  const ingredients = raw
    .filter(ing => ing && typeof ing === 'object' && (ing.name || ing.ingredient))
    .map(ing => ({
      name: ing.name || ing.ingredient || 'Unknown',
      quantity: ing.quantity ?? null,
      aisle: normalizeAisle(ing.aisle)
    }));
  return ingredients;
}

/**
 * Extracts structured steps with tips, alternatives, and ingredient linking
 */
async function extractStructuredSteps(content, ingredients) {
  const primaryContent = content.instructionContent || content.recipeContent || content.text.substring(0, 3000);
  const ingredientNames = ingredients.map(ing => ing.name.toLowerCase()).join(', ');
  
  const prompt = `Extract the recipe cooking instructions as numbered steps. Return a JSON object with structured steps.

Return JSON with this exact structure:
{
  "steps": [
    {
      "number": 1,
      "instruction": "Clean, concise step instruction without narrative or ingredient descriptions",
      "ingredients": ["ingredient name 1", "ingredient name 2"],
      "tips": [
        {
          "text": "Tip text here",
          "trigger": "word or phrase in instruction that triggers this tip"
        }
      ],
      "alternatives": [
        {
          "text": "Alternative method or ingredient",
          "position": "after"
        }
      ]
    }
  ]
}

CRITICAL RULES:
1. Extract ONLY the numbered step-by-step cooking instructions
2. Remove ALL narrative, author stories, ingredient descriptions, introductory paragraphs, and redundant content
3. Remove any introductory text that describes the recipe, why it's good, when to enjoy it, or general context - this should NOT be in steps
4. Each step should be a single, clear action
5. Number steps sequentially starting from 1
6. For "ingredients" array in each step: list ingredient names (normalized, lowercase) that are mentioned or used in that step. Match to these available ingredients: ${ingredientNames}
7. For "tips": Extract helpful tips, hints, or notes that relate to the step. Include the trigger word/phrase from the instruction.
8. For "alternatives": Extract alternative methods, tools, or ingredients mentioned (e.g., "Alternatively, you could use..."). Position should be "before", "after", or "inline".
9. Keep instructions concise - remove filler words and narrative
10. If a tip mentions a specific ingredient, set the trigger to that ingredient name
11. Do NOT repeat ingredient lists in steps - only reference ingredients that are actively used in that step
12. Do NOT include introductory paragraphs like "Use up your ripe bananas to make easy vegan banana bread - the perfect breakfast treat..." - these are NOT steps

Example of good extraction:
Input: "First, sauté the veggies. In a large pot or Dutch oven, cook the onion until it softens, for about 5 minutes. Then, add the sweet potatoes and apple and cook until they start to soften, for another 8 to 10 minutes. Next, stir in the seasonings. Add the garlic, ginger, coriander, and smoked paprika and stir until they're fragrant. Then, mix in the apple cider vinegar, followed by the broth and the coconut milk. (Tip: I like to reserve 1/4 cup of my coconut milk for garnish. It creates such a pretty white swirl on the orange soup!) Then, simmer. Bring the soup to a boil, cover the pot, and simmer until the sweet potatoes are tender. Finally, puree the soup! Allow the soup to cool slightly before transferring it to a large blender and pureeing until smooth. (Alternatively, you could use an immersion blender for this step.)"

Output:
{
  "steps": [
    {
      "number": 1,
      "instruction": "In a large pot or Dutch oven, cook the onion until it softens, about 5 minutes.",
      "ingredients": ["onion"],
      "tips": [],
      "alternatives": []
    },
    {
      "number": 2,
      "instruction": "Add the sweet potatoes and apple and cook until they start to soften, 8 to 10 minutes.",
      "ingredients": ["sweet potatoes", "apple"],
      "tips": [],
      "alternatives": []
    },
    {
      "number": 3,
      "instruction": "Add the garlic, ginger, coriander, and smoked paprika and stir until fragrant.",
      "ingredients": ["garlic", "ginger", "coriander", "smoked paprika"],
      "tips": [],
      "alternatives": []
    },
    {
      "number": 4,
      "instruction": "Mix in the apple cider vinegar, followed by the broth and the coconut milk.",
      "ingredients": ["apple cider vinegar", "broth", "coconut milk"],
      "tips": [
        {
          "text": "I like to reserve 1/4 cup of my coconut milk for garnish. It creates such a pretty white swirl on the orange soup!",
          "trigger": "coconut milk"
        }
      ],
      "alternatives": []
    },
    {
      "number": 5,
      "instruction": "Bring the soup to a boil, cover the pot, and simmer until the sweet potatoes are tender.",
      "ingredients": ["sweet potatoes"],
      "tips": [],
      "alternatives": []
    },
    {
      "number": 6,
      "instruction": "Allow the soup to cool slightly before transferring it to a large blender and pureeing until smooth.",
      "ingredients": [],
      "tips": [],
      "alternatives": [
        {
          "text": "Alternatively, you could use an immersion blender for this step.",
          "position": "after"
        }
      ]
    }
  ]
}

Web content:
Title: ${content.title}
Description: ${content.description}
${content.instructionContent ? `Instructions: ${content.instructionContent.substring(0, 4000)}` : ''}
Recipe content: ${primaryContent.substring(0, 4000)}
Full text: ${content.text.substring(0, 5000)}

Return only valid JSON, no additional text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that extracts recipe instructions as structured steps. Always return valid JSON only. Remove all narrative, stories, and redundant content. Extract only clean, numbered cooking steps with tips and alternatives properly linked.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 4000
  });
  
  const result = parseJSON(response.choices[0].message.content);
  const rawSteps = Array.isArray(result.steps) ? result.steps : [];
  
  const steps = rawSteps
    .filter(s => s && typeof s === 'object' && (s.instruction != null || s.step))
    .map((step, index) => {
    const instruction = step.instruction ?? step.step ?? `Step ${index + 1}`;
    const normalizedStep = {
      ...step,
      number: index + 1,
      instruction: typeof instruction === 'string' ? instruction : String(instruction),
      ingredients: Array.isArray(step.ingredients) ? step.ingredients : [],
      tips: Array.isArray(step.tips) ? step.tips : [],
      alternatives: Array.isArray(step.alternatives) ? step.alternatives : []
    };
    
    if (normalizedStep.ingredients.length > 0 && ingredients.length > 0) {
      normalizedStep.ingredients = normalizedStep.ingredients
        .filter(n => typeof n === 'string')
        .map(ingName => {
          const lowerName = ingName.toLowerCase().trim();
          // Find matching ingredient (case-insensitive, handle plurals)
          const match = ingredients.find(ing => {
            const ingLower = ing.name.toLowerCase();
            return ingLower === lowerName || 
                   lowerName.includes(ingLower) || 
                   ingLower.includes(lowerName) ||
                   lowerName.replace(/s$/, '') === ingLower.replace(/s$/, '');
          });
          return match ? match.name : ingName;
        })
        .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates
    }
    
    return normalizedStep;
  });
  
  return steps;
}

/**
 * Normalizes aisle name to match predefined categories
 */
function normalizeAisle(aisleName) {
  if (aisleName == null || aisleName === '') return 'Other';
  const normalized = String(aisleName).trim();
  if (!normalized) return 'Other';
  const lower = normalized.toLowerCase();
  
  // Direct matches
  if (GROCERY_AISLES.includes(normalized)) {
    return normalized;
  }
  
  // Fuzzy matching
  if (lower.includes('produce') || lower.includes('vegetable') || lower.includes('fruit')) {
    return 'Produce';
  }
  if (lower.includes('meat') || lower.includes('seafood') || lower.includes('fish') || lower.includes('chicken') || lower.includes('beef')) {
    return 'Meat & Seafood';
  }
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese') || lower.includes('egg')) {
    return 'Dairy & Eggs';
  }
  if (lower.includes('bakery') || lower.includes('bread')) {
    return 'Bakery';
  }
  if (lower.includes('pantry') || lower.includes('dry') || lower.includes('spice') || lower.includes('flour') || lower.includes('grain')) {
    return 'Pantry/Dry Goods';
  }
  if (lower.includes('frozen')) {
    return 'Frozen';
  }
  if (lower.includes('beverage') || lower.includes('drink') || lower.includes('juice')) {
    return 'Beverages';
  }
  
  return 'Other';
}

/**
 * Applies user profile preferences to a recipe
 * Returns warnings and substitution suggestions
 */
export async function applyProfilePreferences(recipe, profile) {
  if (!profile) {
    return {
      warnings: [],
      substitutions: [],
      modifiedRecipe: recipe
    };
  }
  
  const warnings = [];
  const substitutions = [];
  const ingredientNames = recipe.ingredients.map(ing => ing.name.toLowerCase());
  
  // Check for allergies
  if (profile.allergies && profile.allergies.length > 0) {
    for (const allergy of profile.allergies) {
      const matchingIngredients = ingredientNames.filter(name => 
        name.includes(allergy.toLowerCase()) || 
        allergy.toLowerCase().includes(name) ||
        checkAllergyMatch(name, allergy.toLowerCase())
      );
      
      for (const ingName of matchingIngredients) {
        const originalIngredient = recipe.ingredients.find(ing => 
          ing.name.toLowerCase() === ingName
        );
        
        if (originalIngredient) {
          warnings.push({
            type: 'allergy',
            ingredient: originalIngredient.name,
            message: `Warning: This recipe contains ${originalIngredient.name}, which you're allergic to.`
          });
          
          // Suggest substitution for allergies
          try {
            const suggestion = await suggestSubstitutions(originalIngredient.name, 'allergy');
            if (suggestion) {
              substitutions.push({
                original: originalIngredient.name,
                suggested: suggestion,
                reason: `Allergy to ${allergy}`,
                status: 'pending'
              });
            }
          } catch (error) {
            console.error('Error suggesting substitution:', error);
          }
        }
      }
    }
  }
  
  // Check for dietary preferences
  if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
    const nonCompliantIngredients = checkDietaryCompliance(recipe.ingredients, profile.dietaryPreferences);
    
    for (const ingredient of nonCompliantIngredients) {
      warnings.push({
        type: 'dietary',
        ingredient: ingredient.name,
        message: `Warning: ${ingredient.name} may not align with your dietary preferences (${profile.dietaryPreferences.join(', ')}).`
      });
    }
  }
  
  // Check for bespoke preferences
  if (profile.bespokePreferences && profile.bespokePreferences.length > 0) {
    for (const preference of profile.bespokePreferences) {
      const matchingIngredients = ingredientNames.filter(name => 
        name.includes(preference.toLowerCase()) || 
        preference.toLowerCase().includes(name)
      );
      
      for (const ingName of matchingIngredients) {
        const originalIngredient = recipe.ingredients.find(ing => 
          ing.name.toLowerCase() === ingName
        );
        
        if (originalIngredient && !substitutions.find(s => s.original.toLowerCase() === ingName)) {
          try {
            const suggestion = await suggestSubstitutions(originalIngredient.name, 'preference');
            if (suggestion) {
              substitutions.push({
                original: originalIngredient.name,
                suggested: suggestion,
                reason: `Preference: avoiding ${preference}`,
                status: 'pending'
              });
            }
          } catch (error) {
            console.error('Error suggesting substitution:', error);
          }
        }
      }
    }
  }
  
  // Adjust step detail based on cooking style
  let modifiedSteps = recipe.steps || [];
  if (profile.cookingStyle && modifiedSteps.length > 0) {
    modifiedSteps = await adjustStepDetail(modifiedSteps, profile.cookingStyle, recipe.ingredients);
  }
  
  // Create modified recipe
  const modifiedRecipe = {
    ...recipe,
    steps: modifiedSteps
  };
  
  return {
    warnings,
    substitutions,
    modifiedRecipe
  };
}

/**
 * Checks if an ingredient name matches an allergy
 */
function checkAllergyMatch(ingredientName, allergy) {
  const allergyMap = {
    'alliums': ['onion', 'garlic', 'shallot', 'leek', 'chive', 'scallion'],
    'nuts': ['almond', 'walnut', 'pecan', 'hazelnut', 'cashew', 'pistachio', 'macadamia', 'brazil nut'],
    'peanuts': ['peanut'],
    'tree nuts': ['almond', 'walnut', 'pecan', 'hazelnut', 'cashew', 'pistachio', 'macadamia', 'brazil nut'],
    'shellfish': ['shrimp', 'crab', 'lobster', 'clam', 'mussel', 'oyster', 'scallop'],
    'fish': ['salmon', 'tuna', 'cod', 'halibut', 'sardine', 'anchovy', 'mackerel'],
    'eggs': ['egg'],
    'dairy': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream'],
    'soy': ['soy', 'soya', 'tofu', 'tempeh', 'miso'],
    'wheat': ['wheat', 'flour'],
    'gluten': ['wheat', 'flour', 'barley', 'rye', 'bulgur', 'couscous'],
    'sesame': ['sesame', 'tahini'],
    'mustard': ['mustard'],
    'sulfites': ['sulfite', 'sulphite'],
    'celery': ['celery'],
    'lupin': ['lupin', 'lupine']
  };
  
  if (allergyMap[allergy]) {
    return allergyMap[allergy].some(item => ingredientName.includes(item));
  }
  
  return false;
}

/**
 * Checks if ingredients comply with dietary preferences
 */
function checkDietaryCompliance(ingredients, dietaryPreferences) {
  const nonCompliant = [];
  
  const preferenceChecks = {
    'vegan': ['meat', 'chicken', 'beef', 'pork', 'fish', 'seafood', 'egg', 'dairy', 'milk', 'cheese', 'butter', 'honey'],
    'vegetarian': ['meat', 'chicken', 'beef', 'pork', 'fish', 'seafood'],
    'pescatarian': ['meat', 'chicken', 'beef', 'pork'],
    'gluten-free': ['wheat', 'flour', 'barley', 'rye', 'bulgur', 'couscous', 'pasta', 'bread'],
    'dairy-free': ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream'],
    'keto': ['sugar', 'flour', 'rice', 'pasta', 'bread', 'potato'],
    'paleo': ['dairy', 'milk', 'cheese', 'grain', 'wheat', 'legume', 'bean']
  };
  
  for (const preference of dietaryPreferences) {
    const checkList = preferenceChecks[preference.toLowerCase()] || [];
    
    for (const ingredient of ingredients) {
      const ingLower = ingredient.name.toLowerCase();
      const isNonCompliant = checkList.some(item => ingLower.includes(item));
      
      if (isNonCompliant && !nonCompliant.find(nc => nc.name === ingredient.name)) {
        nonCompliant.push(ingredient);
      }
    }
  }
  
  return nonCompliant;
}

/**
 * Suggests ingredient substitutions using AI
 */
async function suggestSubstitutions(ingredient, reason) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful cooking assistant that suggests ingredient substitutions. Return only the substitute ingredient name, nothing else.'
        },
        {
          role: 'user',
          content: `Suggest a good substitute for ${ingredient} (reason: ${reason}). Return only the ingredient name.`
        }
      ],
      max_tokens: 50,
      temperature: 0.3
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error suggesting substitution:', error);
    return null;
  }
}

/**
 * Adjusts step detail level based on cooking style (1-5 scale)
 */
async function adjustStepDetail(steps, cookingStyle, ingredients) {
  if (cookingStyle === 3) {
    // Default style, no changes needed
    return steps;
  }
  
  const styleDescriptions = {
    1: 'artist - concise, high-level instructions with creative freedom. Remove precise measurements and temperatures unless critical. Use phrases like "to taste" or "as needed".',
    2: 'brief - short instructions with some flexibility. Keep basic measurements but remove excessive detail.',
    3: 'balanced - moderate detail with standard measurements.',
    4: 'detailed - specific instructions with measurements, temperatures, and times where helpful.',
    5: 'scientist - precise, scientific instructions with exact measurements, temperatures (in both Fahrenheit and Celsius), times, and specific techniques. Include all technical details.'
  };
  
  const styleDescription = styleDescriptions[cookingStyle] || styleDescriptions[3];
  const ingredientList = ingredients.map(ing => `${ing.name}${ing.quantity ? ` (${ing.quantity})` : ''}`).join(', ');
  
  const prompt = `Adjust these recipe steps to match a ${styleDescription} cooking style.

Current steps:
${JSON.stringify(steps, null, 2)}

Available ingredients: ${ingredientList}

Return JSON with the same structure, but adjust the instruction text for each step according to the ${styleDescription} style. Keep the same number of steps, same ingredients references, same tips and alternatives. Only modify the instruction text detail level.

Return only valid JSON, no additional text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Adjust recipe step instructions to match the specified cooking style. Return valid JSON only with the same structure.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 4000
    });
    
    const result = parseJSON(response.choices[0].message.content);
    const adjusted = Array.isArray(result?.steps) ? result.steps : steps;
    return adjusted;
  } catch (error) {
    console.error('Error adjusting step detail:', error);
    return steps;
  }
}

/**
 * Retry extraction with a simpler prompt if JSON parsing fails
 * Falls back to simple format for backward compatibility
 */
async function retryExtraction(content) {
  try {
    // Try to extract ingredients first
    const ingredients = await extractIngredients(content);
    
    // Extract introduction
    const introduction = await extractIntroduction(content);
    
    // Try to extract steps, but if it fails, create simple steps from fullRecipeText
    try {
      const steps = await extractStructuredSteps(content, ingredients);
      return {
        title: content.title || 'Recipe',
        ingredients: ingredients,
        introduction: introduction,
        steps: steps
      };
    } catch (stepError) {
      // Fallback: extract as simple numbered steps
      const primaryContent = content.instructionContent || content.recipeContent || content.text.substring(0, 3000);
      const prompt = `Extract recipe steps as a simple numbered list. Return JSON:
{
  "steps": [
    {"number": 1, "instruction": "Step 1 text", "ingredients": [], "tips": [], "alternatives": []},
    {"number": 2, "instruction": "Step 2 text", "ingredients": [], "tips": [], "alternatives": []}
  ]
}

Extract ONLY numbered cooking steps. Remove narrative, introductory paragraphs, and ingredient lists.
${content.instructionContent ? `Instructions: ${content.instructionContent.substring(0, 2000)}` : ''}
Content: ${primaryContent.substring(0, 3000)}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Extract recipe steps as JSON. Return only numbered cooking steps. Remove introductory content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2000
      });
      
      const result = parseJSON(response.choices[0].message.content);
      const steps = Array.isArray(result?.steps) ? result.steps : [];
      return {
        title: content.title || 'Recipe',
        ingredients: ingredients,
        introduction: introduction,
        steps
      };
    }
  } catch (error) {
    throw new Error('Failed to extract recipe information');
  }
}
