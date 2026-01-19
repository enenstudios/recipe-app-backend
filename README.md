# Recipe App Backend

Node.js/Express backend service for recipe extraction from URLs.

## Features

- URL validation and sanitization
- Web scraping with error handling
- OpenAI integration for recipe extraction
- Structured recipe data with ingredients grouped by grocery aisle

## Requirements

- Node.js 18+
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

3. Deploy to Vercel or Railway:
```bash
# Vercel
vercel deploy

# Railway
railway up
```

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## API Endpoints

- `POST /api/recipe/extract`: Extract recipe from URL
  - Body: `{ "url": "https://example.com/recipe" }`
  - Returns: Recipe data with ingredients organized by aisle
