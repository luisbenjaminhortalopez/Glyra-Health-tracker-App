import { initializeDatabase, getDatabase, closeDatabase } from './database';

describe('Database initialization', () => {
  afterEach(() => {
    closeDatabase();
  });

  it('should initialize an in-memory database and return a Database instance', async () => {
    const db = await initializeDatabase(':memory:');
    expect(db).toBeDefined();
    expect(typeof db.run).toBe('function');
    expect(typeof db.exec).toBe('function');
  });

  it('should create all required tables', async () => {
    const db = await initializeDatabase(':memory:');

    const result = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    const tableNames = result[0].values.map((row) => row[0] as string).sort();

    expect(tableNames).toEqual([
      'blood_pressure_records',
      'exercise_weekly',
      'glucose_records',
      'user_config',
      'weight_records',
    ]);
  });

  it('should be idempotent — calling initializeDatabase twice does not throw', async () => {
    await initializeDatabase(':memory:');
    closeDatabase();
    await expect(initializeDatabase(':memory:')).resolves.toBeDefined();
  });

  it('getDatabase should return the initialized instance', async () => {
    const db = await initializeDatabase(':memory:');
    expect(getDatabase()).toBe(db);
  });

  it('getDatabase should throw if database is not initialized', () => {
    expect(() => getDatabase()).toThrow(
      'La base de datos no ha sido inicializada'
    );
  });

  it('should enforce user_config name constraint (1-50 chars)', async () => {
    const db = await initializeDatabase(':memory:');

    // Valid name — should not throw
    expect(() =>
      db.run('INSERT INTO user_config (name) VALUES (?)', ['Juan'])
    ).not.toThrow();

    // Empty name should fail
    expect(() =>
      db.run('INSERT INTO user_config (name) VALUES (?)', [''])
    ).toThrow();

    // 51-char name should fail
    const longName = 'a'.repeat(51);
    expect(() =>
      db.run('INSERT INTO user_config (name) VALUES (?)', [longName])
    ).toThrow();
  });

  it('closeDatabase should allow re-initialization', async () => {
    await initializeDatabase(':memory:');
    closeDatabase();
    expect(() => getDatabase()).toThrow();
    const db2 = await initializeDatabase(':memory:');
    expect(getDatabase()).toBe(db2);
  });
});
