import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { recipeRouter } from './routes/recipe.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/recipe', recipeRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[extract] middleware:', err.message, 'statusCode=', err.statusCode, 'step=', err.step, 'cause=', err.cause?.message);
  if (err.stack) console.error('[extract] stack:', err.stack.slice(0, 600));
  
  const status = err.statusCode || 500;
  const body = err.statusCode
    ? { error: err.message }
    : { error: 'Something went wrong — try again.' };
  if (status === 500 && err.step) res.setHeader('X-Error-Step', err.step);
  return res.status(status).json(body);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
