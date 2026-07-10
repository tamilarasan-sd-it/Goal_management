import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import connectionPool from './database/dbConfig.js';
import { socketsConfig } from './sockets/socketConfig.js';
import { categoryRouter } from './routes/categoryRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { templateColumnsRouter } from './routes/templateColumnsRoutes.js';
import { templateGoalsRoutes } from './routes/templateGoalsRoutes.js';
import { templatepositionRouter } from './routes/templatesRoutes.js';
import { goalReviewerRouter } from './routes/goalReviewerRoutes.js';
import { goalViewsRouter } from './routes/goalViewsRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { goalHistoryRouter } from './routes/goalHistoryRoutes.js';

import monthlyUpdatesRoutes from './routes/monthlyUpdatesRoutes.js';
import monthlySchedulerRoutes from './routes/monthlySchedulerRoutes.js';
import viewGoalsRoutes from './routes/viewGoalsRoutes.js';

import { initializeMeetingCrons,SchedulerCallAlertCrons } from './services/meetingCronService.js';
import { subGoalHistoryRouter } from './routes/subGoalsHistoryRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// API routes
app.use('/api/v1/', categoryRouter);
app.use('/api/v1/', templateColumnsRouter);
app.use('/api/v1/', authRouter);
app.use('/api/v1/', templateGoalsRoutes);
app.use('/api/v1/', dashboardRouter);
app.use('/api/v1/', templatepositionRouter);
app.use('/api/v1/', goalReviewerRouter);
app.use('/api/v1/', goalViewsRouter);
app.use('/api/v1/', goalHistoryRouter);
app.use('/api/v1/', monthlyUpdatesRoutes);
app.use('/api/v1/', monthlySchedulerRoutes);
app.use('/api/v1/', viewGoalsRoutes);
app.use('/api/v1/', subGoalHistoryRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  const { url: urlToCheck, method: methodToCheck } = req.query;

  if (!urlToCheck || !methodToCheck) {
    return res.status(400).json({ status: 'error', message: 'Both URL and method must be provided for health check.' });
  }

  try {
    res.status(200).json({ status: 'healthy' });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ status: 'unhealthy', error: 'Internal server error' });
  }
});


// Disable caching for all API routes
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// ✅ Static files BEFORE catch-all
app.use(express.static(path.join(__dirname, '../dist')));

// ✅ SPA catch-all LAST
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Server & sockets
const server = http.createServer(app);
export const io = socketsConfig(server);

// Server config
const port = process.env.PORT || 8010;
const DOMAIN = process.env.BASE_URL || 'localhost';

// Database connection with retry
const handleDatabaseConnection = () => {
  connectionPool.getConnection((err, connection) => {
    if (err) {
      console.error('Error acquiring connection from pool:', err);
      setTimeout(handleDatabaseConnection, 5000);
    } else {
      console.log('Connected to the database');
      connection.release();
      server.listen(port, DOMAIN, () => {
        console.log(`Server running on port: ${port} and domain: ${DOMAIN}`);
        initializeMeetingCrons();
        SchedulerCallAlertCrons();
      });
    }
  });
};

handleDatabaseConnection();

// Function to check the availability of a service
const checkServiceAvailability = async (url, methodToCheck) => {
  let temp1 = url.split('?')[0];
  temp1 = temp1.replace(/\/+$/, '');

  const routes = extractRoutesFromApp();
  const matchedRoute = routes.find(route => route.path === temp1);

  if (matchedRoute && matchedRoute.methods.includes(methodToCheck.toUpperCase())) {
    return { healthy: true, service: url, methods: matchedRoute.methods };
  } else {
    return { healthy: false, service: url, error: 'Service not found in routes or method not allowed' };
  }
};

// Function to extract routes from the app
const extractRoutesFromApp = () => {
  const routes = [];
  const baseUrl = process.env.HEALTH_URL;
  const router = app._router || app.router;

  if (!router || !router.stack) {
    return routes;
  }

  router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(method => method.toUpperCase());
      routes.push({ path: `${baseUrl}${middleware.route.path}`, methods });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        const route = handler.route;
        if (route) {
          const methods = Object.keys(route.methods).map(method => method.toUpperCase());
          routes.push({ path: `${baseUrl}${route.path}`, methods });
        }
      });
    }
  });

  return routes;
};

// Note: If you encounter a port already in use issue,
// npx kill-port 8000