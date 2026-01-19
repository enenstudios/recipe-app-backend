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
  console.error('Error:', err);
  
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }
  
  res.status(500).json({
    error: 'Something went wrong — try again.'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
