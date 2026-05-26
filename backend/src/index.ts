import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import uploadRoutes from './routes/upload';
import jobRoutes from './routes/jobs';
import productRoutes from './routes/products';
import dashboardRoutes from './routes/dashboard';
import competitorRoutes from './routes/competitor';
import alertRoutes from './routes/alerts';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o))) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Product Intelligence Dashboard API',
      version: '1.0.0',
      description: 'API for product data extraction, validation, competitor pricing, and alerts',
    },
    servers: [
      { url: process.env.NODE_ENV === 'production' ? process.env.BACKEND_URL || '' : `http://localhost:${PORT}` },
    ],
  },
  apis: [path.join(__dirname, './routes/*.ts'), path.join(__dirname, './routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', authRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api', authMiddleware, uploadRoutes);
app.use('/api', authMiddleware, jobRoutes);
app.use('/api', authMiddleware, productRoutes);
app.use('/api', authMiddleware, dashboardRoutes);
app.use('/api', authMiddleware, competitorRoutes);
app.use('/api', authMiddleware, alertRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
});

export default app;
