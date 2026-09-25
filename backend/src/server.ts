import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './services/socket';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Security & utility middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    
    // Auto-seed sample data if database is empty
    const { User } = await import('./models');
    const userCount = await User.countDocuments();
    if (userCount === 0 && env.NODE_ENV !== 'production') {
      console.log('[Server] Database is empty. Seeding initial data for SLG Luxury PG...');
      const { runSeed } = await import('./seed/seed');
      await runSeed(false);
      console.log('[Server] Initial data seeding complete!');
    }

    server.listen(env.PORT, () => {
      console.log(`[Server] SLG Luxury Ladies PG Backend API listening on port ${env.PORT} (${env.NODE_ENV})`);
      console.log(`[Server] Location: ${env.HOSTEL_LOCALITY}, ${env.HOSTEL_CITY}, ${env.HOSTEL_STATE}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export { app, server };
