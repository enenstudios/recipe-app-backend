# Recipe App Backend - Setup Instructions

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- Vercel or Railway account (for deployment)

## Local Development

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3000
NODE_ENV=development
```

### Step 3: Run the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

### Step 4: Test the API

```bash
curl -X POST http://localhost:3000/api/recipe/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.example-recipe-site.com/recipe"}'
```

## Deployment

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variable:
```bash
vercel env add OPENAI_API_KEY
```

4. Redeploy:
```bash
vercel --prod
```

### Railway

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Initialize project:
```bash
railway init
```

4. Set environment variable:
```bash
railway variables set OPENAI_API_KEY=your-key-here
```

5. Deploy:
```bash
railway up
```

## API Documentation

### POST /api/recipe/extract

Extracts recipe information from a URL.

**Request:**
```json
{
  "url": "https://example.com/recipe"
}
```

**Response (Success):**
```json
{
  "title": "Recipe Name",
  "fullRecipeText": "Complete recipe instructions...",
  "ingredients": [
    {
      "name": "Flour",
      "quantity": "2 cups",
      "aisle": "Pantry/Dry Goods"
    }
  ],
  "url": "https://example.com/recipe"
}
```

**Error Responses:**

- `400`: Invalid URL - "This doesn't look like a valid recipe link."
- `403`: Site blocked - "We couldn't access this site. Try another recipe."
- `422`: Not a recipe - "We couldn't find a recipe on this page."
- `500`: Server error - "Something went wrong — try again."

## Error Handling

The backend implements the following error handling strategy:

1. **Invalid URL**: Validates URL format and scheme before processing
2. **Site Blocked**: Detects 403/404 responses and fails fast
3. **Not a Recipe**: Uses AI to determine if content contains a recipe
4. **API Failures**: Implements retry logic (one retry) before failing
5. **Timeouts**: 10-second timeout on web scraping requests

All errors return user-friendly messages without stack traces.
