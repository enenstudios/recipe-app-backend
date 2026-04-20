import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { recipeRouter } from './routes/recipe.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Native mobile clients (URLSession) send no Origin header — allow them
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
}));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests \u2014 try again in a moment.' },
});
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '16kb' }));

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
    : { error: 'Something went wrong \u2014 try again.' };
  if (status === 500 && err.step) res.setHeader('X-Error-Step', err.step);
  return res.status(status).json(body);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
