import express from 'express';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import recordRoutes from './routes/record.routes.js';
import { AppError } from './utils/AppError.js';

const app = express();

app.use(express.json());

// Global Rate Limiter for all routes (auth has its own specific overrides)
app.use(apiRateLimiter);

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/records', recordRoutes);

// Fallback 404 Route
app.use((req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] Finance Backend running on http://localhost:${PORT}`);
  });
}

export default app;
