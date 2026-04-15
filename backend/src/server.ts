import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database';
import userRoutes from './routes/userRoutes';
import glucoseRoutes from './routes/glucoseRoutes';
import bloodPressureRoutes from './routes/bloodPressureRoutes';
import weightRoutes from './routes/weightRoutes';
import exerciseRoutes from './routes/exerciseRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/glucose', glucoseRoutes);
app.use('/api/blood-pressure', bloodPressureRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/exercise', exerciseRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  const statusCode = (err as any).statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Error interno del servidor',
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer(): Promise<void> {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error al iniciar el servidor: ${message}`);
    process.exit(1);
  }
}

// Only start listening when this file is run directly (not imported for tests)
if (require.main === module) {
  startServer();
}

export { app, startServer };
