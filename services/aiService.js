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
 * Extracts recipe information from web content
 */
export async function extractRecipeFromContent(content) {
  try {
    const prompt = `Extract recipe information from the following web content. 

Return a JSON object with this exact structure:
{
  "title": "Recipe title",
  "fullRecipeText": "Complete recipe instructions and details",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": "amount (e.g., '2 cups', '1 tsp', '200g')",
      "aisle": "one of: ${GROCERY_AISLES.join(', ')}"
    }
  ]
}

Rules:
1. Title should be the recipe name
2. fullRecipeText should include all recipe instructions, steps, and details
3. For each ingredient, assign it to the most appropriate aisle from the list above
4. Quantity should include units (cups, tablespoons, grams, etc.) if mentioned
5. If quantity is not specified, use null
6. Only include ingredients that are actually part of the recipe

Web content:
Title: ${content.title}
Description: ${content.description}
Recipe content: ${content.recipeContent || content.text.substring(0, 3000)}
Full text: ${content.text.substring(0, 5000)}

Return only valid JSON, no additional text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts recipe information. Always return valid JSON only.'
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
    
    const jsonString = response.choices[0].message.content;
    const recipe = JSON.parse(jsonString);
    
    // Validate and normalize aisle assignments
    recipe.ingredients = recipe.ingredients.map(ing => ({
      ...ing,
      aisle: normalizeAisle(ing.aisle)
    }));
    
    return recipe;
  } catch (error) {
    console.error('Error extracting recipe:', error);
    
    if (error instanceof SyntaxError) {
      // Try one more time with a simpler prompt
      return retryExtraction(content);
    }
    
    throw error;
  }
}

/**
 * Normalizes aisle name to match predefined categories
 */
function normalizeAisle(aisleName) {
  if (!aisleName) return 'Other';
  
  const normalized = aisleName.trim();
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
 * Retry extraction with a simpler prompt if JSON parsing fails
 */
async function retryExtraction(content) {
  try {
    const prompt = `Extract recipe information. Return JSON:
{
  "title": "Recipe title",
  "fullRecipeText": "Recipe instructions",
  "ingredients": [{"name": "item", "quantity": "amount", "aisle": "Produce|Meat & Seafood|Dairy & Eggs|Bakery|Pantry/Dry Goods|Frozen|Beverages|Other"}]
}

Content: ${content.text.substring(0, 3000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract recipe as JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    
    const recipe = JSON.parse(response.choices[0].message.content);
    recipe.ingredients = recipe.ingredients.map(ing => ({
      ...ing,
      aisle: normalizeAisle(ing.aisle)
    }));
    
    return recipe;
  } catch (error) {
    throw new Error('Failed to extract recipe information');
  }
}
