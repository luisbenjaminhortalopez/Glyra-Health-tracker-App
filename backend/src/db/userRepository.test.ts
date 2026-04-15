import { initializeDatabase, closeDatabase } from './database';
import { getUser, createOrUpdateUser } from './userRepository';

describe('UserRepository', () => {
  beforeEach(async () => {
    await initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('getUser', () => {
    it('should return null when no user exists', () => {
      expect(getUser()).toBeNull();
    });

    it('should return the user after creation', () => {
      createOrUpdateUser('Juan');
      const user = getUser();
      expect(user).not.toBeNull();
      expect(user!.name).toBe('Juan');
      expect(user!.id).toBe(1);
      expect(user!.createdAt).toBeDefined();
    });
  });

  describe('createOrUpdateUser', () => {
    it('should create a new user with a valid name', () => {
      createOrUpdateUser('María');
      const user = getUser();
      expect(user!.name).toBe('María');
    });

    it('should update the existing user name', () => {
      createOrUpdateUser('Juan');
      createOrUpdateUser('Pedro');
      const user = getUser();
      expect(user!.name).toBe('Pedro');
      expect(user!.id).toBe(1);
    });

    it('should accept a name with exactly 1 character', () => {
      createOrUpdateUser('A');
      expect(getUser()!.name).toBe('A');
    });

    it('should accept a name with exactly 50 characters', () => {
      const name50 = 'a'.repeat(50);
      createOrUpdateUser(name50);
      expect(getUser()!.name).toBe(name50);
    });

    it('should throw for an empty name', () => {
      expect(() => createOrUpdateUser('')).toThrow('El nombre es obligatorio');
    });

    it('should throw for a name longer than 50 characters', () => {
      const name51 = 'a'.repeat(51);
      expect(() => createOrUpdateUser(name51)).toThrow('El nombre no puede exceder 50 caracteres');
    });
  });
});
