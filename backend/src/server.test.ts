import { app } from './server';
import { initializeDatabase, closeDatabase } from './db/database';

// Use a lightweight approach — we don't need supertest, just verify the app is configured
describe('Express server setup', () => {
  beforeAll(async () => {
    await initializeDatabase(':memory:');
  });

  afterAll(() => {
    closeDatabase();
  });

  it('should export an express app', () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('should have JSON body parser middleware configured', () => {
    // Express stores middleware in the _router stack
    const stack = (app as any)._router.stack;
    const jsonParser = stack.find(
      (layer: any) => layer.name === 'jsonParser'
    );
    expect(jsonParser).toBeDefined();
  });

  it('should have CORS middleware configured', () => {
    const stack = (app as any)._router.stack;
    const corsMiddleware = stack.find(
      (layer: any) => layer.name === 'corsMiddleware'
    );
    expect(corsMiddleware).toBeDefined();
  });

  it('should mount all 5 API route paths', () => {
    const stack = (app as any)._router.stack;
    const routePaths = stack
      .filter((layer: any) => layer.name === 'router')
      .map((layer: any) => layer.regexp.toString());

    // Verify each route prefix is mounted
    expect(routePaths.some((r: string) => r.includes('user'))).toBe(true);
    expect(routePaths.some((r: string) => r.includes('glucose'))).toBe(true);
    expect(routePaths.some((r: string) => r.includes('blood'))).toBe(true);
    expect(routePaths.some((r: string) => r.includes('weight'))).toBe(true);
    expect(routePaths.some((r: string) => r.includes('exercise'))).toBe(true);
  });

  it('should have error handling middleware', () => {
    const stack = (app as any)._router.stack;
    // Error handlers have 4 params (err, req, res, next) — Express marks them with length 4
    const errorHandlers = stack.filter(
      (layer: any) => layer.handle && layer.handle.length === 4
    );
    expect(errorHandlers.length).toBeGreaterThanOrEqual(1);
  });
});
