import { classify } from './glucoseClassifier';

describe('GlucoseClassifierService', () => {
  describe('Hypoglycemia (priority, context-independent)', () => {
    it('should classify value < 70 as Hipoglucemia for fasting', () => {
      expect(classify(69, 'fasting')).toBe('Hipoglucemia');
    });

    it('should classify value < 70 as Hipoglucemia for post-meal', () => {
      expect(classify(69, 'post-meal')).toBe('Hipoglucemia');
    });

    it('should classify 0 as Hipoglucemia', () => {
      expect(classify(0, 'fasting')).toBe('Hipoglucemia');
    });
  });

  describe('Fasting context', () => {
    it('should classify 70 as Normal (lower boundary)', () => {
      expect(classify(70, 'fasting')).toBe('Normal');
    });

    it('should classify 99 as Normal (upper boundary)', () => {
      expect(classify(99, 'fasting')).toBe('Normal');
    });

    it('should classify 100 as Prediabetes (lower boundary)', () => {
      expect(classify(100, 'fasting')).toBe('Prediabetes');
    });

    it('should classify 125 as Prediabetes (upper boundary)', () => {
      expect(classify(125, 'fasting')).toBe('Prediabetes');
    });

    it('should classify 126 as Diabetes (lower boundary)', () => {
      expect(classify(126, 'fasting')).toBe('Diabetes');
    });

    it('should classify 200 as Diabetes (high value)', () => {
      expect(classify(200, 'fasting')).toBe('Diabetes');
    });
  });

  describe('Post-meal context', () => {
    it('should classify 70 as Normal (lower boundary)', () => {
      expect(classify(70, 'post-meal')).toBe('Normal');
    });

    it('should classify 139 as Normal (upper boundary)', () => {
      expect(classify(139, 'post-meal')).toBe('Normal');
    });

    it('should classify 140 as Elevado (lower boundary)', () => {
      expect(classify(140, 'post-meal')).toBe('Elevado');
    });

    it('should classify 199 as Elevado (upper boundary)', () => {
      expect(classify(199, 'post-meal')).toBe('Elevado');
    });

    it('should classify 200 as Diabetes (lower boundary)', () => {
      expect(classify(200, 'post-meal')).toBe('Diabetes');
    });

    it('should classify 300 as Diabetes (high value)', () => {
      expect(classify(300, 'post-meal')).toBe('Diabetes');
    });
  });
});
